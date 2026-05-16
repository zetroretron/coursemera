# CourseMera

A beautiful desktop learning platform for video courses. Built with Electron, CourseMera allows you to select any folder containing your courses and provides a full YouTube-style video player experience.

![CourseMera](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Smart Scanning**: Automatically detects new courses in your selected folder
- **Dark/Light Theme**: Toggle between dark and light themes
- **YouTube-Style Player**: Full-featured video player with theater mode, playback speed, and keyboard shortcuts
- **Progress Tracking**: Track your learning progress across courses
- **Category Support**: Organize courses by category (AI & ML, Web Dev, DevOps, etc.)
- **HTML Lessons**: Support for text-based HTML lessons alongside video content
- **Cross-Platform**: Works on Windows, Mac, and Linux

## Screenshots

### Dashboard / Home Screen
![CourseMera Dashboard](assets/screenshots/01-dashboard-home.png)
*Main dashboard showing search, stats, continue learning section, and category filters*

### Course Syllabus / Section List (Collapsed View)
![CourseMera Course Syllabus](assets/screenshots/02-course-syllabus.png)
*Detailed course view with expandable sections, progress tracking, and resume functionality*

### Video Player / Lesson View
![CourseMera Video Player](assets/screenshots/03-video-player.png)
*Lesson player with video controls, section sidebar, and navigation between lessons*

## Installation

### Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/zetroretron/coursemera/releases) page.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/zetroretron/coursemera.git
cd coursemera-desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for Windows
npm run build:win
```

## Usage

1. Launch CourseMera
2. Click "Select Courses Folder" to choose your courses directory
3. The app will automatically scan for video courses (MP4, HTML files)
4. Browse courses by category or search
5. Click on a course to view its sections and videos
6. Double-click a video to open the full player

### Supported Formats

- **Video**: MP4, WebM
- **Interactive**: HTML files (embedded courses)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space / K | Play/Pause |
| J | Rewind 10 seconds |
| L | Forward 10 seconds |
| ← / → | Seek ±5 seconds |
| ↑ / ↓ | Volume |
| M | Mute |
| F | Fullscreen |
| T | Theater Mode |
| I | Picture-in-Picture |
| < / > | Speed control |
| 0-9 | Jump to 0%-90% |
| ? | Show help |

## Tech Stack

- [Electron](https://www.electronjs.org/) - Desktop app framework
- [Express](https://expressjs.com/) - Local server for serving courses
- [electron-builder](https://www.electron.build/) - Build and packaging
- [electron-log](https://github.com/megahertz/electron-log) - Logging
- [get-video-duration](https://www.npmjs.com/package/get-video-duration) - Video duration extraction

## License

MIT License - see [LICENSE](LICENSE) for details.