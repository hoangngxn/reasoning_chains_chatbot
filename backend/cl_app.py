import os
import google.generativeai as genai
import asyncio
import requests
from services.auth import verify_jwt
import chainlit as cl
from db import users_collection, conversations_collection, usage_metadata_collection
from bson import ObjectId
import jwt
from config import INSTRUCTION_PROMPT
import json
from datetime import datetime
from evaluate import is_complex_prompt

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

settings = {
    "model": "gemini-2.0-flash",
    "temperature": 0.7,
    "max_output_tokens": 500,
}
newchat = False
model = genai.GenerativeModel(settings["model"])


def save_usage_metadata(
    user_id, prompt_token_count, candidates_token_count, selected_model
):
    usage_metadata_collection.insert_one(
        {
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "prompt_token_count": prompt_token_count,
            "candidates_token_count": candidates_token_count,
            "model": selected_model,
        }
    )


async def call_gemini(
    message_history, prompted_message_content, user_id, selected_model
):
    try:
        convo = model.start_chat(history=message_history)
        response = convo.send_message(prompted_message_content)
        prompt_token_count = getattr(response.usage_metadata, "prompt_token_count", 0)
        candidates_token_count = getattr(
            response.usage_metadata, "candidates_token_count", 0
        )
        save_usage_metadata(
            user_id, prompt_token_count, candidates_token_count, "gemini-2.0-flash"
        )
        return response.text
    except Exception as e:
        return f"Error calling Gemini API: {str(e)}"


async def call_llama(prompted_message_content, user_id):
    try:
        payload = {
            "model": "llama3.2:latest",
            "messages": [{"role": "user", "content": prompted_message_content}],
            "stream": False,
        }
        headers = {"Content-Type": "application/json"}

        ollama_response = requests.post(OLLAMA_API_URL, json=payload, headers=headers)
        ollama_response.raise_for_status()
        response_json = ollama_response.json()
        prompt_token_count = response_json.get("prompt_eval_count", 0)
        candidates_token_count = response_json.get("eval_count", 0)
        save_usage_metadata(
            user_id, prompt_token_count, candidates_token_count, payload["model"]
        )
        return response_json.get("message", {}).get(
            "content", "Error: No content returned from Ollama."
        )
    except Exception as e:
        return f"Error calling Ollama API: {str(e)}"


@cl.on_chat_start
async def on_chat_start():
    user_env = cl.user_session.get("env")
    if isinstance(user_env, str):
        user_env = json.loads(user_env)

    token = user_env["Authorization"].replace("Bearer ", "")
    try:
        user_id = verify_jwt(token)
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            current_user = cl.User(
                identifier=user["email"],
                metadata={"user_id": str(user["_id"]), "role": "user"},
            )
            cl.user_session.set("identifier", current_user.identifier)
            cl.user_session.set("metadata", current_user.metadata)
            cl.context.session.user = current_user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
        return None

    if not user:
        return
    cl.user_session.set("message_history", [])


@cl.on_message
async def on_message(message: cl.Message):
    selected_conversation_id = message.metadata.get("conversation_id")
    selected_model = message.metadata.get("model")
    current_conversation_id = cl.user_session.get("conversation_id")
    message_history = cl.user_session.get("message_history")
    metadata = cl.user_session.get("metadata")
    user_id = metadata["user_id"]

    if selected_conversation_id and selected_conversation_id != current_conversation_id:
        cl.user_session.set("conversation_id", selected_conversation_id)
        existing_conversation = conversations_collection.find_one(
            {"_id": ObjectId(selected_conversation_id)}
        )
        if existing_conversation:
            db_messages = existing_conversation["messages"]
            converted_history = []
            for msg in db_messages:
                for sub_msg in msg.get("messages", []):
                    converted_history.append(
                        {"role": msg["role"], "parts": [{"text": sub_msg["text"]}]}
                    )
            message_history = converted_history
        else:
            message_history = []
        cl.user_session.set("message_history", message_history)

    if not selected_conversation_id:
        conversation = {"user_id": user_id, "messages": []}
        conversation_id = str(
            conversations_collection.insert_one(conversation).inserted_id
        )
        cl.user_session.set("conversation_id", conversation_id)
        message_history = []

    current_time = datetime.now().isoformat()
    original_user_message = {"role": "user", "parts": [{"text": message.content}]}
    prompted_message_content = f"{INSTRUCTION_PROMPT}\n{message.content}"
    message_history.append(original_user_message)

    # Check if prompt is complex
    is_complex = is_complex_prompt(message.content)

    # Initialize response variables
    gemini_response_text = ""
    llama_response_text = ""

    if is_complex:
        # Call both models concurrently
        gemini_task = asyncio.create_task(
            call_gemini(
                message_history, prompted_message_content, user_id, selected_model
            )
        )
        llama_task = asyncio.create_task(call_llama(prompted_message_content, user_id))
        gemini_response_text, llama_response_text = await asyncio.gather(
            gemini_task, llama_task
        )

    else:
        # Call only the selected model
        if selected_model == "gemini-2.0-flash":
            gemini_response_text = await call_gemini(
                message_history, prompted_message_content, user_id, selected_model
            )
        elif selected_model == "llama3.2:latest":
            llama_response_text = await call_llama(prompted_message_content, user_id)

    # Prepare response message in required format
    response_content = [
        (
            {"model": "gemini-2.0-flash", "text": gemini_response_text}
            if gemini_response_text
            else None
        ),
        (
            {"model": "llama3.2:latest", "text": llama_response_text}
            if llama_response_text
            else None
        ),
    ]
    response_content = [
        entry for entry in response_content if entry
    ]  # Remove None entries

    response_msg = cl.Message(
        content=json.dumps(response_content, ensure_ascii=False, indent=2)
    )
    response_msg.metadata = {
        "conversation_id": str(cl.user_session.get("conversation_id")),
        "message_type": "multiple" if is_complex else "single",
    }
    await response_msg.send()

    # Store responses in message history
    if gemini_response_text:
        message_history.append(
            {"role": "assistant", "parts": [{"text": gemini_response_text}]}
        )
    if llama_response_text:
        message_history.append(
            {"role": "assistant", "parts": [{"text": llama_response_text}]}
        )

    # Store user message in the database in the new format
    conversations_collection.update_one(
        {"_id": ObjectId(cl.user_session.get("conversation_id"))},
        {
            "$push": {
                "messages": {
                    "role": "user",
                    "timestamp": current_time,
                    "messages": [{"model": selected_model, "text": message.content}],
                }
            }
        },
    )

    # Prepare assistant responses
    assistant_messages = []
    for model, text in [
        ("gemini-2.0-flash", gemini_response_text),
        ("llama3.2:latest", llama_response_text),
    ]:
        if text:
            assistant_messages.append({"model": model, "text": text})

    # Store assistant response in the new format
    if assistant_messages:
        conversations_collection.update_one(
            {"_id": ObjectId(cl.user_session.get("conversation_id"))},
            {
                "$push": {
                    "messages": {
                        "role": "assistant",
                        "timestamp": current_time,
                        "messages": assistant_messages,
                    }
                }
            },
        )
