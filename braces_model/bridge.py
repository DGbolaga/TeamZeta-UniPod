import requests
import json
import os
import dotenv
from braces_model import utilities

 
MODEL_ID = "deepseek/deepseek-r1-0528:free" #mistralai/mistral-small-3.1-24b-instruct:free #mistralai/mistral-7b-instruct:free
API_KEY = os.getenv("OPEN_ROUTER_KEY")

user_question = "What should I work on tonight?"

messages = [{"role": "system", "content": user_question}]

if __name__ == "__main__":
    response = utilities.ask_braces(MODEL_ID, user_question)
    print(f"Response: {response}")

