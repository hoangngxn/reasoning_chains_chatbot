import os
import google.generativeai as genai


genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

settings = {
    "model": "gemini-2.0-flash",
    "temperature": 0.1,
    "max_output_tokens": 10,
}

model = genai.GenerativeModel(settings["model"])


def is_complex_prompt(user_prompt):
    system_prompt = "You are an AI that evaluates prompt complexity."
    evaluation_prompt = (
        """Analyze the following prompt and determine if it requires multiple answers, 
        has multiple valid interpretations, or can be approached in different ways.
        Consider whether it allows for stylistic choices, different levels of detail,
        or varying perspectives. Respond with TRUE if multiple distinct answers are 
        valid or the user asks you to respond in two ways, and FALSE if only one clear 
        answer exists. Do not provide any explanation. Only return TRUE or FALSE. 
        Here is the prompt:\n\n"""
        + user_prompt
    )

    try:
        response = model.generate_content(evaluation_prompt)
        content = response.text.strip().lower()

        return content == "true"
    except Exception:
        return False
