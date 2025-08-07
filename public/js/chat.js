// Socket connection
const socket = io();

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const userList = document.getElementById('userList');
const userSearch = document.getElementById('userSearch');
const searchBtn = document.getElementById('searchBtn');
const currentUserSpan = document.getElementById('currentUser');
const logoutBtn = document.getElementById('logoutBtn');
const chatWith = document.getElementById('chatWith');
const userStatus = document.getElementById('userStatus');
const recentChats = document.getElementById('recentChats');

// Attachment menu elements
const attachmentBtn = document.getElementById('attachmentBtn');
const attachmentMenu = document.getElementById('attachmentMenu');
const voiceBtn = document.getElementById('voiceBtn');
const voiceRecordingUI = document.getElementById('voiceRecordingUI');
const recordingTime = document.getElementById('recordingTime');
const recordingInstruction = document.getElementById('recordingInstruction');
const pauseRecordingBtn = document.getElementById('pauseRecordingBtn');
const deleteRecordingBtn = document.getElementById('deleteRecordingBtn');
const sendRecordingBtn = document.getElementById('sendRecordingBtn');

// File input elements
const cameraInput = document.getElementById('cameraInput');
const photosInput = document.getElementById('photosInput');
const documentInput = document.getElementById('documentInput');

// Chat action buttons
const searchMessagesBtn = document.getElementById('searchMessagesBtn');
const scheduleMessageBtn = document.getElementById('scheduleMessageBtn');

// Group chat elements
const createGroupBtn = document.getElementById('createGroupBtn');
const groupList = document.getElementById('groupList');

// Mobile elements
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const mobileUserSearch = document.getElementById('mobileUserSearch');
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const mobileUserList = document.getElementById('mobileUserList');

// Theme and profile
const themeToggle = document.getElementById('themeToggle');
const profileBtn = document.getElementById('profileBtn');

// Send button
const sendBtn = document.querySelector('.send-btn');

// User variables
let currentUser = localStorage.getItem('username');
let currentUserId = localStorage.getItem('userId');
let selectedUser = null;
let onlineUsers = new Set();
let recentChatsList = new Set();

// Voice recording variables
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let isRecording = false;
let isPaused = false;

// Media preview variables
let previewedMedia = null;
let previewedMediaType = null;

// Check if user is logged in
if (!currentUser || !currentUserId) {
    window.location.href = '/';
}

// Display current user
if (currentUserSpan) {
    currentUserSpan.textContent = `Logged in as: ${currentUser}`;
}

// Register user with socket
socket.emit('registerUser', { userId: currentUserId, username: currentUser });

// Initialize theme
initTheme();

// Initialize all event listeners
initializeEventListeners();

function initializeEventListeners() {
    // Message sending
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // User search
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const username = userSearch.value.trim();
            if (username) {
                searchUser(username);
            }
        });
    }

    if (userSearch) {
        userSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const username = userSearch.value.trim();
                if (username) {
                    searchUser(username);
                }
            }
        });
    }

    // Mobile search
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            const username = mobileUserSearch.value.trim();
            if (username) {
                searchUser(username);
            }
        });
    }

    if (mobileUserSearch) {
        mobileUserSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const username = mobileUserSearch.value.trim();
                if (username) {
                    searchUser(username);
                }
            }
        });
    }

    // Attachment menu
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', () => {
            attachmentMenu.classList.toggle('show');
        });
    }

    // Voice recording
    if (voiceBtn) {
        voiceBtn.addEventListener('mousedown', startRecording);
        voiceBtn.addEventListener('mouseup', stopRecording);
        voiceBtn.addEventListener('mouseleave', stopRecording);
        voiceBtn.addEventListener('touchstart', startRecording);
        voiceBtn.addEventListener('touchend', stopRecording);
    }

    // Voice recording actions
    if (pauseRecordingBtn) {
        pauseRecordingBtn.addEventListener('click', () => {
            if (isPaused) {
                mediaRecorder.resume();
                isPaused = false;
                pauseRecordingBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                mediaRecorder.pause();
                isPaused = true;
                pauseRecordingBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }

    if (deleteRecordingBtn) {
        deleteRecordingBtn.addEventListener('click', () => {
            stopRecording();
            audioChunks = [];
        });
    }

    if (sendRecordingBtn) {
        sendRecordingBtn.addEventListener('click', () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onload = (e) => {
                    socket.emit('privateMessage', {
                        to: selectedUser,
                        message: '',
                        media: {
                            type: 'audio',
                            data: e.target.result,
                            filename: 'voice_message.wav',
                            size: audioBlob.size
                        }
                    });
                };
                reader.readAsDataURL(audioBlob);
                stopRecording();
            }
        });
    }

    // File inputs
    if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && selectedUser) {
                showMediaPreview(file, 'image');
            }
        });
    }

    if (photosInput) {
        photosInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0 && selectedUser) {
                if (files.length === 1) {
                    showMediaPreview(files[0], 'image');
                } else {
                    showMultipleImagesPreview(files);
                }
            }
        });
    }

    if (documentInput) {
        documentInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && selectedUser) {
                showMediaPreview(file, 'file');
            }
        });
    }

    // Mobile sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (sidebar) {
                sidebar.classList.toggle('show');
            }
        });
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Profile button
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showProfileModal();
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/auth/logout');
                localStorage.removeItem('username');
                localStorage.removeItem('userId');
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    // Close attachment menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!attachmentMenu.contains(e.target) && !attachmentBtn.contains(e.target)) {
            attachmentMenu.classList.remove('show');
        }
    });
}

