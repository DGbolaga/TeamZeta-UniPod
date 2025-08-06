from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
from datetime import datetime, timedelta
from output_manager import save_user_response, compile_user_context
from braces_model.bridge import MODEL_ID
from braces_model import utilities

import re

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
    return render_template('page1.html')

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

@app.route('/submit_form', methods=['POST'])
def submit_form():
    # For now, just print form data and return a success message
    form_data = request.form.to_dict()
    # print(form_data)
    utilities.initialize_artifact("memory", form_data)
    utilities.initialize_artifact("pref", form_data)
    utilities.initialize_artifact("schedule", form_data)
    utilities.initialize_artifact("health", form_data)
    utilities.initialize_artifact("resv", form_data)

    print(f"User context initialized: {form_data}")
    print("Initialized artifacts for BRACES agents!")
    
    # TODO: Save to database or file, process, etc.

    return redirect(url_for("chat"))

def parse_ai_tasks(ai_response, session_id):
    """Parse AI response for actionable tasks and schedule items"""
    tasks = []
    
    # Check if ai_response is valid
    if not ai_response or not isinstance(ai_response, str):
        return tasks
    
    # Skip demo responses
    if "Demo response:" in ai_response or "API key" in ai_response:
        return tasks
    
    # Look for time-based recommendations in AI response
    time_patterns = [
        r'(\d{1,2}:\d{2}\s?(AM|PM|am|pm))',  # Time patterns
        r'(tomorrow|today|next week|this week)',  # Relative dates
        r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)',  # Days of week
        r'(study|review|practice|assignment|exam|homework)',  # Academic activities
    ]
    
    # Extract potential tasks using natural language processing
    sentences = ai_response.split('.')
    
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Look for imperative statements (suggestions/recommendations)
        if any(word in sentence.lower() for word in ['should', 'recommend', 'suggest', 'try', 'schedule', 'plan']):
            
            # Extract time information if present
            time_match = re.search(r'(\d{1,2}:\d{2}\s?(AM|PM|am|pm))', sentence)
            
            # Extract activity type
            activity_type = 'study'  # default
            if 'assignment' in sentence.lower() or 'homework' in sentence.lower():
                activity_type = 'assignment'
            elif 'exam' in sentence.lower() or 'test' in sentence.lower():
                activity_type = 'exam'
            elif 'break' in sentence.lower() or 'rest' in sentence.lower():
                activity_type = 'reminder'
            
            # Create task object
            task = {
                'title': sentence[:50] + '...' if len(sentence) > 50 else sentence,
                'type': activity_type,
                'source': 'ai_generated',
                'session_id': session_id,
                'suggestion': sentence,
                'parsed_time': time_match.group(1) if time_match else None
            }
            
            tasks.append(task)
    
    return tasks

def auto_sync_ai_tasks(ai_response, session_id):
    """Automatically sync AI-generated tasks to calendar"""
    try:
        tasks = parse_ai_tasks(ai_response, session_id)
        
        for task in tasks:
            # Create calendar event from AI task
            event_data = {
                'title': f"AI Suggestion: {task['title']}",
                'type': task['type'],
                'date': datetime.now().strftime('%Y-%m-%d'),  # Default to today
                'time': task.get('parsed_time', '09:00'),  # Default time
                'duration': 60,  # Default 1 hour
                'description': f"Auto-generated from AI: {task['suggestion']}",
                'source': 'ai_generated',
                'session_id': session_id,
                'auto_sync': True
            }
            
            # Save to events (extend the existing TODO to actually save)
            save_ai_event(event_data)
            
        return len(tasks)
        
    except Exception as e:
        print(f"Error in auto-sync: {e}")
        return 0

def save_ai_event(event_data):
    """Save AI-generated event to persistent storage"""
    session_id = event_data['session_id']
    filename = f'responses/{session_id}_ai_events.json'
    
    # Load existing events
    try:
        with open(filename, 'r') as f:
            events = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        events = []
    
    # Add new event with unique ID
    event_data['id'] = f"ai_{datetime.now().timestamp()}"
    event_data['created_at'] = datetime.now().isoformat()
    events.append(event_data)
    
    # Save back to file
    with open(filename, 'w') as f:
        json.dump(events, f, indent=2)
    
    return event_data['id']

