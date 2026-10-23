// State management
let videos = [];
let currentVideoId = null;
const STORAGE_KEY = 'nocookies_videos';

// DOM Elements
const form = document.getElementById('add-video-form');
const urlInput = document.getElementById('video-url');
const videoListEl = document.getElementById('video-list');
const emptyStateEl = document.getElementById('empty-state');
const playerEl = document.getElementById('player');
const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file');

// --- Utility Functions ---

/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The video ID or null if invalid.
 */
function extractVideoId(url) {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Formats seconds into MM:SS string.
 * @param {number} seconds 
 * @returns {string}
 */
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
        alert('This video is already in your playlist.');
        loadVideo(videoId); // Just load it if it exists
        return;
    }

    // Fetch title using noembed (free, no API key required)
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

    videos.unshift(newVideo); // Add to top of list
    saveVideos();
    renderVideoList();
    loadVideo(videoId);
    
    urlInput.value = ''; // Clear input
}

function deleteVideo(videoId, event) {
    event.stopPropagation(); // Prevent triggering the play action
    if (confirm('Remove this video from your playlist?')) {
        videos = videos.filter(v => v.id !== videoId);
        saveVideos();
        renderVideoList();
        
        // If the deleted video was playing, clear the player
        if (currentVideoId === videoId) {
            currentVideoId = null;
            playerEl.innerHTML = '';
            emptyStateEl.style.display = 'block';
        }
    }
}

function loadVideo(videoId) {
    currentVideoId = videoId;
    renderVideoList(); // To update the 'active' class
    
    // We will replace this with actual YT.Player logic next.
    console.log(`Loading video: ${videoId}`);
    emptyStateEl.style.display = 'none';
    playerEl.innerHTML = `<div style="color: white; display: flex; align-items: center; justify-content: center; height: 100%;">Player loading for ${videoId}... (Step 3)</div>`;
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

// Placeholder listeners for Step 4 (Import/Export)
exportBtn.addEventListener('click', () => {
    alert('Export functionality will be implemented in Step 4.');
});

importFileInput.addEventListener('change', () => {
    alert('Import functionality will be implemented in Step 4.');
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', loadVideos);