// Message sending
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && selectedUser) {
        socket.emit('privateMessage', {
            to: selectedUser,
            message: message
        });
        messageInput.value = '';
        messageInput.style.height = 'auto';
    } else if (!selectedUser) {
        alert('Please select a user to send message to');
    }
}

// User search
function searchUser(username) {
    if (username === currentUser) {
        alert('You cannot chat with yourself!');
        return;
    }
    
    recentChatsList.add(username);
    updateRecentChats();
    selectUser(username);
    
    if (userSearch) userSearch.value = '';
    if (mobileUserSearch) mobileUserSearch.value = '';
}

// User selection
function selectUser(username) {
    selectedUser = username;
    chatWith.textContent = `Chatting with: ${username}`;
    userStatus.textContent = onlineUsers.has(username) ? '🟢 Online' : '🔴 Offline';
    
    loadChatHistory(username);
    
    // Close sidebar on mobile
    if (sidebar) {
        sidebar.classList.remove('show');
    }
}

// Load chat history
async function loadChatHistory(username) {
    if (!username || username === 'undefined') return;
    
    try {
        chatMessages.innerHTML = '<div class="loading">Loading chat history...</div>';
        
        const response = await fetch(`/api/messages/${username}`);
        if (!response.ok) {
            throw new Error('Failed to load chat history');
        }
        
        const messages = await response.json();
        
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-comments"></i>
                    <p>No previous messages</p>
                    <small>Start a conversation with ${username}</small>
                </div>
            `;
            return;
        }
        
        messages.forEach(msg => {
            const isOwn = msg.sender === currentUser;
            const messageText = msg.message ? decrypt(msg.message) : '';
            
            if (!msg.deletedForSender || !isOwn) {
                appendMessage(
                    msg.sender, 
                    messageText, 
                    isOwn, 
                    msg.timestamp, 
                    msg.media,
                    msg._id,
                    msg.edited
                );
            }
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (username !== currentUser) {
            recentChatsList.add(username);
            updateRecentChats();
        }
        
    } catch (error) {
        console.error('Error loading chat history:', error);
        chatMessages.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load chat history</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Append message to chat
function appendMessage(sender, message, isOwn, timestamp, media = null, messageId = null, edited = false) {
    const msg = document.createElement('div');
    msg.className = `message ${isOwn ? 'own' : 'incoming'}`;
    if (messageId) {
        msg.setAttribute('data-message-id', messageId);
    }
    
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let mediaContent = '';
    let hasMedia = false;
    if (media) {
        hasMedia = true;
        if (media.type === 'image') {
            mediaContent = `
                <div class="message-media">
                    <img src="${media.data}" alt="Image" onclick="openImageModal('${media.data}')" style="cursor: pointer;">
                </div>
            `;
        } else if (media.type === 'audio') {
            mediaContent = `
                <div class="message-media">
                    <audio controls>
                        <source src="${media.data}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        } else if (media.type === 'file' || media.type === 'document') {
            const fileSize = media.size ? formatFileSize(media.size) : '';
            const icon = media.type === 'document' ? 'fas fa-file-alt' : 'fas fa-file';
            mediaContent = `
                <div class="message-media">
                    <div class="file-attachment" onclick="downloadFile('${media.data}', '${media.filename}')">
                        <i class="${icon}"></i>
                        <div class="file-info">
                            <div class="file-name">${media.filename}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <i class="fas fa-download"></i>
                    </div>
                </div>
            `;
        }
    }
    
    const editedIndicator = edited ? ' <span class="edited-indicator">(edited)</span>' : '';
    
    msg.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <strong>${sender}</strong>
                <span class="message-time">${time}</span>
            </div>
            ${message ? `<div class="message-text">${message}${editedIndicator}</div>` : ''}
            ${mediaContent}
        </div>
    `;
    
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (isOwn && messageId) {
        addMessageActions(msg, messageId, true, message);
    }
    
    if (messageId) {
        addMessageContextMenu(msg, messageId, isOwn, message || '', hasMedia);
    }
}

// Attachment selection
function selectAttachment(type) {
    attachmentMenu.classList.remove('show');
    
    switch(type) {
        case 'camera':
            cameraInput.click();
            break;
        case 'photos':
            photosInput.click();
            break;
        case 'document':
            documentInput.click();
            break;
        case 'location':
            alert('Location sharing coming soon!');
            break;
        case 'contact':
            alert('Contact sharing coming soon!');
            break;
        case 'poll':
            alert('Poll creation coming soon!');
            break;
    }
}

// Voice recording
function startRecording() {
    if (!selectedUser) {
        alert('Please select a user to send voice message to');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            recordingStartTime = Date.now();
            isRecording = true;
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                showVoicePreview(audioBlob);
            };
            
            mediaRecorder.start();
            voiceBtn.classList.add('recording');
            voiceRecordingUI.style.display = 'flex';
            updateRecordingTime();
            
            recordingTimer = setInterval(updateRecordingTime, 1000);
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone');
        });
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceRecordingUI.style.display = 'none';
        
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }
    }
}

function updateRecordingTime() {
    if (recordingStartTime) {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function showVoicePreview(audioBlob) {
    const reader = new FileReader();
    reader.onload = (e) => {
        showMediaPreview({
            data: e.target.result,
            filename: 'voice_message.wav',
            size: audioBlob.size,
            type: 'audio'
        }, 'audio');
    };
    reader.readAsDataURL(audioBlob);
}

// Media preview
function showMediaPreview(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewedMedia = {
            data: e.target.result,
            filename: file.name || 'file',
            size: file.size,
            type: type
        };
        previewedMediaType = type;
        
        const modal = document.getElementById('mediaPreviewModal');
        const content = document.getElementById('mediaPreviewContent');
        
        if (type === 'image') {
            content.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        } else if (type === 'audio') {
            content.innerHTML = `<audio controls><source src="${e.target.result}" type="audio/wav"></audio>`;
        } else {
            content.innerHTML = `
                <div class="file-preview">
                    <i class="fas fa-file" style="font-size: 48px; color: var(--primary-color); margin-bottom: 10px;"></i>
                    <div style="font-weight: 600; margin-bottom: 5px;">${file.name}</div>
                    <div style="color: var(--text-secondary);">${formatFileSize(file.size)}</div>
                </div>
            `;
        }
        
        modal.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function closeMediaPreview() {
    const modal = document.getElementById('mediaPreviewModal');
    modal.style.display = 'none';
    previewedMedia = null;
    previewedMediaType = null;
}

function sendPreviewedMedia() {
    if (previewedMedia && selectedUser) {
        socket.emit('privateMessage', {
            to: selectedUser,
            message: '',
            media: previewedMedia
        });
        closeMediaPreview();
    }
}

// Multiple images preview
function showMultipleImagesPreview(files) {
    const modal = document.createElement('div');
    modal.className = 'media-preview-modal';
    modal.style.display = 'flex';
    
    let imageHTML = '';
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageHTML += `
                <div class="multiple-image-preview">
                    <img src="${e.target.result}" alt="Image ${index + 1}">
                    <div class="image-checkbox">
                        <input type="checkbox" id="img${index}" checked>
                        <label for="img${index}">Send</label>
                    </div>
                </div>
            `;
            
            if (index === files.length - 1) {
                modal.innerHTML = `
                    <div class="media-preview-content">
                        <div class="media-preview-header">
                            <h3><i class="fas fa-images"></i> Select Images to Send</h3>
                            <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="media-preview-body">
                            <div class="multiple-images-grid">
                                ${imageHTML}
                            </div>
                            <div class="media-preview-actions">
                                <button class="cancel-btn" onclick="this.closest('.media-preview-modal').remove()">Cancel</button>
                                <button class="send-btn" onclick="sendSelectedImages()">Send Selected</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
        };
        reader.readAsDataURL(file);
    });
}