@app.route('/api/ai-events/<session_id>')
def get_ai_events(session_id):
    """Get AI-generated events for a session"""
    filename = f'responses/{session_id}_ai_events.json'
    try:
        with open(filename, 'r') as f:
            events = json.load(f)
        return jsonify({'events': events})
    except (FileNotFoundError, json.JSONDecodeError):
        return jsonify({'events': []})

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    if request.method == 'POST':
        data = request.get_json()
        message = data.get('message', '')
        session_id = get_session_id()
        user_context = compile_user_context(session_id)
        ai_response = utilities.ask_braces(MODEL_ID, message)
        log_chat_message(message, ai_response)
        
        # Auto-sync AI tasks to calendar
        synced_tasks = auto_sync_ai_tasks(ai_response, session_id)
        if synced_tasks > 0:
            ai_response += f"\n\n📅 {synced_tasks} task(s) automatically added to your calendar!"
        
        print(ai_response)
        print(message)
        return jsonify({
            'response': ai_response,
            'synced_tasks': synced_tasks
        })
    
    return render_template('chat.html')

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    message = data.get('message', '')
    session_id = get_session_id()
    user_context = compile_user_context(session_id)
    # Prepare artifacts for braces_util (if needed)
    # braces_util.initialize_artifact(...)
    ai_response = utilities.ask_braces(MODEL_ID, message)
    print(ai_response)
    print(message)
    log_chat_message(message, ai_response)
    return jsonify({'response': ai_response})

@app.route('/calendar')
def calendar():
    return render_template('calendar.html')

@app.route('/api/events', methods=['GET', 'POST'])
def handle_events():
    if request.method == 'POST':
        # Add new event
        event_data = request.get_json()
        session_id = get_session_id()
        # TODO: Save event to database or file
        return jsonify({'success': True, 'event': event_data})
    else:
        # Get events for calendar
        session_id = get_session_id()
        # TODO: Retrieve events from database or file
        return jsonify({'events': []})

def log_chat_message(user_message, ai_response):
    session_id = get_session_id()
    timestamp = datetime.now().isoformat()
    filename = f'chat_logs/{session_id}_chat.txt'
    with open(filename, 'a') as f:
        f.write(f"[{timestamp}] USER: {user_message}\n")
        f.write(f"[{timestamp}] AI: {ai_response}\n\n")

@app.route('/progress')
def progress():
    return render_template('progress.html')

@app.route('/api/progress/<session_id>')
def get_progress_data(session_id):
    """Get progress data including streaks, milestones, and activity"""
    try:
        # Calculate streaks and progress metrics
        progress_data = calculate_progress_metrics(session_id)
        return jsonify(progress_data)
    except Exception as e:
        print(f"Error getting progress data: {e}")
        return jsonify({'error': 'Failed to load progress data'}), 500

@app.route('/api/progress/log-activity', methods=['POST'])
def log_activity():
    """Log student activity for streak tracking"""
    try:
        data = request.get_json()
        session_id = get_session_id()
        activity_type = data.get('type')  # study, chat, calendar, goal_completed
        duration = data.get('duration', 0)
        metadata = data.get('metadata', {})
        
        log_student_activity(session_id, activity_type, duration, metadata)
        
        return jsonify({'success': True, 'message': 'Activity logged'})
    except Exception as e:
        print(f"Error logging activity: {e}")
        return jsonify({'error': 'Failed to log activity'}), 500

def calculate_progress_metrics(session_id):
    """Calculate comprehensive progress metrics for a student"""
    from datetime import datetime, timedelta
    import os
    
    activity_file = f'responses/{session_id}_activities.json'
    
    # Load activity data
    activities = []
    if os.path.exists(activity_file):
        try:
            with open(activity_file, 'r') as f:
                activities = json.load(f)
        except:
            activities = []
    
    # Calculate streaks
    study_streak = calculate_streak(activities, 'study')
    chat_streak = calculate_streak(activities, 'chat')
    calendar_streak = calculate_streak(activities, 'calendar')
    
    # Calculate weekly progress
    weekly_data = calculate_weekly_activity(activities)
    
    # Calculate milestones
    milestones = calculate_milestones(activities)
    
    # Generate activity heatmap data (GitHub-style)
    heatmap_data = generate_activity_heatmap(activities)
    
    return {
        'streaks': {
            'study': study_streak,
            'chat': chat_streak,
            'calendar': calendar_streak,
            'overall': max(study_streak, chat_streak, calendar_streak)
        },
        'weekly_progress': weekly_data,
        'milestones': milestones,
        'heatmap': heatmap_data,
        'total_activities': len(activities),
        'last_activity': activities[-1]['date'] if activities else None
    }

