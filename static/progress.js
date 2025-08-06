// Progress page JavaScript functionality

let currentSessionId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get session ID from current session or generate one
    currentSessionId = getSessionId();
    
    // Load progress data
    loadProgressData();
    
    // Setup sidebar toggle functionality
    setupSidebarToggle();
});

function getSessionId() {
    // Try to get session ID from cookie or generate a default one
    return 'demo_session_' + Date.now();
}

function loadProgressData() {
    showLoading();
    
    // Generate demo data immediately for better UX
    const demoData = generateDemoProgressData();
    displayProgressData(demoData);
    
    // Then fetch real data from backend
    fetch(`/api/progress/${currentSessionId}`)
        .then(response => response.json())
        .then(data => {
            // Merge real data with demo data
            const mergedData = mergeProgressData(demoData, data);
            displayProgressData(mergedData);
            hideLoading();
        })
        .catch(error => {
            console.error('Error loading progress data:', error);
            // Keep demo data on error
            hideLoading();
        });
}

function generateDemoProgressData() {
    const today = new Date();
    const heatmapData = [];
    
    // Simple seeded random function for consistent demo data
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // Generate 365 days of demo activity data
    for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Start with empty activity (fresh start)
        heatmapData.push({
            date: date.toISOString().split('T')[0],
            count: 0,  // Start fresh
            intensity: 0,  // Start fresh
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            month: date.toLocaleDateString('en-US', { month: 'short' })
        });
    }
    
    // Generate demo weekly data (starting fresh)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        weeklyData.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            activities: 0,  // Start fresh
            study_time: 0,  // Start fresh
            interactions: 0  // Start fresh
        });
    }
    
    // Use fixed demo values for consistency
    const baseSeed = 12345; // Fixed seed for consistent demo data
    
    return {
        streaks: {
            study: 0,  // Start fresh
            chat: 0,
            calendar: 0,
            overall: 0
        },
        weekly_progress: weeklyData,
        milestones: [
            { type: 'activity', title: 'First Steps', description: 'Complete your first activity!', achieved: false, icon: '🎯' },
            { type: 'activity', title: '5 Total Activities', description: 'Build momentum with consistent engagement!', achieved: false, icon: '⭐' },
            { type: 'study', title: '5 Study Sessions', description: 'Dedication to learning pays off!', achieved: false, icon: '📚' },
            { type: 'streak', title: '3-Day Streak', description: 'Consistency is key to success!', achieved: false, icon: '🔥' },
            { type: 'activity', title: '25 Total Activities', description: 'Quarter century milestone!', achieved: false, icon: '🎯' },
            { type: 'streak', title: '7-Day Streak', description: 'One week of consistent progress!', achieved: false, icon: '🔥' },
            { type: 'study', title: '20 Study Sessions', description: 'Academic excellence awaits!', achieved: false, icon: '📚' },
            { type: 'chat', title: 'AI Collaborator', description: 'Have 10 meaningful AI interactions!', achieved: false, icon: '🤖' },
            { type: 'wellness', title: 'Balanced Learner', description: 'Maintain healthy study habits!', achieved: false, icon: '⚖️' },
            { type: 'activity', title: '100 Total Activities', description: 'Century club member!', achieved: false, icon: '💯' }
        ],
        heatmap: heatmapData,
        total_activities: 0,  // Start fresh
        last_activity: null
    };
}

function mergeProgressData(demoData, realData) {
    // If real data exists and has meaningful values, use it; otherwise fall back to demo data
    return {
        streaks: (realData.streaks && Object.values(realData.streaks).some(v => v > 0)) ? realData.streaks : demoData.streaks,
        weekly_progress: (realData.weekly_progress && realData.weekly_progress.length > 0) ? realData.weekly_progress : demoData.weekly_progress,
        milestones: (realData.milestones && realData.milestones.length > 0) ? realData.milestones : demoData.milestones,
        heatmap: (realData.heatmap && realData.heatmap.length > 0) ? realData.heatmap : demoData.heatmap,
        total_activities: (realData.total_activities && realData.total_activities > 0) ? realData.total_activities : demoData.total_activities,
        last_activity: realData.last_activity || demoData.last_activity
    };
}

function displayProgressData(data) {
    // Update streak displays
    updateStreakDisplays(data.streaks);
    
    // Update quick stats
    updateQuickStats(data);
    
    // Generate heatmap
    generateHeatmap(data.heatmap);
    
    // Generate streak cards
    generateStreakCards(data.streaks);
    
    // Generate weekly chart
    generateWeeklyChart(data.weekly_progress);
    
    // Generate milestones
    generateMilestones(data.milestones);
}