function sendSelectedImages() {
    const checkboxes = document.querySelectorAll('.multiple-image-preview input[type="checkbox"]:checked');
    const images = Array.from(checkboxes).map(cb => {
        const img = cb.closest('.multiple-image-preview').querySelector('img');
        return img.src;
    });
    
    images.forEach(imageData => {
        socket.emit('privateMessage', {
            to: selectedUser,
            message: '',
            media: {
                type: 'image',
                data: imageData,
                filename: 'image.jpg'
            }
        });
    });
    
    document.querySelector('.media-preview-modal').remove();
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="image-modal-content">
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageSrc}" alt="Full size image">
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Theme functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to Dark Mode';
        }
    }
}

// Profile functionality
function showProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-content">
            <div class="profile-header">
                <h3><i class="fas fa-user"></i> Profile</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="profile-body">
                <div class="profile-avatar">
                    <div class="avatar-placeholder">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                <div class="profile-info">
                    <h4>${currentUser}</h4>
                    <p class="status">Hey there! I'm using Secure Chatroom</p>
                    <p class="member-since">Member since ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="profile-actions">
                    <button class="action-btn" onclick="editStatus()">
                        <i class="fas fa-edit"></i> Edit Status
                    </button>
                    <button class="action-btn" onclick="changeAvatar()">
                        <i class="fas fa-camera"></i> Change Avatar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function editStatus() {
    const newStatus = prompt('Enter your new status:', 'Hey there! I\'m using Secure Chatroom');
    if (newStatus && newStatus.trim()) {
        console.log('Status updated:', newStatus);
        alert('Status updated! (This would be saved to database in production)');
    }
}

