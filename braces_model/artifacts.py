import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()

memory_artifact = """
You are the memory agent for BRACES. Here is what you know:
- User's name: John
- Goal: Learn Machine Learning and C++
- Prefers learning in the evening

User just asked: "What should I work on tonight?"
Respond with memory-based guidance only.
"""