function updateStreakDisplays(streaks) {
    // Update main streak number
    const mainStreakElement = document.getElementById('mainStreakNumber');
    if (mainStreakElement) {
        mainStreakElement.textContent = streaks.overall || 0;
    }
    
    // Update sidebar streak
    const currentStreakElement = document.getElementById('currentStreak');
    if (currentStreakElement) {
        currentStreakElement.textContent = streaks.overall || 0;
    }
}

function updateQuickStats(data) {
    const totalActivitiesElement = document.getElementById('totalActivities');
    if (totalActivitiesElement) {
        totalActivitiesElement.textContent = data.total_activities || 0;
    }
    
    const totalMilestonesElement = document.getElementById('totalMilestones');
    if (totalMilestonesElement) {
        const achievedMilestones = data.milestones ? data.milestones.filter(m => m.achieved).length : 0;
        totalMilestonesElement.textContent = achievedMilestones;
    }
}

function generateHeatmap(heatmapData) {
    const heatmapGrid = document.getElementById('heatmapGrid');
    if (!heatmapGrid || !heatmapData) return;
    
    heatmapGrid.innerHTML = '';
    
    heatmapData.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = `heatmap-day intensity-${day.intensity}`;
        dayElement.title = `${day.date}: ${day.count} activities`;
        heatmapGrid.appendChild(dayElement);
    });
}

function generateStreakCards(streaks) {
    const streakCards = document.getElementById('streakCards');
    if (!streakCards) return;
    
    const cardData = [
        { type: 'study', title: 'Study Sessions', icon: '📚', value: streaks.study || 0 },
        { type: 'chat', title: 'AI Interactions', icon: '💬', value: streaks.chat || 0 },
        { type: 'calendar', title: 'Planning Days', icon: '📅', value: streaks.calendar || 0 }
    ];
    
    streakCards.innerHTML = cardData.map(card => `
        <div class="streak-card ${card.type}">
            <div class="streak-icon">${card.icon}</div>
            <div class="streak-info">
                <h3>${card.title}</h3>
                <span class="streak-number">${card.value}</span>
                <span class="streak-label">Day Streak</span>
            </div>
            <div class="progress-ring">
                <svg class="progress-ring-svg" width="60" height="60">
                    <circle class="progress-ring-background" cx="30" cy="30" r="25"></circle>
                    <circle class="progress-ring-progress ${card.type}" cx="30" cy="30" r="25" 
                            stroke-dasharray="${Math.min(card.value * 5, 100)} 100"></circle>
                </svg>
            </div>
        </div>
    `).join('');
}

function generateWeeklyChart(weeklyData) {
    const weeklyBars = document.getElementById('weeklyBars');
    const weeklyLabels = document.getElementById('weeklyLabels');
    
    if (!weeklyBars || !weeklyLabels || !weeklyData) return;
    
    const maxActivities = Math.max(...weeklyData.map(d => d.activities), 1);
    
    weeklyBars.innerHTML = weeklyData.map(day => {
        const height = (day.activities / maxActivities) * 100;
        return `<div class="weekly-bar" style="height: ${height}%" title="${day.day}: ${day.activities} activities"></div>`;
    }).join('');
    
    weeklyLabels.innerHTML = weeklyData.map(day => 
        `<span>${day.day}</span>`
    ).join('');
}

function generateMilestones(milestones) {
    console.log('generateMilestones called with:', milestones);
    const milestonesGrid = document.getElementById('milestonesGrid');
    console.log('milestonesGrid element:', milestonesGrid);
    
    if (!milestonesGrid) {
        console.error('milestonesGrid element not found!');
        return;
    }
    
    if (!milestones || milestones.length === 0) {
        console.log('No milestones data provided, keeping existing content');
        // Don't replace the static fallback content
        return;
    }
    
    const milestonesHTML = milestones.map(milestone => `
        <div class="milestone-card ${milestone.achieved ? 'achieved' : 'locked'}">
            <span class="milestone-icon ${milestone.achieved ? 'achieved-icon' : 'locked-icon'}">${milestone.icon}</span>
            <div class="milestone-info">
                <h4>${milestone.title}</h4>
                <div class="milestone-description">${milestone.description}</div>
                ${milestone.achieved ? 
                    '<div class="achievement-badge">✓ Unlocked</div>' : 
                    '<div class="locked-badge">🔒 Locked</div>'
                }
            </div>
        </div>
    `).join('');
    
    console.log('Generated milestones HTML:', milestonesHTML);
    milestonesGrid.innerHTML = milestonesHTML;
    console.log('Milestones inserted into DOM');
}

function setupSidebarToggle() {
    // Add sidebar toggle functionality if needed
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    };
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
}

// Activity logging function
function logActivity(activityType, duration = 0, metadata = {}) {
    fetch('/api/progress/log-activity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: activityType,
            duration: duration,
            metadata: metadata
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Activity logged successfully');
            // Optionally refresh data
            // loadProgressData();
        }
    })
    .catch(error => {
        console.error('Error logging activity:', error);
    });
}
  