function changeAvatar() {
    alert('Avatar change feature would be implemented here!');
}

// Recent chats
function updateRecentChats() {
    if (!recentChats) return;
    
    recentChats.innerHTML = '';
    const uniqueUsers = new Set();
    recentChatsList.forEach(user => {
        if (user && user.trim() !== '' && user !== 'undefined') {
            uniqueUsers.add(user.trim());
        }
    });
    
    uniqueUsers.forEach(username => {
        if (username && username !== currentUser) {
            const li = document.createElement('li');
            li.className = 'recent-chat-item';
            li.innerHTML = `
                <span class="user-name">${username}</span>
                <span class="status">${onlineUsers.has(username) ? '🟢 Online' : '🔴 Offline'}</span>
            `;
            li.addEventListener('click', () => selectUser(username));
            recentChats.appendChild(li);
        }
    });
}

// User list updates
function updateUserList(users) {
    if (!userList) return;
    
    userList.innerHTML = '';
    users.forEach(username => {
        if (username !== currentUser) {
            const li = document.createElement('li');
            li.className = 'user-item';
            li.innerHTML = `
                <span class="user-name">${username}</span>
                <span class="status">🟢 Online</span>
            `;
            li.addEventListener('click', () => selectUser(username));
            userList.appendChild(li);
        }
    });
}

function updateMobileUserList() {
    if (!mobileUserList) return;
    
    mobileUserList.innerHTML = '';
    onlineUsers.forEach(username => {
        if (username !== currentUser) {
            const div = document.createElement('div');
            div.className = 'mobile-user-item';
            div.innerHTML = `
                <span class="user-name">${username}</span>
                <span class="status">🟢 Online</span>
            `;
            div.addEventListener('click', () => {
                selectUser(username);
                if (sidebar) {
                    sidebar.classList.remove('show');
                }
            });
            mobileUserList.appendChild(div);
        }
    });
}

// Message actions
function addMessageActions(messageElement, messageId, isOwn, messageText) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="action-btn edit-btn" onclick="editMessage('${messageId}', '${messageText}')" title="Edit">
            <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" onclick="deleteMessage('${messageId}')" title="Delete">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    if (!isOwn) {
        actionsDiv.querySelector('.edit-btn').style.display = 'none';
    }
    
    messageElement.appendChild(actionsDiv);
}

function editMessage(messageId, currentText) {
    const newText = prompt('Edit your message:', currentText);
    if (newText !== null && newText.trim() !== '') {
        socket.emit('editMessage', {
            messageId: messageId,
            newText: newText.trim()
        });
    }
}

function deleteMessage(messageId) {
    const deleteFor = confirm('Delete for:\n1. Cancel\n2. Delete for me only\n3. Delete for everyone');
    
    if (deleteFor === '2') {
        socket.emit('deleteMessage', {
            messageId: messageId,
            deleteFor: 'me'
        });
    } else if (deleteFor === '3') {
        socket.emit('deleteMessage', {
            messageId: messageId,
            deleteFor: 'everyone'
        });
    }
}

// Message context menu
function addMessageContextMenu(messageElement, messageId, isOwn, messageText, hasMedia) {
    let pressTimer = null;
    
    messageElement.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
            showMessageContextMenu(e, messageId, isOwn, messageText, hasMedia);
        }, 500);
    });
    
    messageElement.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    
    messageElement.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
    });
    
    messageElement.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            showMessageContextMenu(e, messageId, isOwn, messageText, hasMedia);
        }, 500);
    });
    
    messageElement.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
}

