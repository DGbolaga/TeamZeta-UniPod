from braces_model.utilities import run_agent, initialize_artifact, update_artifact, ask_braces
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
from datetime import datetime
from output_manager import save_user_response, compile_user_context
from braces_model.bridge import MODEL_ID
from braces_model import utilities

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'your-secret-key-here'

os.makedirs('responses', exist_ok=True)
os.makedirs('chat_logs', exist_ok=True)

def get_session_id():
    if 'session_id' not in session:
        session['session_id'] = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    return session['session_id']

@app.route('/')
def index():
    return render_template('multi_step_form.html')

@app.route('/step/<int:step_num>')
def step(step_num):
    if step_num < 1 or step_num > 4:
        return redirect(url_for('index'))
    return render_template(f'page{step_num}.html')

@app.route('/submit_step<int:step_num>', methods=['POST'])
def submit_step(step_num):
    data = request.get_json()
    session_id = get_session_id()
    save_user_response(session_id, f'step{step_num}', data)
    return jsonify({'success': True, 'next_step': f'/step/{step_num+1}' if step_num < 4 else '/chat'})

@app.route('/chat')
def chat():
    return render_template('chat.html')


@app.route('/submit_form', methods=['POST'])
def submit_form():
    # For now, just print form data and return a success message
    form_data = request.form.to_dict()
    # print(form_data)
    {'preferredName': 'David', 'level_of_study': '100L', 'name_of_institution': 'University of Lagos', 'field_of_study': 'Computer Engineering', 'Top_academic_goal_this_semester': 'Earn a 5.0 cgpa\r\n', 'No_of_study_hours': '7', 'No_of_sleep_hours': '9', 'distractions_prone': 'Yes', 'consistent_daily_study_routine': 'Yes', 'Productive_hours_of_the day': 'night', 'preferred_study_environment': 'lib', 'class_materials_review': 'often', 'average_sleep_hours': '8', 'study_breaks': 'often', 'self-care-practice': 'no', 'proper_food': 'yes'}
    initialize_artifact("memory", form_data)
    initialize_artifact("pref", form_data)
    initialize_artifact("schedule", form_data)
    initialize_artifact("health", form_data)
    initialize_artifact("resv", form_data)

    print(f"User context initialized: {form_data}")
    print("Initialized artifacts for BRACES agents!")
    
    # TODO: Save to database or file, process, etc.

    return redirect(url_for("chat"))



@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    message = data.get('message', '')
    session_id = get_session_id()
    user_context = compile_user_context(session_id)
    # Prepare artifacts for braces_util (if needed)
    # braces_util.initialize_artifact(...)
    ai_response = utilities.ask_braces(MODEL_ID, message)
    log_chat_message(message, ai_response)
    return jsonify({'response': ai_response})

def log_chat_message(user_message, ai_response):
    session_id = get_session_id()
    timestamp = datetime.now().isoformat()
    filename = f'chat_logs/{session_id}_chat.txt'
    with open(filename, 'a') as f:
        f.write(f"[{timestamp}] USER: {user_message}\n")
        f.write(f"[{timestamp}] AI: {ai_response}\n\n")


def generate_session_id():
    """Generate a unique session ID"""
    return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"


if __name__ == '__main__':
    app.run(debug=True, port=5000)