let currentCourse = null;
let courseProgress = {};
let expandedSections = {};

function init() {
    loadTheme();
    loadCourseFromUrl();
    setupEventListeners();
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

function loadCourseFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    
    if (!courseId) {
        window.location.href = 'index.html';
        return;
    }
    
    fetch('/data/courses.json')
        .then(r => r.json())
        .then(data => {
            let courses = data.courses || [];
            if (courses.length === 0) {
                const local = localStorage.getItem('coursesData');
                if (local) courses = JSON.parse(local);
            }
            const course = courses.find(c => c.id === courseId);
            if (!course) {
                if (courses.length > 0) {
                    document.getElementById('courseHeader').innerHTML = `
                        <div style="padding:40px;text-align:center">
                            <h2>Course not found</h2>
                            <p>The course "${courseId}" was not found in the scanned courses.</p>
                            <p>Try <a href="index.html" style="color:var(--accent)">rescanning the folder</a> from the home screen.</p>
                        </div>
                    `;
                    document.getElementById('courseProgress').style.display = 'none';
                    document.getElementById('courseSections').innerHTML = '';
                    return;
                }
                window.location.href = 'index.html';
                return;
            }
            
            currentCourse = course;
            loadProgress();
            saveRecentCourse(courseId);
            renderCourse();
            document.title = `${course.title} - CourseMera`;
        })
        .catch(() => {
            const local = localStorage.getItem('coursesData');
            if (local) {
                const courses = JSON.parse(local);
                const course = courses.find(c => c.id === courseId);
                if (course) {
                    currentCourse = course;
                    loadProgress();
                    saveRecentCourse(courseId);
                    renderCourse();
                    document.title = `${course.title} - CourseMera`;
                    return;
                }
            }
            window.location.href = 'index.html';
        });
}

function loadProgress() {
    try {
        const allProgress = JSON.parse(localStorage.getItem('progress') || '{}');
        courseProgress = allProgress[currentCourse.id] || { watched: [], lastPosition: null };
    } catch (e) {
        courseProgress = { watched: [], lastPosition: null };
    }
}

function saveProgress() {
    try {
        const allProgress = JSON.parse(localStorage.getItem('progress') || '{}');
        allProgress[currentCourse.id] = courseProgress;
        localStorage.setItem('progress', JSON.stringify(allProgress));
    } catch (e) {}
}

function saveRecentCourse(courseId) {
    try {
        let recent = JSON.parse(localStorage.getItem('recentCourses') || '[]');
        recent = recent.filter(id => id !== courseId);
        recent.unshift(courseId);
        recent = recent.slice(0, 10);
        localStorage.setItem('recentCourses', JSON.stringify(recent));
    } catch (e) {}
}

function renderCourse() {
    const watchedCount = courseProgress.watched.length;
    const percent = currentCourse.totalVideos > 0 ? Math.round((watchedCount / currentCourse.totalVideos) * 100) : 0;
    
    document.getElementById('courseHeader').innerHTML = `
        <div class="course-hero">
            <img src="${currentCourse.thumbnail}" alt="${currentCourse.title}" class="course-hero-img">
            <div class="course-hero-overlay">
                <span class="course-badge">${getCategoryName(currentCourse.category)}</span>
                <h1 class="course-hero-title">${currentCourse.title}</h1>
                <div class="course-hero-meta">
                    <span>📹 ${currentCourse.totalVideos} items</span>
                    <span>⏱ ${currentCourse.totalDuration}</span>
                    <span>📚 ${currentCourse.sections.length} sections</span>
                </div>
                ${courseProgress.lastPosition ? `
                <a href="player.html?course=${currentCourse.id}&section=${courseProgress.lastPosition.section}&video=${courseProgress.lastPosition.video}" class="resume-btn">
                    ▶ Resume: ${courseProgress.lastPosition.section + 1}.${courseProgress.lastPosition.video + 1}
                </a>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('courseProgress').innerHTML = `
        <div class="progress-info">
            <span>${watchedCount} / ${currentCourse.totalVideos} completed (${percent}%)</span>
        </div>
        <div class="course-progress-bar-inner">
            <div class="course-progress-fill" style="width: ${percent}%"></div>
        </div>
    `;
    
    document.getElementById('courseSections').innerHTML = currentCourse.sections.map((section, sIdx) => {
        const sectionWatched = section.videos.filter((v, vIdx) => 
            courseProgress.watched.includes(`${sIdx}-${vIdx}`)
        ).length;
        const sectionPercent = section.videos.length > 0 ? Math.round((sectionWatched / section.videos.length) * 100) : 0;
        
        return `
        <div class="section-card">
            <button class="section-header" onclick="toggleSection(${sIdx})">
                <div class="section-info">
                    <span class="section-number">${sIdx + 1}.</span>
                    <span class="section-title">${section.name}</span>
                </div>
                <div class="section-meta">
                    <span>${sectionWatched}/${section.videos.length}</span>
                    <span class="section-arrow">▶</span>
                </div>
            </button>
            <div class="section-content" id="section-${sIdx}">
                ${section.videos.map((video, vIdx) => {
                    const isWatched = courseProgress.watched.includes(`${sIdx}-${vIdx}`);
                    const isActive = courseProgress.lastPosition?.section === sIdx && 
                                    courseProgress.lastPosition?.video === vIdx;
                    const isHtml = video.type === 'html';
                    
                    return `
                    <a href="player.html?course=${currentCourse.id}&section=${sIdx}&video=${vIdx}" 
                       class="video-item ${isWatched ? 'watched' : ''} ${isActive ? 'active' : ''}">
                        <span class="video-status">${isWatched ? '✓' : (isHtml ? '📄' : '▶')}</span>
                        <span class="video-name">${video.name}</span>
                        <span class="video-duration">${video.duration}</span>
                    </a>
                `}).join('')}
            </div>
        </div>
        `;
    }).join('');
}

function toggleSection(idx) {
    const content = document.getElementById(`section-${idx}`);
    const arrow = content.parentElement.querySelector('.section-arrow');
    
    if (expandedSections[idx]) {
        content.style.display = 'none';
        arrow.textContent = '▶';
        expandedSections[idx] = false;
    } else {
        content.style.display = 'block';
        arrow.textContent = '▼';
        expandedSections[idx] = true;
    }
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

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);