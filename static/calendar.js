// Calendar JavaScript functionality

let currentDate = new Date();
let currentView = 'month';
let events = [];

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCalendar();
    loadEvents();
    setupEventListeners();
});

// Calendar generation and display
function loadCalendar() {
    updateMonthDisplay();
    updateCalendarView(currentView);
}

function updateMonthDisplay() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthElement = document.getElementById('currentMonth');
    if (monthElement) {
        monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

function generateCalendarDays() {
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
        
        // Add classes for styling
        if (dayDate.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = dayDate.getDate();
        dayElement.appendChild(dayNumber);
        
        // Events for this day
        const dayEvents = document.createElement('div');
        dayEvents.className = 'day-events';
        
        const dayEventList = getEventsForDate(dayDate);
        dayEventList.forEach(event => {
            const eventDot = document.createElement('div');
            eventDot.className = `event-dot ${event.type}`;
            eventDot.title = `${event.time} - ${event.title}`;
            dayEvents.appendChild(eventDot);
        });
        
        dayElement.appendChild(dayEvents);
        
        // Click handler
        dayElement.addEventListener('click', () => openEventModal(dayDate));
        
        calendarDays.appendChild(dayElement);
    }
}

// Navigation functions
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadCalendar();
}

function setView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find the clicked button and make it active
    document.querySelectorAll('.view-btn').forEach(btn => {
        if (btn.textContent === view.charAt(0).toUpperCase() + view.slice(1)) {
            btn.classList.add('active');
        }
    });
    
    // Update calendar display based on view
    updateCalendarView(view);
    console.log(`Switched to ${view} view`);
}

function updateCalendarView(view) {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    // Clear existing content
    calendarGrid.innerHTML = '';
    
    switch(view) {
        case 'month':
            generateMonthView();
            break;
        case 'week':
            generateWeekView();
            break;
        case 'day':
            generateDayView();
            break;
        default:
            generateMonthView();
    }
}

function generateMonthView() {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Add days of week header
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header-row';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    calendarGrid.appendChild(headerRow);
    
    // Add calendar days container
    const daysContainer = document.createElement('div');
    daysContainer.id = 'calendar-days';
    daysContainer.className = 'calendar-days';
    calendarGrid.appendChild(daysContainer);
    
    // Generate days
    generateCalendarDays();
}

function generateWeekView() {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Calculate current week
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    // Add week header
    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    weekHeader.innerHTML = `<h3>Week of ${startOfWeek.toLocaleDateString()}</h3>`;
    calendarGrid.appendChild(weekHeader);
    
    // Add time slots
    const weekGrid = document.createElement('div');
    weekGrid.className = 'week-grid';
    
    // Time column
    const timeColumn = document.createElement('div');
    timeColumn.className = 'time-column';
    
    for (let hour = 8; hour < 22; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
        timeColumn.appendChild(timeSlot);
    }
    weekGrid.appendChild(timeColumn);
    
    // Day columns
    for (let i = 0; i < 7; i++) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-column-header';
        dayHeader.textContent = `${dayDate.toLocaleDateString('en-US', { weekday: 'short' })} ${dayDate.getDate()}`;
        
        // Check if this is today
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            dayHeader.classList.add('today');
        }
        
        dayColumn.appendChild(dayHeader);
        
        // Get events for this day
        const dayEvents = getEventsForDate(dayDate);
        
        // Add hour slots for this day
        for (let hour = 8; hour < 22; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            hourSlot.setAttribute('data-date', dayDate.toISOString().split('T')[0]);
            hourSlot.setAttribute('data-hour', hour);
            
            // Check for events at this hour
            const hourEvents = dayEvents.filter(event => {
                const eventTime = parseInt(event.time.split(':')[0]);
                return eventTime === hour;
            });
            
            if (hourEvents.length > 0) {
                // Display events in this time slot
                hourEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = `event-item ${event.type}`;
                    if (event.ai_generated) {
                        eventElement.classList.add('ai-generated');
                    }
                    
                    eventElement.innerHTML = `
                        <div class="event-time">${event.time}</div>
                        <div class="event-title">${event.title}</div>
                        ${event.ai_generated ? '<span class="ai-icon">🤖</span>' : ''}
                    `;
                    
                    eventElement.title = `${event.time} - ${event.title}\n${event.description || ''}`;
                    hourSlot.appendChild(eventElement);
                });
                hourSlot.classList.add('has-events');
            } else {
                // Add click handler for event creation only if no events
                hourSlot.addEventListener('click', function() {
                    const eventDate = new Date(dayDate);
                    eventDate.setHours(hour, 0, 0, 0);
                    openEventModal(eventDate, 'study');
                });
                
                // Add visual feedback
                hourSlot.title = `Click to add event at ${hour}:00 on ${dayDate.toLocaleDateString()}`;
            }
            
            dayColumn.appendChild(hourSlot);
        }
        
        weekGrid.appendChild(dayColumn);
    }
    
    calendarGrid.appendChild(weekGrid);
}

