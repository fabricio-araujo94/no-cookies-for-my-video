// State management
let videos = [];
let currentVideoId = null;
const STORAGE_KEY = 'nocookies_videos';

// Player management
let player = null;
let saveInterval = null;

// DOM Elements
const form = document.getElementById('add-video-form');
const urlInput = document.getElementById('video-url');
const videoListEl = document.getElementById('video-list');
const emptyStateEl = document.getElementById('empty-state');
const playerEl = document.getElementById('player');
const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file');

// --- Utility Functions ---

function extractVideoId(url) {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- Storage Management ---

function loadVideos() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            videos = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse localStorage data', e);
            videos = [];
        }
    }
    renderVideoList();
}

function saveVideos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

// --- Core Actions ---

async function addVideo(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        alert('Invalid YouTube URL. Please check the format.');
        return;
    }

    if (videos.some(v => v.id === videoId)) {
        loadVideo(videoId);
        return;
    }

    let title = `Video ${videoId}`;
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await response.json();
        if (data.title) {
            title = data.title;
        }
    } catch (e) {
        console.warn('Could not fetch video title, using ID as fallback.', e);
    }

    const newVideo = {
        id: videoId,
        title: title,
        currentTime: 0,
        addedAt: Date.now()
    };

    videos.unshift(newVideo);
    saveVideos();
    renderVideoList();
    loadVideo(videoId);
    
    urlInput.value = '';
}

function deleteVideo(videoId, event) {
    event.stopPropagation();
    if (confirm('Remove this video from your playlist?')) {
        videos = videos.filter(v => v.id !== videoId);
        saveVideos();
        renderVideoList();
        
        if (currentVideoId === videoId) {
            currentVideoId = null;
            if (player && typeof player.destroy === 'function') {
                player.destroy();
                player = null;
            }
            playerEl.innerHTML = '';
            emptyStateEl.style.display = 'block';
            stopSavingTime();
        }
    }
}

function loadVideo(videoId) {
    currentVideoId = videoId;
    renderVideoList();
    
    const video = videos.find(v => v.id === videoId);
    const startSeconds = video ? video.currentTime : 0;
    emptyStateEl.style.display = 'none';

    if (window.YT && window.YT.Player) {
        initOrUpdatePlayer(videoId, startSeconds);
    } else {
        const checkAPI = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(checkAPI);
                initOrUpdatePlayer(videoId, startSeconds);
            }
        }, 100);
    }
}

// --- YouTube IFrame API Integration ---

function loadYouTubeAPI() {
    if (document.getElementById('youtube-iframe-api')) return;
    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function initOrUpdatePlayer(videoId, startSeconds) {
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById({
            videoId: videoId,
            startSeconds: Math.floor(startSeconds)
        });
    } else {
        player = new YT.Player('player', {
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'start': Math.floor(startSeconds),
                'rel': 0 // Minimize related videos from other channels
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            },
            host: 'https://www.youtube-nocookie.com' // Privacy-enhanced mode
        });
    }
}

function onPlayerReady(event) {
    // Player is ready. We can optionally auto-play here if desired.
    // event.target.playVideo();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        const time = player.getCurrentTime();
        updateVideoTime(currentVideoId, time);
        stopSavingTime();
    } else if (event.data === YT.PlayerState.PLAYING) {
        startSavingTime();
    }
}

function startSavingTime() {
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(() => {
        if (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === YT.PlayerState.PLAYING) {
            const time = player.getCurrentTime();
            updateVideoTime(currentVideoId, time);
        }
    }, 5000); // Save every 5 seconds while playing
}

function stopSavingTime() {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
}

function updateVideoTime(videoId, time) {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        video.currentTime = time;
        saveVideos();
        updateTimeInDOM(videoId, time);
    }
}

function updateTimeInDOM(videoId, time) {
    const timeEl = document.querySelector(`.video-item[data-id="${videoId}"] .video-time`);
    if (timeEl) {
        timeEl.textContent = `Watched: ${formatTime(time)}`;
    }
}

// --- Rendering ---

function renderVideoList() {
    videoListEl.innerHTML = '';
    
    if (videos.length === 0) {
        videoListEl.innerHTML = '<li style="color: var(--text-secondary); text-align: center; padding: 1rem;">No videos saved yet.</li>';
        return;
    }

    videos.forEach(video => {
        const li = document.createElement('li');
        li.className = `video-item ${video.id === currentVideoId ? 'active' : ''}`;
        li.setAttribute('data-id', video.id); // Added for efficient DOM updates
        li.onclick = () => loadVideo(video.id);

        li.innerHTML = `
            <div class="video-info">
                <span class="video-title" title="${video.title}">${video.title}</span>
                <span class="video-time">Watched: ${formatTime(video.currentTime)}</span>
            </div>
            <button class="delete-btn" title="Remove video">&times;</button>
        `;

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.onclick = (e) => deleteVideo(video.id, e);

        videoListEl.appendChild(li);
    });
}

// --- Event Listeners ---

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) addVideo(url);
});

exportBtn.addEventListener('click', () => {
    alert('Export functionality will be implemented in Step 4.');
});

importFileInput.addEventListener('change', () => {
    alert('Import functionality will be implemented in Step 4.');
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    loadYouTubeAPI(); // Preload the YouTube API script
});
