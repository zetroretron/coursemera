const fs = require('fs');
const path = require('path');
const getDuration = require('get-video-duration').getVideoDurationInSeconds;
const ffprobe = require('@ffprobe-installer/ffprobe');
const logger = require('./logger');

// Fix for ffprobe path in packaged app
const ffprobePath = ffprobe.path.replace('app.asar', 'app.asar.unpacked');

const CATEGORIES = {
    'ai': ['ai', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'llm', 'chatgpt', 'nlp', 'hugging face', 'langchain'],
    'web': ['web', 'react', 'vue', 'angular', 'node', 'javascript', 'html', 'css', 'frontend', 'backend', 'full stack', 'api', 'three.js'],
    'devops': ['devops', 'docker', 'kubernetes', 'linux', 'terraform', 'aws', 'cloud', 'git', 'jenkins', 'ansible'],
    'career': ['career', 'freelance', 'interview', 'resume', 'job', 'professional', 'personal branding'],
    'python': ['python', 'django', 'flask', 'automation', 'scraping'],
    'java': ['java', 'spring', 'android', 'kotlin']
};

function getCategory(title) {
    const lower = title.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(k => lower.includes(k))) return cat;
    }
    return 'other';
}

function generateId(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function getVideoDurationSafe(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const duration = await getDuration(filePath, ffprobePath);
            const totalSeconds = Math.floor(duration);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    } catch (e) {
        logger.error('Duration error for', filePath, ':', e.message);
    }
    return null;
}

function parseHtmlLesson(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const titleMatch = content.match(/<h2[^>]*id="lecture_heading"[^>]*>([^<]+)<\/h2>/i);
            const contentMatch = content.match(/<div class="lecture-text-container">([\s\S]*?)<\/div>/i);
            return {
                title: titleMatch ? titleMatch[1].trim() : 'Lesson',
                content: contentMatch ? contentMatch[1].trim() : ''
            };
        }
    } catch (e) {
        logger.error('HTML parse error:', filePath, e.message);
    }
    return { title: 'Lesson', content: '' };
}

async function processVideoFile(parentPath, fileName, courseFolderName, sectionName) {
    const filePath = path.join(parentPath, fileName);
    const ext = path.extname(fileName).toLowerCase();
    
    if (ext === '.mp4') {
        const duration = await getVideoDurationSafe(filePath);
        return {
            duration: duration,
            video: {
                name: fileName.replace(/\.mp4$/i, '').replace(/^\d+[\.\s-]*/, '').trim(),
                file: path.join(courseFolderName, sectionName, fileName),
                duration: duration || '--:--',
                type: 'video'
            }
        };
    } else if (ext === '.html') {
        const parsed = parseHtmlLesson(filePath);
        return {
            duration: null,
            video: {
                name: parsed.title,
                file: path.join(courseFolderName, sectionName, fileName),
                duration: 'text',
                type: 'html',
                content: parsed.content
            }
        };
    }
    return null;
}

function addDuration(total, durationStr) {
    if (!durationStr) return;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
        total.hours += parts[0];
        total.minutes += parts[1];
        total.seconds += parts[2];
    } else if (parts.length === 2) {
        total.minutes += parts[0];
        total.seconds += parts[1];
    }
}

async function scanCourses(coursesPath) {
    logger.info('Scanning courses from:', coursesPath);
    
    const entries = fs.readdirSync(coursesPath, { withFileTypes: true });
    const courses = [];
    
    for (const entry of entries) {
        if (entry.isDirectory()) {
            logger.info(`Scanning: ${entry.name}`);
            try {
                const course = await scanCourse(path.join(coursesPath, entry.name), entry.name);
                if (course.totalVideos > 0) {
                    courses.push(course);
                    logger.info(`  Found ${course.totalVideos} items`);
                }
            } catch (e) {
                logger.error(`Error scanning ${entry.name}:`, e.message);
            }
        }
    }
    
    logger.info(`Total courses: ${courses.length}`);
    logger.info(`Total items: ${courses.reduce((sum, c) => sum + c.totalVideos, 0)}`);
    
    return courses;
}

async function scanCourse(folderPath, folderName) {
    // Generic title cleaning: remove common prefixes/suffixes but keep the name clean
    const title = folderName.replace(/^\d+[\.\s-]*/, '').replace(/\s*\(\d+\.\d+\)$/, '').trim();
    const courseId = generateId(folderName);
    const category = getCategory(title);
    const thumbnail = `https://picsum.photos/seed/${courseId}/400/225`;
    
    const sections = [];
    let totalVideos = 0;
    let totalDuration = { hours: 0, minutes: 0, seconds: 0 };
    
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    // 1. Handle direct files in course root (no sections)
    const rootVideos = [];
    for (const entry of entries) {
        if (entry.isFile()) {
            const result = await processVideoFile(folderPath, entry.name, folderName, '');
            if (result) {
                rootVideos.push(result.video);
                addDuration(totalDuration, result.duration);
                totalVideos++;
            }
        }
    }
    
    if (rootVideos.length > 0) {
        sections.push({
            name: 'Contents',
            videos: rootVideos
        });
    }

    // 2. Handle subdirectories as sections
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const sectionName = entry.name.replace(/^\d+[\.\s-]*/, '');
            const sectionPath = path.join(folderPath, entry.name);
            const videos = [];
            
            const sectionFiles = fs.readdirSync(sectionPath);
            
            for (const file of sectionFiles.sort()) {
                const result = await processVideoFile(sectionPath, file, folderName, entry.name);
                if (result) {
                    videos.push(result.video);
                    addDuration(totalDuration, result.duration);
                    totalVideos++;
                }
            }
            
            if (videos.length > 0) {
                sections.push({
                    name: sectionName,
                    videos: videos
                });
            }
        }
    }
    
    while (totalDuration.seconds >= 60) {
        totalDuration.minutes++;
        totalDuration.seconds -= 60;
    }
    while (totalDuration.minutes >= 60) {
        totalDuration.hours++;
        totalDuration.minutes -= 60;
    }
    
    let durationText = '';
    if (totalDuration.hours > 0) {
        durationText = `${totalDuration.hours}h ${totalDuration.minutes}m`;
    } else {
        durationText = `${totalDuration.minutes}m`;
    }
    
    return {
        id: courseId,
        title: title,
        thumbnail: thumbnail,
        category: category,
        sections: sections,
        totalVideos: totalVideos,
        totalDuration: durationText,
        path: folderName
    };
}

module.exports = { scanCourses };