function generateDayView() {
    const calendarGrid = document.getElementById('calendar-grid');
    
    // Add day header
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header-section';
    
    // Check if this is today
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    dayHeader.innerHTML = `
        <h3 class="${isToday ? 'today' : ''}">${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
    `;
    calendarGrid.appendChild(dayHeader);
    
    // Get events for this day
    const dayEvents = getEventsForDate(currentDate);
    
    // Add day schedule
    const daySchedule = document.createElement('div');
    daySchedule.className = 'day-schedule';
    
    for (let hour = 8; hour < 22; hour++) {
        const hourRow = document.createElement('div');
        hourRow.className = 'hour-row';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'hour-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        
        const eventSlot = document.createElement('div');
        eventSlot.className = 'event-slot';
        eventSlot.setAttribute('data-date', currentDate.toISOString().split('T')[0]);
        eventSlot.setAttribute('data-hour', hour);
        
        // Check for events at this hour
        const hourEvents = dayEvents.filter(event => {
            const eventTime = parseInt(event.time.split(':')[0]);
            return eventTime === hour;
        });
        
        if (hourEvents.length > 0) {
            // Display events in this time slot
            hourEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `event-item ${event.type}`;
                if (event.ai_generated) {
                    eventElement.classList.add('ai-generated');
                }
                
                eventElement.innerHTML = `
                    <div class="event-content">
                        <div class="event-time">${event.time}</div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${event.description || ''}</div>
                        ${event.ai_generated ? '<span class="ai-icon">🤖</span>' : ''}
                    </div>
                `;
                
                eventElement.title = `${event.time} - ${event.title}\n${event.description || ''}`;
                eventSlot.appendChild(eventElement);
            });
            eventSlot.classList.add('has-events');
        } else {
            // Add click handler for event creation only if no events
            eventSlot.addEventListener('click', function() {
                const eventDate = new Date(currentDate);
                eventDate.setHours(hour, 0, 0, 0);
                openEventModal(eventDate, 'study');
            });
            
            // Add visual feedback
            eventSlot.title = `Click to add event at ${hour}:00`;
            eventSlot.innerHTML = '<span class="add-event-hint">+ Add Event</span>';
        }
        
        hourRow.appendChild(timeLabel);
        hourRow.appendChild(eventSlot);
        daySchedule.appendChild(hourRow);
    }
    
    calendarGrid.appendChild(daySchedule);
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Event management
function quickAdd(type) {
    const today = new Date();
    openEventModal(today, type);
}

function openEventModal(date, type = 'study') {
    const modal = document.getElementById('eventModal');
    const eventDate = document.getElementById('eventDate');
    const eventType = document.getElementById('eventType');
    const eventTime = document.getElementById('eventTime');
    
    if (modal && eventDate && eventType) {
        eventDate.value = date.toISOString().split('T')[0];
        eventType.value = type;
        
        // Set time based on the date object if it has time info, otherwise use current time
        let hours, minutes;
        if (date.getHours() !== 0 || date.getMinutes() !== 0) {
            // Time was specifically set (from week/day view click)
            hours = date.getHours().toString().padStart(2, '0');
            minutes = date.getMinutes().toString().padStart(2, '0');
        } else {
            // Default to current time or smart suggestion
            const now = new Date();
            hours = now.getHours().toString().padStart(2, '0');
            minutes = now.getMinutes().toString().padStart(2, '0');
        }
        
        if (eventTime) {
            eventTime.value = `${hours}:${minutes}`;
        }
        
        modal.style.display = 'block';
        
        // Focus on the title field for immediate input
        const titleField = document.getElementById('eventTitle');
        if (titleField) {
            setTimeout(() => titleField.focus(), 100);
        }
    }
}

function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('eventForm').reset();
    }
}

// Event form submission
function setupEventListeners() {
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEvent();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('eventModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

function saveEvent() {
    const form = document.getElementById('eventForm');
    const formData = new FormData(form);
    
    const eventData = {
        title: formData.get('title'),
        type: formData.get('type'),
        date: formData.get('date'),
        time: formData.get('time'),
        duration: parseInt(formData.get('duration')),
        description: formData.get('description'),
        id: Date.now() // Simple ID generation
    };
    
    // Add to local events array
    events.push(eventData);
    
    // Send to backend
    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Event saved:', data);
        closeModal();
        loadCalendar();
        updateTodayPanel();
    })
    .catch(error => {
        console.error('Error saving event:', error);
    });
}

