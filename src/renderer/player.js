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
            let courses = data.courses || [];
            if (courses.length === 0) {
                const local = localStorage.getItem('coursesData');
                if (local) courses = JSON.parse(local);
            }
            const course = courses.find(c => c.id === courseId);
            if (!course) {
                if (courses.length > 0) {
                    document.body.innerHTML = `
                        <div style="padding:40px;text-align:center;font-family:sans-serif">
                            <h2>Course not found</h2>
                            <p>The course "${courseId}" was not found in the scanned courses.</p>
                            <p>Try <a href="index.html" style="color:#58a6ff">rescanning the folder</a> from the home screen.</p>
                        </div>
                    `;
                    return;
                }
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
            document.title = `${course.title} - CourseMera`;
        })
        .catch(() => {
            const local = localStorage.getItem('coursesData');
            if (local) {
                const courses = JSON.parse(local);
                const course = courses.find(c => c.id === courseId);
                if (course) {
                    currentCourse = course;
                    currentSection = sectionIdx;
                    currentVideo = videoIdx;
                    saveRecentCourse(courseId);
                    setupPlayer();
                    renderSidebar();
                    loadVideo();
                    updateStickyFooter();
                    document.title = `${course.title} - CourseMera`;
                    return;
                }
            }
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

    const doubleClickLeft = document.getElementById('doubleClickLeft');
    const doubleClickRight = document.getElementById('doubleClickRight');

    doubleClickLeft.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        seek(-10);
        flashSeekFeedback('seekFeedbackLeft');
    });
    doubleClickRight.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        seek(10);
        flashSeekFeedback('seekFeedbackRight');
    });

    let clickTimeout = null;
    video.addEventListener('click', () => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        } else {
            clickTimeout = setTimeout(() => {
                clickTimeout = null;
                togglePlay();
            }, 250);
        }
    });
    
    // Double click for fullscreen
    video.addEventListener('dblclick', () => {
        toggleFullscreen();
    });

    // NOTE: playBtn and playBtnLarge click listeners are bound in setupControls()
    // to prevent duplicate firing that immediately pauses the video again.

    const wrapper = document.getElementById('videoWrapper');

    // Auto-hide controls idle timer
    let hideControlsTimeout = null;
    const hideControls = () => {
        if (!video.paused) {
            wrapper.classList.add('controls-hidden');
            wrapper.classList.remove('controls-visible');
        }
    };
    const showControls = () => {
        wrapper.classList.remove('controls-hidden');
        wrapper.classList.add('controls-visible');
        clearTimeout(hideControlsTimeout);
        if (!video.paused) {
            hideControlsTimeout = setTimeout(hideControls, 2500);
        }
    };
    wrapper.addEventListener('mousemove', showControls);
    wrapper.addEventListener('mouseleave', () => { if (!video.paused) hideControls(); });

    video.addEventListener('play', () => {
        isPlaying = true;
        setPlayIcon(true);
        playBtnLarge.style.display = 'none';
        document.getElementById('loadingSpinner').style.display = 'none';
        wrapper.classList.remove('paused');
        document.getElementById('progressPlayed').classList.add('smooth');
        showControls(); // start the hide timer
    });

    video.addEventListener('pause', () => {
        isPlaying = false;
        setPlayIcon(false);
        playBtnLarge.style.display = 'flex';
        wrapper.classList.add('paused');
        document.getElementById('progressPlayed').classList.remove('smooth');
        showControls(); // ensure visible
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

    // Show controls initially (paused state)
    wrapper.classList.add('paused');

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
    // New IDs: progressBar is now the track div, progressContainer is progressArea
    const progressTrack = document.getElementById('progressBar');
    const progressArea = document.getElementById('progressContainer');
    const timeTooltip = document.getElementById('timeTooltip');

    playBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    const playBtnLarge = document.getElementById('playBtnLarge');
    if (playBtnLarge) {
        playBtnLarge.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    }
    
    rewindBtn.addEventListener('click', () => seek(-10));
    forwardBtn.addEventListener('click', () => seek(10));

    muteBtn.addEventListener('click', () => toggleMute());
    volumeSlider.addEventListener('input', (e) => {
        video.volume = parseFloat(e.target.value);
        updateVolumeIcon();
    });

    speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => speedMenu.classList.remove('open'));

    speedMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const speed = parseFloat(btn.dataset.speed);
            video.playbackRate = speed;
            speedBtn.textContent = speed === 1 ? '1×' : speed + '×';
            speedMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            speedMenu.classList.remove('open');
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

    // Drag to scrub logic
    let isScrubbing = false;
    let wasPausedBeforeScrub = false;
    const progressPlayed = document.getElementById('progressPlayed');
    const wrapper = document.getElementById('videoWrapper');

    const updateScrub = (e) => {
        const rect = progressArea.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = (video.duration || 0) * percent;

        document.getElementById('progressThumb').style.left = `${percent * 100}%`;
        progressPlayed.style.width = `${percent * 100}%`;

        if (!isNaN(time) && isFinite(time)) {
            timeTooltip.textContent = formatTime(time);
            timeTooltip.style.left = `${percent * 100}%`;
            timeTooltip.style.display = 'block';
            video.currentTime = time;
        }
    };

    progressArea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isScrubbing = true;
        wasPausedBeforeScrub = video.paused;
        video.pause();
        wrapper.classList.add('scrubbing');
        progressPlayed.classList.remove('smooth');
        updateScrub(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScrubbing) return;
        e.preventDefault();
        updateScrub(e);
    });

    document.addEventListener('mouseup', () => {
        if (!isScrubbing) return;
        isScrubbing = false;
        wrapper.classList.remove('scrubbing');
        timeTooltip.style.display = 'none';
        if (!wasPausedBeforeScrub) {
            video.play();
            progressPlayed.classList.add('smooth');
        }
    });

    // Hover tooltip (when not scrubbing)
    progressArea.addEventListener('mousemove', (e) => {
        if (isScrubbing) return;
        const rect = progressArea.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = (video.duration || 0) * percent;
        if (!isNaN(time) && isFinite(time)) {
            timeTooltip.textContent = formatTime(time);
            timeTooltip.style.left = `${percent * 100}%`;
            timeTooltip.style.display = 'block';
        }
    });

    progressArea.addEventListener('mouseleave', () => {
        if (!isScrubbing) timeTooltip.style.display = 'none';
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
    if (!video.src && !video.currentSrc) return;
    const playBtnLarge = document.getElementById('playBtnLarge');
    
    // Play pop animation
    playBtnLarge.classList.remove('pop');
    void playBtnLarge.offsetWidth; // trigger reflow
    playBtnLarge.classList.add('pop');

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
    const icon = document.getElementById('volumeIcon');
    if (!icon) return;
    if (video.muted || video.volume === 0) {
        // Muted icon
        icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else if (video.volume < 0.33) {
        // Low volume
        icon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
    } else if (video.volume < 0.67) {
        // Medium volume
        icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
    } else {
        // Full volume
        icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    }
}

function seek(seconds) {
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
}


function flashSeekFeedback(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('show');
    clearTimeout(el._flashTimer);
    el._flashTimer = setTimeout(() => el.classList.remove('show'), 600);
}
function updateProgressBar() {
    if (!video.duration) return;
    // Don't update if scrubbing (handled by mousemove)
    if (document.getElementById('videoWrapper').classList.contains('scrubbing')) return;
    
    const percent = (video.currentTime / video.duration) * 100;
    document.getElementById('progressPlayed').style.width = percent + '%';
    document.getElementById('progressThumb').style.left = percent + '%';
}

function updateBufferedBar() {
    if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100;
        document.getElementById('progressBuffered').style.width = percent + '%';
    }
}

function setPlayIcon(playing) {
    const playIcon = document.getElementById('playIcon');
    if (playing) {
        playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
        playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }
}

function updateTimeDisplay() {
    if (!video.duration) return;
    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);
    document.getElementById('timeDisplay').textContent = `${current} / ${total}`;
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleTheater() {
    const layout = document.getElementById('playerLayout');
    const wrapper = document.getElementById('videoWrapper');

    if (layout.classList.contains('theater-mode')) {
        layout.classList.remove('theater-mode');
        wrapper.classList.remove('theater-mode');
    } else {
        layout.classList.add('theater-mode');
        wrapper.classList.add('theater-mode');
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
        document.getElementById('htmlContentContainer').style.display = 'none';
        document.getElementById('controlsBar').style.display = 'flex';
        
        const videoPath = '/' + videoData.file;
        const videoEl = document.getElementById('videoPlayer');
        
        // Remove previous listeners to prevent leaks
        if (videoEl._onError) videoEl.removeEventListener('error', videoEl._onError);
        if (videoEl._onMeta) videoEl.removeEventListener('loadedmetadata', videoEl._onMeta);
        
        videoEl._onError = () => {
            console.error('[CourseMera] Video error:', videoEl.error, '| src:', videoEl.src);
        };
        videoEl._onMeta = () => {
            console.log('[CourseMera] Video metadata: duration=' + videoEl.duration + 's');
        };
        
        videoEl.addEventListener('error', videoEl._onError);
        videoEl.addEventListener('loadedmetadata', videoEl._onMeta);
        videoEl.src = videoPath;
        videoEl.load();
        console.log('[CourseMera] Loading video:', videoPath, '| Full URL:', window.location.origin + videoPath);
    }
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
    prevBtn.textContent = '← Previous';
    prevBtn.style.opacity = hasPrev ? '1' : '0.5';
    
    nextBtn.textContent = hasNext ? `Next → ${nextTitle.substring(0, 20)}...` : 'Next →';
    nextBtn.disabled = !hasNext;
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
}

document.addEventListener('fullscreenchange', () => {
    const wrapper = document.getElementById('videoWrapper');
    if (document.fullscreenElement) {
        if (wrapper) wrapper.classList.add('fullscreen-mode');
    } else {
        if (wrapper) wrapper.classList.remove('fullscreen-mode');
    }
});

document.addEventListener('DOMContentLoaded', init);