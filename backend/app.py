from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
from chainlit.utils import mount_chainlit
from db import users_collection, verify_password
from services.auth import generate_jwt, register_user
from pydantic import BaseModel
from fastapi.responses import RedirectResponse
import os
from services.auth import get_user_id_from_request
from db import users_collection, conversations_collection, usage_metadata_collection
from bson import ObjectId
from llm import LLM_LIST
import requests
from datetime import datetime, timedelta

app = FastAPI()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
REDIRECT_CLIENT_GOOGLE = os.getenv("REDIRECT_CLIENT_GOOGLE")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "API is running..."}


class LoginUser(BaseModel):
    email: str
    password: str


class RegisterUser(BaseModel):
    username: str
    password: str
    email: str


@app.post("/login")
async def login(user: LoginUser):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if verify_password(user.password, db_user["password"]):
        token = generate_jwt(str(db_user["_id"]))
        return {"token": token}

    raise HTTPException(status_code=400, detail="Invalid credentials")


@app.post("/register")
async def register(user: RegisterUser):
    if not register_user(user.email, user.password, user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    return {"message": "User registered successfully"}


@app.get("/auth/google")
async def google_login():
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri={REDIRECT_URI}/auth/google/callback&response_type=code&scope=openid%20email%20profile"
    )


@app.get("/auth/google/callback")
async def google_callback(code: str):
    try:
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI + "/auth/google/callback",
            "grant_type": "authorization_code",
        }
        response = requests.post(token_url, data=payload)
        token_data = response.json()
        if "access_token" not in token_data:
            return {"error": "Invalid token"}
        access_token = token_data["access_token"]

        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        user_info_response = requests.get(
            user_info_url, headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_info_response.json()

        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        sub = user_info.get("sub")

        if not email:
            return {"error": "Unauthorized"}

        db_user = users_collection.find_one({"email": email})
        if db_user:
            user_id = str(db_user["_id"])
        else:
            new_user = {
                "email": email,
                "username": name,
                "picture": picture,
                "sub": sub,
            }
            result = users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
        jwt_token = generate_jwt(str(user_id))
        return RedirectResponse(
            f"{REDIRECT_CLIENT_GOOGLE}/oauth2/redirect?token="
            + jwt_token
            + "&userId="
            + user_id
        )
    except Exception as e:
        return {"error": str(e)}


@app.get("/info")
async def get_info_user(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_info = {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "username": user.get("username", ""),
            "picture": user.get("picture", ""),
        }
        return user_info

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/conversations")
async def get_conversations(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        conversations = list(conversations_collection.find({"user_id": user_id}))
        elements = []

        for convo in conversations:
            messages = convo.get("messages", [])
            short_content = "No Msg"

            if messages:
                first_message_entry = messages[0].get("messages", [])
                if first_message_entry:
                    first_message_text = first_message_entry[0].get("text", "")
                    words = first_message_text.split()
                    short_content = " ".join(words[:6]) if words else "No Msg"

            elements.append({"id_conv": str(convo["_id"]), "content": short_content})

        return elements
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, request: Request):
    try:
        user_id = get_user_id_from_request(request)

        conversation = conversations_collection.find_one(
            {"_id": ObjectId(conv_id), "user_id": user_id}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        conversations_collection.delete_one({"_id": ObjectId(conv_id)})
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/history/{conv_id}")
async def get_history(conv_id: str, request: Request):
    try:
        user_id = get_user_id_from_request(request)
        conversation = conversations_collection.find_one(
            {"_id": ObjectId(conv_id), "user_id": user_id}
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation.get("messages", [])
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/usage")
async def get_usage_metadata(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        usage_data = list(
            usage_metadata_collection.find({"user_id": user_id}).sort("timestamp", -1)
        )
        if not usage_data:
            raise HTTPException(
                status_code=404, detail="No usage data found for this user"
            )
        for entry in usage_data:
            entry["_id"] = str(entry["_id"])
        return {"user_id": user_id, "usage_data": usage_data}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/usage/total")
async def get_total_usage_by_model(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        model = request.query_params.get("model")  # get model from query parameters

        if not model:
            raise HTTPException(status_code=400, detail="Model parameter is required")

        pipeline = [
            {
                "$match": {"user_id": user_id, "model": model}
            },  # filter by user_id and model
            {
                "$group": {
                    "_id": None,
                    "total_tokens": {
                        "$sum": {
                            "$add": ["$prompt_token_count", "$candidates_token_count"]
                        }
                    },
                }
            },
        ]

        result = list(usage_metadata_collection.aggregate(pipeline))

        total_tokens = result[0]["total_tokens"] if result else 0

        return {"user_id": user_id, "model": model, "total_tokens": total_tokens}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/usage/summary")
async def get_total_usage(request: Request):
    try:
        user_id = get_user_id_from_request(request)

        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": None,
                    "total_tokens": {
                        "$sum": {
                            "$add": ["$prompt_token_count", "$candidates_token_count"]
                        }
                    },
                }
            },
        ]

        result = list(usage_metadata_collection.aggregate(pipeline))

        total_tokens = result[0]["total_tokens"] if result else 0

        return {"user_id": user_id, "total_tokens": total_tokens}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/usage/last-days-summary")
async def get_weekly_usage_summary(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        # last 10 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=10)
        # filter data with 2 models
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "model": {"$in": ["gemini-2.0-flash", "llama3.2:latest"]},
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$timestamp",
                            }
                        },
                        "model": "$model",
                    },
                    "total_tokens": {
                        "$sum": {
                            "$add": ["$prompt_token_count", "$candidates_token_count"]
                        }
                    },
                }
            },
            {"$sort": {"_id.date": 1}},
        ]
        result = list(usage_metadata_collection.aggregate(pipeline))
        usage_summary = {}
        for item in result:
            date = item["_id"]["date"]
            reversed_date = datetime.strptime(date, "%Y-%m-%d").strftime("%d-%m-%Y")
            model = item["_id"]["model"]

            if reversed_date not in usage_summary:
                usage_summary[reversed_date] = {
                    "date": reversed_date,
                    "gemini-2.0-flash": 0,
                    "llama3.2:latest": 0,
                }
            if model == "gemini-2.0-flash":
                usage_summary[reversed_date]["gemini-2.0-flash"] = item["total_tokens"]
            elif model == "llama3.2:latest":
                usage_summary[reversed_date]["llama3.2:latest"] = item["total_tokens"]
        usage_summary_list = list(usage_summary.values())
        return {"user_id": user_id, "usage_summary": usage_summary_list}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/models")
async def get_llm_list():
    return {"models": LLM_LIST}


mount_chainlit(app=app, target="cl_app.py", path="/chainlit")