function loadEvents() {
    // Load both manual and AI-generated events
    Promise.all([
        fetch('/api/events').then(r => r.json()),
        fetch(`/api/ai-events/${getSessionId()}`).then(r => r.json())
    ])
    .then(([manualEvents, aiEvents]) => {
        events = [
            ...(manualEvents.events || []),
            ...(aiEvents.events || [])
        ];
        loadCalendar();
        updateTodayPanel();
    })
    .catch(error => {
        console.error('Error loading events:', error);
        // Use demo events if backend fails
        loadDemoEvents();
    });
}

function getSessionId() {
    // Get session ID from cookie or generate one
    let sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session_id='))
        ?.split('=')[1];
    
    if (!sessionId) {
        sessionId = `session_${new Date().toISOString().slice(0,19).replace(/[-:]/g, '').replace('T', '_')}`;
        document.cookie = `session_id=${sessionId}; path=/`;
    }
    
    return sessionId;
}

function loadDemoEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    events = [
        {
            id: 1,
            title: 'Mathematics Study Session',
            type: 'study',
            date: today.toISOString().split('T')[0],
            time: '09:00',
            duration: 120,
            description: 'Review calculus chapters 3-4'
        },
        {
            id: 2,
            title: 'Physics Assignment Due',
            type: 'assignment',
            date: today.toISOString().split('T')[0],
            time: '14:00',
            duration: 60,
            description: 'Submit quantum mechanics problem set'
        },
        {
            id: 3,
            title: 'Study Break',
            type: 'reminder',
            date: today.toISOString().split('T')[0],
            time: '16:00',
            duration: 30,
            description: 'Take a walk and refresh'
        },
        {
            id: 4,
            title: 'Chemistry Lab',
            type: 'class',
            date: tomorrow.toISOString().split('T')[0],
            time: '10:00',
            duration: 180,
            description: 'Organic chemistry lab session'
        }
    ];
    
    loadCalendar();
    updateTodayPanel();
}

function getEventsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
}

function updateTodayPanel() {
    const today = new Date();
    const todayEvents = getEventsForDate(today);
    const todayEventsContainer = document.getElementById('today-events');
    
    if (!todayEventsContainer) return;
    
    todayEventsContainer.innerHTML = '';
    
    if (todayEvents.length === 0) {
        todayEventsContainer.innerHTML = '<p style="color: #8e8e93; text-align: center; padding: 20px;">No events scheduled for today</p>';
        return;
    }
    
    // Sort events by time
    todayEvents.sort((a, b) => a.time.localeCompare(b.time));
    
            todayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item ${event.type}`;
            
            // Add AI indicator if it's an AI-generated task
            if (event.source === 'ai_generated') {
                eventElement.classList.add('ai-generated');
            }
            
            const eventTime = document.createElement('span');
            eventTime.className = 'event-time';
            eventTime.textContent = formatTime(event.time);
            
            const eventTitle = document.createElement('span');
            eventTitle.className = 'event-title';
            
            // Add AI icon for AI-generated events
            if (event.source === 'ai_generated') {
                const aiIcon = document.createElement('span');
                aiIcon.className = 'ai-icon';
                aiIcon.textContent = '🤖 ';
                aiIcon.title = 'AI-Generated Task';
                eventTitle.appendChild(aiIcon);
            }
            
            const titleText = document.createTextNode(event.title);
            eventTitle.appendChild(titleText);
            
            const eventMeta = document.createElement('span');
            eventMeta.className = 'event-duration';
            eventMeta.textContent = `${event.duration} min`;
            
            eventElement.appendChild(eventTime);
            eventElement.appendChild(eventTitle);
            eventElement.appendChild(eventMeta);
            
            // Add click handler to edit event
            eventElement.addEventListener('click', () => editEvent(event));
            
            todayEventsContainer.appendChild(eventElement);
        });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
}

function editEvent(event) {
    // TODO: Implement event editing functionality
    console.log('Editing event:', event);
}

// Smart scheduling suggestions
function suggestStudyTime() {
    // TODO: Implement AI-powered study time suggestions based on user preferences
    const suggestions = [
        { time: '09:00', reason: 'Peak morning focus time' },
        { time: '14:00', reason: 'Post-lunch energy boost' },
        { time: '19:00', reason: 'Evening review session' }
    ];
    
    return suggestions;
}

// Export functions for global access
window.toggleSidebar = toggleSidebar;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.setView = setView;
window.quickAdd = quickAdd;
window.closeModal = closeModal; 