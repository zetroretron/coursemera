let video = null;
let currentCourse = null;
let currentSection = 0;
let currentVideo = 0;
let isPlaying = false;
let updateInterval = null;

function init() {
    loadTheme();
    loadPlayerFromUrl();
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

function loadPlayerFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');
    const sectionIdx = parseInt(params.get('section') || '0');
    const videoIdx = parseInt(params.get('video') || '0');
    
    if (!courseId) {
        window.location.href = 'index.html';
        return;
    }
    
    fetch('/data/courses.json')
        .then(r => r.json())
        .then(data => {
            const course = data.courses.find(c => c.id === courseId);
            if (!course) {
                window.location.href = 'index.html';
                return;
            }
            
            currentCourse = course;
            currentSection = sectionIdx;
            currentVideo = videoIdx;
            
            saveRecentCourse(courseId);
            setupPlayer();
            renderSidebar();
            loadVideo();
            updateStickyFooter();
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
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

function setupPlayer() {
    video = document.getElementById('videoPlayer');
    const overlay = document.getElementById('videoOverlay');
    const playBtn = document.getElementById('playBtn');
    const playBtnLarge = document.getElementById('playBtnLarge');
    
    video.addEventListener('click', () => togglePlay());
    overlay.addEventListener('click', () => togglePlay());
    playBtn.addEventListener('click', () => togglePlay());
    playBtnLarge.addEventListener('click', () => togglePlay());
    
    const doubleClickLeft = document.getElementById('doubleClickLeft');
    const doubleClickRight = document.getElementById('doubleClickRight');
    
    doubleClickLeft.addEventListener('dblclick', () => toggleFullscreen());
    doubleClickRight.addEventListener('dblclick', () => toggleFullscreen());
    
    video.addEventListener('play', () => {
        isPlaying = true;
        playBtn.textContent = '⏸';
        playBtnLarge.style.display = 'none';
        document.getElementById('loadingSpinner').style.display = 'none';
    });
    
    video.addEventListener('pause', () => {
        isPlaying = false;
        playBtn.textContent = '▶';
        playBtnLarge.style.display = 'flex';
    });
    
    video.addEventListener('waiting', () => {
        document.getElementById('loadingSpinner').style.display = 'block';
    });
    
    video.addEventListener('canplay', () => {
        document.getElementById('loadingSpinner').style.display = 'none';
    });
    
    video.addEventListener('timeupdate', () => {
        updateProgressBar();
        updateTimeDisplay();
        
        if (video.duration && video.currentTime / video.duration >= 0.9) {
            markVideoComplete();
        }
    });
    
    video.addEventListener('ended', () => {
        autoNextVideo();
    });
    
    video.addEventListener('progress', () => {
        updateBufferedBar();
    });
    
    setupControls();
}

function setupControls() {
    const playBtn = document.getElementById('playBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const speedBtn = document.getElementById('speedBtn');
    const speedMenu = document.getElementById('speedMenu');
    const theaterBtn = document.getElementById('theaterBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const pipBtn = document.getElementById('pipBtn');
    const helpBtn = document.getElementById('helpBtn');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const timeTooltip = document.getElementById('timeTooltip');
    
    playBtn.addEventListener('click', () => togglePlay());
    rewindBtn.addEventListener('click', () => seek(-10));
    forwardBtn.addEventListener('click', () => seek(10));
    
    muteBtn.addEventListener('click', () => toggleMute());
    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        updateVolumeIcon();
    });
    
    speedBtn.addEventListener('click', () => {
        speedMenu.style.display = speedMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    speedMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            video.playbackRate = speed;
            speedBtn.textContent = speed + 'x';
            speedMenu.style.display = 'none';
        });
    });
    
    theaterBtn.addEventListener('click', () => toggleTheater());
    fullscreenBtn.addEventListener('click', () => toggleFullscreen());
    
    pipBtn.addEventListener('click', () => {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else if (video.requestPictureInPicture) {
            video.requestPictureInPicture();
        }
    });
    
    helpBtn.addEventListener('click', () => {
        const help = document.getElementById('keyboardHelp');
        help.style.display = help.style.display === 'block' ? 'none' : 'block';
    });
    
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = video.duration * percent;
    });
    
    progressContainer.addEventListener('mousemove', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = video.duration * percent;
        
        if (!isNaN(time) && isFinite(time)) {
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            timeTooltip.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            timeTooltip.style.left = `${percent * 100}%`;
            timeTooltip.style.display = 'block';
        }
    });
    
    progressContainer.addEventListener('mouseleave', () => {
        timeTooltip.style.display = 'none';
    });
    
    document.addEventListener('keydown', handleKeyboard);
    
    document.getElementById('prevBtn').addEventListener('click', prevVideo);
    document.getElementById('nextBtn').addEventListener('click', nextVideo);
    document.getElementById('stickyCompleteBtn').addEventListener('click', () => {
        markVideoComplete();
        nextVideo();
    });
}

