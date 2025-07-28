import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPEN_ROUTER_KEY")

def run_agent(model: str, artifact: str, message: str, temperature: float = 0.6) -> str:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": model,
            "temperature": temperature,
            "messages": [{"role": "system", "content": artifact}, {"role": "user", "content": message}] #switch between system and user to see which is better
        }
    )
    data = response.json()

# user_context = {
#     "name": "John
#     return data['choices'][0]['message']['content']


def initialize_artifact(role: str, user_context: dict) -> str:
    name = user_context.get("name", "User")
    goals = ", ".join(user_context.get("goals", []))
    schedule = user_context.get("schedule", {})
    tone = user_context.get("tone", "neutral")
    study_time = user_context.get("study_time", "unspecified")
    health_goals = ", ".join(user_context.get("health_goals", []))
    health_conditions = ", ".join(user_context.get("health_conditions", []))


    if role == "memory":
        artifact = f"""You are the memory agent for BRACES. Here is what you know:
- User's name: {name}
- Goal(s): {goals}
- Prefers learning in the {study_time}

User just asked something. Respond with relevant memory-based guidance only."""
    
        with open("memory_artifact.txt", "w") as f:
            f.write(artifact)
        # return artifact


    elif role == "pref":
        artifact = f"""You are the preference agent for BRACES.
The user prefers:
- Response tone: {tone}
- Learning time: {study_time}
Only return tone/style guidance relevant to the user's input."""
        with open("preference_artifact.txt", "w") as f:
            f.write(artifact)
        # return artifact


    elif role == "schedule":
        # schedule = "\n".join([f"- {day}: {task}" for day, task in schedule.items()])
        artifact = f"""You are the schedule agent. Here's the user's current week:
{schedule}

Use this to determine what tasks are most urgent or relevant today based on user input."""

        with open("schedule_artifact.txt", "w") as f:
            f.write(artifact)


    elif role == "health":
        artifact = f"""You are the health guidance agent for BRACES.
Here is what you know about the user:
- Name: {name}
- Health goal(s): {health_goals or 'Not specified'}
- Known condition(s): {health_conditions or 'None'}

Provide personalized, general wellness tips, routines, or advice when prompted — in a supportive tone. Be empathetic, concise, and practical."""
        
        with open("health_artifact.txt", "w") as f:
            f.write(artifact)


    elif role == "resv":
        artifact = f"""You are the Resolver Agent for BRACES.
You receive output from:
- The Memory Agent
- The Preference Agent
- The Schedule Agent
- The Health Guidance Agent

You must combine them to form a final, helpful response in the user's preferred style.
Please don't provide the response using markdown"""

        with open("resolver_artifact.txt", "w") as f:
            f.write(artifact)

    else:
        raise ValueError(f"Unknown role: {role}")
    

def update_artifact(artifact: str, new_info: str) -> str:
    pass
    #will create a utility function that updates the artifact with new information


def ask_braces(model: str, question: str, temperature: float = 0.5) -> str:
    # initialize_artifact("memory", user_context)
    # initialize_artifact("pref", user_context)
    # initialize_artifact("schedule", user_context)
    # initialize_artifact("health", user_context)
    # initialize_artifact("resv", user_context)

    memory_artifact = open("memory_artifact.txt").read()
    pref_artifact = open("preference_artifact.txt").read()
    schedule_artifact = open("schedule_artifact.txt").read()
    health_artifact = open("health_artifact.txt").read()
    resolver_artifact = open("resolver_artifact.txt").read()

    print("Artifacts loaded successfully!")

    artifacts = [memory_artifact, pref_artifact, schedule_artifact, health_artifact, resolver_artifact]
    
    print("About to run memory agent...")
    memory_response = run_agent(model=model, artifact=memory_artifact, message=question, temperature=temperature)
    
    print("About to run preference agent...")
    pref_response = run_agent(model=model, artifact=pref_artifact, message=question, temperature=temperature)
    
    print("About to run schedule agent...")
    schedule_response = run_agent(model=model, artifact=schedule_artifact, message=question, temperature=temperature)
    
    print("About to run health guidance agent...")
    health_response = run_agent(model=model, artifact=health_artifact, message=question, temperature=temperature)
    
    print("About to run resolver agent...")
    resolver_message = f"""User question: {question}
Memory agent: {memory_response}
Preference agent: {pref_response}
Schedule agent: {schedule_response}
Health Guidance agent: {health_response}

"""

    resolver_response = run_agent(model=model, artifact=resolver_artifact, message=resolver_message, temperature=temperature)
    
    print("All agents have responded successfully!")

    return resolver_response