function showMessageContextMenu(event, messageId, isOwn, messageText, hasMedia) {
    event.preventDefault();
    
    const existingMenu = document.querySelector('.message-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'message-context-menu show';
    
    let menuItems = '';
    
    if (isOwn) {
        if (!hasMedia) {
            menuItems += '<div class="context-menu-item" onclick="editMessage(\'' + messageId + '\', \'' + messageText + '\')"><i class="fas fa-edit"></i> Edit</div>';
        }
        menuItems += '<div class="context-menu-item" onclick="deleteMessage(\'' + messageId + '\')"><i class="fas fa-trash"></i> Delete</div>';
    } else {
        menuItems += '<div class="context-menu-item" onclick="replyToMessage(\'' + messageId + '\')"><i class="fas fa-reply"></i> Reply</div>';
        menuItems += '<div class="context-menu-item" onclick="forwardMessage(\'' + messageId + '\')"><i class="fas fa-share"></i> Forward</div>';
    }
    
    menuItems += '<div class="context-menu-item" onclick="copyMessage(\'' + messageText + '\')"><i class="fas fa-copy"></i> Copy</div>';
    menuItems += '<div class="context-menu-item" onclick="starMessage(\'' + messageId + '\')"><i class="fas fa-star"></i> Star</div>';
    
    contextMenu.innerHTML = menuItems;
    
    const rect = event.target.getBoundingClientRect();
    contextMenu.style.position = 'fixed';
    contextMenu.style.top = rect.top + 'px';
    contextMenu.style.left = rect.left + 'px';
    contextMenu.style.zIndex = '1000';
    
    document.body.appendChild(contextMenu);
    
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
    }, 100);
}

function closeContextMenu() {
    const contextMenu = document.querySelector('.message-context-menu');
    if (contextMenu) {
        contextMenu.remove();
    }
    document.removeEventListener('click', closeContextMenu);
}

function replyToMessage(messageId) {
    alert('Reply functionality coming soon!');
    closeContextMenu();
}

function forwardMessage(messageId) {
    alert('Forward functionality coming soon!');
    closeContextMenu();
}

function copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Message copied to clipboard!');
    });
    closeContextMenu();
}

function starMessage(messageId) {
    alert('Message starred!');
    closeContextMenu();
}

// Socket event handlers
socket.on('userList', (users) => {
    updateUserList(users);
    updateMobileUserList();
});

socket.on('userConnected', (username) => {
    onlineUsers.add(username);
    updateUserList(Array.from(onlineUsers));
    updateMobileUserList();
});

socket.on('userDisconnected', (username) => {
    onlineUsers.delete(username);
    updateUserList(Array.from(onlineUsers));
    updateMobileUserList();
});

socket.on('privateMessage', ({ from, message, timestamp, media }) => {
    if (selectedUser === from) {
        appendMessage(from, message, false, timestamp, media);
    }
    
    // Show notification
    if (from !== currentUser) {
        const notificationText = media ? 
            `${from} sent a ${media.type}` : 
            `${from}: ${message}`;
        showNotification('New Message', notificationText);
    }
});

socket.on('messageSent', ({ to, message, timestamp, media }) => {
    if (selectedUser === to) {
        appendMessage(currentUser, message, true, timestamp, media);
    }
});

socket.on('messageError', ({ error }) => {
    alert('Message error: ' + error);
});

socket.on('messageEdited', ({ messageId, newText, editedAt }) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const messageText = messageElement.querySelector('.message-text');
        if (messageText) {
            messageText.textContent = newText;
            messageText.innerHTML += ' <span class="edited-indicator">(edited)</span>';
        }
    }
});

socket.on('messageDeleted', ({ messageId, deleteFor }) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        if (deleteFor === 'everyone') {
            messageElement.remove();
        } else if (deleteFor === 'me') {
            messageElement.style.opacity = '0.5';
            messageElement.innerHTML = '<div class="deleted-message">This message was deleted</div>';
        }
    }
});

socket.on('editError', ({ error }) => {
    alert(error);
});

socket.on('deleteError', ({ error }) => {
    alert(error);
});

// Push notifications
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

function showNotification(title, body, icon = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'chat-message',
            requireInteraction: false,
            silent: false
        });
        
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

requestNotificationPermission();

// Encryption/Decryption (placeholder functions)
function encrypt(text) {
    return text; // Placeholder - implement actual encryption
}

function decrypt(text) {
    return text; // Placeholder - implement actual decryption
}