function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const seekIndicator = document.getElementById('seekIndicator');
    let showIndicator = false;
    let indicatorText = '';
    
    switch(e.key) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlay();
            break;
        case 'j':
            e.preventDefault();
            seek(-10);
            showIndicator = true;
            indicatorText = '-10s';
            break;
        case 'l':
            e.preventDefault();
            seek(10);
            showIndicator = true;
            indicatorText = '+10s';
            break;
        case 'ArrowLeft':
            e.preventDefault();
            seek(-5);
            showIndicator = true;
            indicatorText = '-5s';
            break;
        case 'ArrowRight':
            e.preventDefault();
            seek(5);
            showIndicator = true;
            indicatorText = '+5s';
            break;
        case 'ArrowUp':
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.1);
            document.getElementById('volumeSlider').value = video.volume;
            updateVolumeIcon();
            break;
        case 'ArrowDown':
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.1);
            document.getElementById('volumeSlider').value = video.volume;
            updateVolumeIcon();
            break;
        case 'm':
        case 'M':
            e.preventDefault();
            toggleMute();
            break;
        case 'f':
        case 'F':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 't':
        case 'T':
            e.preventDefault();
            toggleTheater();
            break;
        case 'i':
        case 'I':
            e.preventDefault();
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else if (video.requestPictureInPicture) {
                video.requestPictureInPicture();
            }
            break;
        case '?':
            e.preventDefault();
            const help = document.getElementById('keyboardHelp');
            help.style.display = help.style.display === 'block' ? 'none' : 'block';
            break;
        default:
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                const percent = parseInt(e.key) * 10;
                video.currentTime = video.duration * (percent / 100);
                showIndicator = true;
                indicatorText = percent + '%';
            }
            if (e.shiftKey && e.key === '<') {
                e.preventDefault();
                changeSpeed(-1);
            }
            if (e.shiftKey && e.key === '>') {
                e.preventDefault();
                changeSpeed(1);
            }
            break;
    }
    
    if (showIndicator) {
        seekIndicator.textContent = indicatorText;
        seekIndicator.style.display = 'block';
        setTimeout(() => {
            seekIndicator.style.display = 'none';
        }, 1000);
    }
}

function changeSpeed(direction) {
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const current = video.playbackRate;
    const idx = speeds.indexOf(current);
    let newIdx = idx + direction;
    if (newIdx < 0) newIdx = speeds.length - 1;
    if (newIdx >= speeds.length) newIdx = 0;
    video.playbackRate = speeds[newIdx];
    document.getElementById('speedBtn').textContent = speeds[newIdx] + 'x';
}

function togglePlay() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function toggleMute() {
    video.muted = !video.muted;
    updateVolumeIcon();
}

function updateVolumeIcon() {
    const btn = document.getElementById('muteBtn');
    if (video.muted || video.volume === 0) {
        btn.textContent = '🔇';
    } else if (video.volume < 0.5) {
        btn.textContent = '🔈';
    } else {
        btn.textContent = '🔊';
    }
}

function seek(seconds) {
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
}

function updateProgressBar() {
    if (!video.duration) return;
    const percent = (video.currentTime / video.duration) * 100;
    document.getElementById('progressPlayed').style.width = percent + '%';
}

function updateBufferedBar() {
    if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100;
        document.getElementById('progressBuffered').style.width = percent + '%';
    }
}

function updateTimeDisplay() {
    if (!video.duration) return;
    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);
    document.getElementById('timeDisplay').textContent = `${current} / ${total}`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleTheater() {
    const layout = document.getElementById('playerLayout');
    const wrapper = document.getElementById('videoWrapper');
    const footer = document.getElementById('stickyFooter');
    
    if (layout.classList.contains('theater-mode')) {
        layout.classList.remove('theater-mode');
        wrapper.classList.remove('theater-mode');
        footer.style.top = '';
        footer.classList.remove('theater-footer');
    } else {
        layout.classList.add('theater-mode');
        wrapper.classList.add('theater-mode');
        footer.classList.add('theater-footer');
    }
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.getElementById('playerLayout').requestFullscreen();
    }
}

