from utilities import run_agent, initialize_artifact, update_artifact, ask_braces
import bridge

user_context = {
    "name": "John",
    "goals": ["Learn Machine Learning", "Learn C++"],
    "schedule": {
        "Monday": "Learn Python",
        "Tuesday": "ML Project",
        "Wednesday": "Assignment due"
    },
    "tone": "short and friendly",
    "study_time": "evening",
    "health_goals": ["Sleep better", "Drink more water", "Exercise 3x a week"],
    "health_conditions": ["mild anxiety"]
}




initialize_artifact("memory", user_context)
initialize_artifact("pref", user_context)
initialize_artifact("schedule", user_context)
initialize_artifact("health", user_context)
initialize_artifact("resv", user_context)


print(f"User context initialized: {user_context}")
print("Initialized artifacts for BRACES agents!")