def calculate_streak(activities, activity_type):
    """Calculate current streak for a specific activity type"""
    from datetime import datetime, timedelta
    
    if not activities:
        return 0
    
    # Filter activities by type and sort by date
    filtered_activities = [a for a in activities if a.get('type') == activity_type]
    if not filtered_activities:
        return 0
    
    # Group by date
    activity_dates = set()
    for activity in filtered_activities:
        try:
            date_str = activity['date'][:10]  # Get YYYY-MM-DD part
            activity_dates.add(date_str)
        except:
            continue
    
    if not activity_dates:
        return 0
    
    # Calculate current streak
    today = datetime.now().date()
    current_streak = 0
    check_date = today
    
    while check_date.strftime('%Y-%m-%d') in activity_dates:
        current_streak += 1
        check_date -= timedelta(days=1)
    
    return current_streak

def calculate_weekly_activity(activities):
    """Calculate activity for the past 7 days"""
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    weekly_data = []
    
    for i in range(7):
        date = today - timedelta(days=6-i)
        date_str = date.strftime('%Y-%m-%d')
        
        day_activities = [a for a in activities if a.get('date', '').startswith(date_str)]
        
        weekly_data.append({
            'date': date_str,
            'day': date.strftime('%a'),
            'activities': len(day_activities),
            'study_time': sum(a.get('duration', 0) for a in day_activities if a.get('type') == 'study'),
            'interactions': len([a for a in day_activities if a.get('type') in ['chat', 'calendar']])
        })
    
    return weekly_data

def calculate_milestones(activities):
    """Calculate achievement milestones"""
    total_activities = len(activities)
    study_activities = len([a for a in activities if a.get('type') == 'study'])
    chat_activities = len([a for a in activities if a.get('type') == 'chat'])
    
    milestones = []
    
    # Activity milestones
    activity_milestones = [1, 5, 10, 25, 50, 100, 200, 500]
    for milestone in activity_milestones:
        if total_activities >= milestone:
            milestones.append({
                'type': 'activity',
                'title': f'{milestone} Total Activities',
                'description': 'Keep up the consistent engagement!',
                'achieved': True,
                'icon': '🎯'
            })
    
    # Study milestones
    study_milestones = [1, 5, 10, 20, 50]
    for milestone in study_milestones:
        if study_activities >= milestone:
            milestones.append({
                'type': 'study',
                'title': f'{milestone} Study Sessions',
                'description': 'Dedication to learning pays off!',
                'achieved': True,
                'icon': '📚'
            })
    
    return milestones

def generate_activity_heatmap(activities):
    """Generate GitHub-style activity heatmap data"""
    from datetime import datetime, timedelta
    
    # Get last 365 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=364)
    
    heatmap_data = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        day_activities = [a for a in activities if a.get('date', '').startswith(date_str)]
        
        activity_count = len(day_activities)
        intensity = min(activity_count, 4)  # Cap at 4 for visual consistency
        
        heatmap_data.append({
            'date': date_str,
            'count': activity_count,
            'intensity': intensity,
            'day': current_date.strftime('%a'),
            'month': current_date.strftime('%b')
        })
        
        current_date += timedelta(days=1)
    
    return heatmap_data

def log_student_activity(session_id, activity_type, duration=0, metadata=None):
    """Log a student activity for progress tracking"""
    if metadata is None:
        metadata = {}
    
    activity_file = f'responses/{session_id}_activities.json'
    
    # Load existing activities
    activities = []
    if os.path.exists(activity_file):
        try:
            with open(activity_file, 'r') as f:
                activities = json.load(f)
        except:
            activities = []
    
    # Add new activity
    new_activity = {
        'id': f"{session_id}_{datetime.now().timestamp()}",
        'type': activity_type,
        'date': datetime.now().isoformat(),
        'duration': duration,
        'metadata': metadata
    }
    
    activities.append(new_activity)
    
    # Save activities
    with open(activity_file, 'w') as f:
        json.dump(activities, f, indent=2)

@app.route('/favicon.ico')
def favicon():
    return '', 204  # No content response

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)