let expandedSections = {};
function renderSidebar() {
    const header = document.getElementById('sidebarHeader');
    const content = document.getElementById('sidebarContent');
    document.getElementById('courseTitleHeader').textContent = currentCourse.title;
    
    header.innerHTML = `
        <img src="${currentCourse.thumbnail}" alt="${currentCourse.title}" class="sidebar-thumbnail">
        <div class="sidebar-info">
            <span class="sidebar-title">${currentCourse.title}</span>
        </div>
    `;
    
    content.innerHTML = currentCourse.sections.map((section, sIdx) => `
        <div class="sidebar-section">
            <button class="sidebar-section-header ${expandedSections[sIdx] ? 'expanded' : ''}" onclick="toggleSidebarSection(${sIdx})">
                <span>${sIdx + 1}. ${section.name}</span>
                <span class="sidebar-section-arrow">▶</span>
            </button>
            <div class="sidebar-section-content" id="sidebar-section-${sIdx}" style="display: ${expandedSections[sIdx] ? 'block' : 'none'}">
                ${section.videos.map((video, vIdx) => {
                    const isActive = sIdx === currentSection && vIdx === currentVideo;
                    const isHtml = video.type === 'html';
                    const isWatched = isVideoWatched(sIdx, vIdx);
                    
                    return `
                    <a href="player.html?course=${currentCourse.id}&section=${sIdx}&video=${vIdx}" 
                       class="sidebar-video ${isActive ? 'active' : ''} ${isWatched ? 'watched' : ''}">
                        <span class="sidebar-video-status">${isWatched ? '✓' : (isHtml ? '📄' : '▶')}</span>
                        <span class="sidebar-video-name">${video.name}</span>
                        <span class="sidebar-video-duration">${video.duration}</span>
                    </a>
                `}).join('')}
            </div>
        </div>
    `).join('');
    
    setTimeout(() => {
        const activeEl = content.querySelector('.sidebar-video.active');
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function toggleSidebarSection(idx) {
    const content = document.getElementById(`sidebar-section-${idx}`);
    const header = content.parentElement.querySelector('.sidebar-section-header');
    const arrow = header.querySelector('.sidebar-section-arrow');
    
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

function loadVideo() {
    const section = currentCourse.sections[currentSection];
    const videoData = section.videos[currentVideo];
    
    if (videoData.type === 'html') {
        document.getElementById('videoWrapper').style.display = 'none';
        document.getElementById('htmlContentContainer').style.display = 'block';
        document.getElementById('controlsBar').style.display = 'none';
        
        document.getElementById('htmlContentContainer').innerHTML = `
            <div class="html-lesson-content">
                <h2>${videoData.name}</h2>
                <div class="lecture-text-container">
                    ${videoData.content || '<p>No content available.</p>'}
                </div>
            </div>
        `;
        
        if (window.Prism) Prism.highlightAll();
    } else {
        document.getElementById('videoWrapper').style.display = 'block';
        document.getElementById('htmlContentContainer').style.display = 'none';
        document.getElementById('controlsBar').style.display = 'flex';
        
        const videoPath = '../' + videoData.file;
        video.src = videoPath;
        video.load();
    }
    
    updateStickyFooter();
}

function getCourseProgress() {
    try {
        const allProgress = JSON.parse(localStorage.getItem('progress') || '{}');
        return allProgress[currentCourse.id] || { watched: [], lastPosition: null };
    } catch (e) {
        return { watched: [], lastPosition: null };
    }
}

function markVideoComplete() {
    try {
        const allProgress = JSON.parse(localStorage.getItem('progress') || '{}');
        if (!allProgress[currentCourse.id]) {
            allProgress[currentCourse.id] = { watched: [], lastPosition: null };
        }
        
        const key = `${currentSection}-${currentVideo}`;
        if (!allProgress[currentCourse.id].watched.includes(key)) {
            allProgress[currentCourse.id].watched.push(key);
            allProgress[currentCourse.id].lastPosition = { section: currentSection, video: currentVideo };
            localStorage.setItem('progress', JSON.stringify(allProgress));
        }
    } catch (e) {}
}

function isVideoWatched(sectionIdx, videoIdx) {
    const progress = getCourseProgress();
    return progress.watched.includes(`${sectionIdx}-${videoIdx}`);
}

function updateStickyFooter() {
    const section = currentCourse.sections[currentSection];
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let hasPrev = currentSection > 0 || currentVideo > 0;
    let hasNext = false;
    let nextTitle = '';
    
    if (currentVideo < section.videos.length - 1) {
        hasNext = true;
        nextTitle = section.videos[currentVideo + 1].name;
    } else if (currentSection < currentCourse.sections.length - 1) {
        hasNext = true;
        nextTitle = currentCourse.sections[currentSection + 1].videos[0]?.name || 'Next Section';
    }
    
    prevBtn.disabled = !hasPrev;
    prevBtn.textContent = hasPrev ? '← Previous' : '← Previous';
    prevBtn.style.opacity = hasPrev ? '1' : '0.5';
    
    nextBtn.textContent = hasNext ? `Next → ${nextTitle.substring(0, 20)}...` : 'Next →';
    nextBtn.style.opacity = hasNext ? '1' : '0.5';
}

function prevVideo() {
    if (currentVideo > 0) {
        window.location.href = `player.html?course=${currentCourse.id}&section=${currentSection}&video=${currentVideo - 1}`;
    } else if (currentSection > 0) {
        const prevSection = currentCourse.sections[currentSection - 1];
        window.location.href = `player.html?course=${currentCourse.id}&section=${currentSection - 1}&video=${prevSection.videos.length - 1}`;
    }
}

function nextVideo() {
    const section = currentCourse.sections[currentSection];
    
    if (currentVideo < section.videos.length - 1) {
        window.location.href = `player.html?course=${currentCourse.id}&section=${currentSection}&video=${currentVideo + 1}`;
    } else if (currentSection < currentCourse.sections.length - 1) {
        window.location.href = `player.html?course=${currentCourse.id}&section=${currentSection + 1}&video=0`;
    }
}

function autoNextVideo() {
    nextVideo();
}

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    document.querySelectorAll('.sidebar-section-header').forEach((header, idx) => {
        expandedSections[idx] = true;
    });
}

document.addEventListener('DOMContentLoaded', init);