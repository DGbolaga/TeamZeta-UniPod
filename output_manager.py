import os
import json
from datetime import datetime

RESPONSES_DIR = 'responses'
os.makedirs(RESPONSES_DIR, exist_ok=True)

def save_user_response(session_id, step, data):
    """Save individual step responses to text files for AI model integration"""
    timestamp = datetime.now().isoformat()
    filename = f'{RESPONSES_DIR}/{session_id}_{step}.json'
    with open(filename, 'w') as f:
        json.dump({'step': step, 'timestamp': timestamp, 'data': data}, f, indent=2)


def compile_user_context(session_id):
    """Compile all responses into a single dict for AI model processing"""
    context = {'session_id': session_id, 'timestamp': datetime.now().isoformat(), 'responses': {}}
    for step in range(1, 5):
        filename = f'{RESPONSES_DIR}/{session_id}_step{step}.json'
        if os.path.exists(filename):
            with open(filename) as f:
                context['responses'][f'step{step}'] = json.load(f)['data']
        else:
            context['responses'][f'step{step}'] = {}
    return context 