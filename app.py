from braces_model import bridge
from braces_model import run_agent, initialize_artifact, update_artifact, ask_braces
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
from datetime import datetime

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'your-secret-key-here'

# Create directories for storing responses
os.makedirs('responses', exist_ok=True)
os.makedirs('chat_logs', exist_ok=True)

@app.route('/')
def index():
    return render_template('multi_step_form.html')

@app.route('/step/<int:step_num>')
def step(step_num):
    if step_num < 1 or step_num > 4:
        return redirect(url_for('index'))
    return render_template(f'page{step_num}.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/submit_form', methods=['POST'])
def submit_form():
    # For now, just print form data and return a success message
    form_data = request.form.to_dict()

    initialize_artifact("memory", form_data)
    initialize_artifact("pref", form_data)
    initialize_artifact("schedule", form_data)
    initialize_artifact("health", form_data)
    initialize_artifact("resv", form_data)

    print(f"User context initialized: {form_data}")
    print("Initialized artifacts for BRACES agents!")
    print(form_data)
    
    # TODO: Save to database or file, process, etc.

    return "Form submitted successfully!"



@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    message = data.get('message', '')
    
    # Here you would integrate your AI model
    # For now, returning a placeholder response
    ai_response = process_with_ai_model(message)
    
    # Log the conversation
    log_chat_message(message, ai_response)
    
    return jsonify({'response': ai_response})

def save_response_to_file(step, data):
    """Save individual step responses to text files for AI model integration"""
    timestamp = datetime.now().isoformat()
    session_id = session.get('session_id', generate_session_id())
    session['session_id'] = session_id
    
    filename = f'responses/{session_id}_{step}.txt'
    
    with open(filename, 'w') as f:
        f.write(f"Step: {step}\n")
        f.write(f"Timestamp: {timestamp}\n")
        f.write(f"Data: {json.dumps(data, indent=2)}\n")

def compile_all_responses():
    """Compile all responses into a single file for AI model processing"""
    session_id = session.get('session_id')
    if not session_id:
        return
    
    compiled_data = {
        'session_id': session_id,
        'timestamp': datetime.now().isoformat(),
        'responses': {
            'step1': session.get('step1', {}),
            'step2': session.get('step2', {}),
            'step3': session.get('step3', {}),
            'step4': session.get('step4', {}),
            'step5': session.get('step5', {})
        }
    }
    
    filename = f'responses/{session_id}_complete.txt'
    with open(filename, 'w') as f:
        f.write("COMPLETE ASSESSMENT RESPONSES\n")
        f.write("=" * 50 + "\n\n")
        
        for step, data in compiled_data['responses'].items():
            f.write(f"{step.upper()}:\n")
            f.write(json.dumps(data, indent=2))
            f.write("\n\n")

def process_with_ai_model(message):
    """
    This is where you'll integrate your AI model
    The compiled responses are available in the responses/ directory
    """
    session_id = session.get('session_id')
    
    # Read the compiled responses for context
    if session_id:
        try:
            with open(f'responses/{session_id}_complete.txt', 'r') as f:
                user_context = f.read()
        except FileNotFoundError:
            user_context = "No assessment data available"
    else:
        user_context = "No assessment data available"
    
    # Placeholder AI response - replace with your actual AI model
    ai_response = f"I understand your message: '{message}'. Based on your assessment, I can provide personalized advice."
    
    return ai_response

def log_chat_message(user_message, ai_response):
    """Log chat messages for analysis"""
    session_id = session.get('session_id', generate_session_id())
    timestamp = datetime.now().isoformat()
    
    filename = f'chat_logs/{session_id}_chat.txt'
    
    with open(filename, 'a') as f:
        f.write(f"[{timestamp}] USER: {user_message}\n")
        f.write(f"[{timestamp}] AI: {ai_response}\n\n")

def generate_session_id():
    """Generate a unique session ID"""
    return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"





if __name__ == '__main__':
    app.run(debug=True)