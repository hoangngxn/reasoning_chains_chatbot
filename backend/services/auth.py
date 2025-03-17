from http.client import HTTPException
import bcrypt
from db import users_collection
import os
import jwt
from datetime import datetime, timedelta
from fastapi import Request
def register_user(email, password, username):
    if users_collection.find_one({"email": email}):
        return False

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({"username": username,"email":email, "password": hashed})
    return True

SECRET_KEY = os.getenv("SECRET_KEY")

def generate_jwt(user_id):
    expiration = datetime.utcnow() + timedelta(days=1)
    payload = {"user_id": str(user_id), "exp": expiration}
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def verify_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_id_from_request(request: Request):
    tk = request.headers.get("Authorization")
    token = tk.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        user_id = verify_jwt(token)  
        return user_id
    except Exception as e:
        return None
