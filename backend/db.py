from pymongo import MongoClient
import os
import bcrypt

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["chatbot_db"]
users_collection = db["users"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]
usage_metadata_collection = db["usage_metadata"]

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt)


def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed)
