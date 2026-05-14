let courses = [];
let filteredCourses = [];
let currentFilter = 'all';
let currentSort = 'recent';
let recentCourses = [];

function init() {
    loadTheme();
    loadRecentCourses();
    loadCourses();
    setupEventListeners();
    checkSavedFolder();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = savedTheme;
    document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const current = document.body.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

function loadRecentCourses() {
    try {
        const data = JSON.parse(localStorage.getItem('recentCourses') || '[]');
        recentCourses = data.slice(0, 10);
    } catch (e) {
        recentCourses = [];
    }
}

function saveRecentCourse(courseId) {
    recentCourses = recentCourses.filter(id => id !== courseId);
    recentCourses.unshift(courseId);
    recentCourses = recentCourses.slice(0, 10);
    localStorage.setItem('recentCourses', JSON.stringify(recentCourses));
    renderRecentCourses();
}

function renderRecentCourses() {
    const section = document.getElementById('recentSection');
    const ribbon = document.getElementById('recentRibbon');
    
    const recentData = recentCourses
        .map(id => courses.find(c => c.id === id))
        .filter(c => c);
    
    if (recentData.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    ribbon.innerHTML = recentData.map(course => `
        <div class="recent-card" onclick="location.href='course.html?id=${course.id}'">
            <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
            <div class="recent-card-info">
                <span class="recent-card-title">${course.title}</span>
                <span class="recent-card-meta">${course.totalVideos} videos</span>
            </div>
            <button class="continue-btn">▶</button>
        </div>
    `).join('');
}

async function checkSavedFolder() {
    const folder = await window.courseMera.getFolder();
    if (folder) {
        document.getElementById('folderPath').textContent = folder;
        loadCourses();
    }
}

function loadCourses() {
    fetch('/data/courses.json')
        .then(r => r.json())
        .then(data => {
            courses = data.courses || [];
            if (courses.length > 0) {
                showCoursesView();
            }
            filteredCourses = [...courses];
            updateStats();
            filterCourses();
            renderRecentCourses();
        })
        .catch(() => {
            courses = [];
            filteredCourses = [];
        });
}

function showCoursesView() {
    document.getElementById('folderSection').style.display = 'none';
    document.getElementById('stats').style.display = 'flex';
    document.getElementById('filtersSection').style.display = 'flex';
}

function updateStats() {
    const totalVideos = courses.reduce((sum, c) => sum + c.totalVideos, 0);
    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('totalVideos').textContent = totalVideos.toLocaleString();
    
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    const completed = Object.values(progress).reduce((sum, p) => sum + (p.watched?.length || 0), 0);
    document.getElementById('completedVideos').textContent = completed;
}

function setupEventListeners() {
    document.getElementById('selectFolderBtn').addEventListener('click', selectFolder);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('rescanBtn').addEventListener('click', rescanCourses);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterCourses();
        });
    });
    
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterCourses();
    });
}

async function selectFolder() {
    const folder = await window.courseMera.selectFolder();
    if (folder) {
        document.getElementById('folderPath').textContent = folder;
        showCoursesView();
        rescanCourses();
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    if (query === '') {
        filterCourses();
    } else {
        filteredCourses = courses.filter(c => 
            c.title.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query)
        );
        renderCourses();
    }
}

function filterCourses() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    if (currentFilter === 'all') {
        filteredCourses = [...courses];
    } else {
        filteredCourses = courses.filter(c => c.category === currentFilter);
    }
    
    if (searchQuery) {
        filteredCourses = filteredCourses.filter(c => 
            c.title.toLowerCase().includes(searchQuery)
        );
    }
    
    if (currentSort === 'recent') {
        const recentOrder = [...recentCourses];
        filteredCourses.sort((a, b) => {
            const aIdx = recentOrder.indexOf(a.id);
            const bIdx = recentOrder.indexOf(b.id);
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });
    } else if (currentSort === 'progress') {
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        filteredCourses.sort((a, b) => {
            const aProg = (progress[a.id]?.watched?.length || 0) / a.totalVideos;
            const bProg = (progress[b.id]?.watched?.length || 0) / b.totalVideos;
            return bProg - aProg;
        });
    } else if (currentSort === 'alpha') {
        filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    renderCourses();
}

function renderCourses() {
    const grid = document.getElementById('courseGrid');
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    
    grid.innerHTML = filteredCourses.map(course => {
        const courseProgress = progress[course.id];
        const watchedCount = courseProgress?.watched?.length || 0;
        const percent = course.totalVideos > 0 ? Math.round((watchedCount / course.totalVideos) * 100) : 0;
        
        return `
        <div class="course-card" data-category="${course.category}" onclick="location.href='course.html?id=${course.id}'">
            <div class="course-card-image">
                <img src="${course.thumbnail}" alt="${course.title}" loading="lazy">
            </div>
            <div class="course-card-content">
                <span class="course-badge">${getCategoryName(course.category)}</span>
                <h3 class="course-title">${course.title}</h3>
                <div class="course-meta">
                    <span>📹 ${course.totalVideos} videos</span>
                    <span>⏱ ${course.totalDuration}</span>
                </div>
                ${percent > 0 ? `
                <div class="course-progress">
                    <div class="progress-bar-container">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="progress-text">${percent}% • ${watchedCount}/${course.totalVideos}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `}).join('');
}

function getCategoryName(category) {
    const names = {
        'ai': 'AI & ML',
        'web': 'Web Dev',
        'devops': 'DevOps',
        'career': 'Career',
        'python': 'Python',
        'java': 'Java',
        'other': 'Other'
    };
    return names[category] || 'Other';
}

async function rescanCourses() {
    const btn = document.getElementById('rescanBtn');
    btn.textContent = '⏳';
    btn.disabled = true;
    
    try {
        const result = await window.courseMera.scanCourses();
        if (result.error) {
            alert('Scan failed: ' + result.error);
            btn.textContent = '🔄';
            btn.disabled = false;
            return;
        }
        
        courses = result.courses || [];
        localStorage.setItem('coursesData', JSON.stringify(courses));
        filteredCourses = [...courses];
        showCoursesView();
        updateStats();
        filterCourses();
        renderRecentCourses();
        
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = '🔄';
            btn.disabled = false;
        }, 2000);
    } catch (e) {
        console.error('Rescan error:', e);
        btn.textContent = '🔄';
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', init);