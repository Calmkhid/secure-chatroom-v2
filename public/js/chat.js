const socket = io();
const form = document.getElementById('messageForm');
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

// Media elements
const imageBtn = document.getElementById('imageBtn');
const voiceBtn = document.getElementById('voiceBtn');
const imageInput = document.getElementById('imageInput');
const voiceInput = document.getElementById('voiceInput');

// File input elements
const fileInput = document.getElementById('fileInput');
const documentInput = document.getElementById('documentInput');

// Chat action buttons
const searchMessagesBtn = document.getElementById('searchMessagesBtn');
const scheduleMessageBtn = document.getElementById('scheduleMessageBtn');

// Group chat elements
const createGroupBtn = document.getElementById('createGroupBtn');
const groupList = document.getElementById('groupList');

// Media preview variables
let previewedMedia = null;
let previewedMediaType = null;

// Mobile toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// Mobile search elements
const mobileUserSearch = document.getElementById('mobileUserSearch');
const mobileSearchBtn = document.getElementById('mobileSearchBtn');

// Mobile user list
const mobileUserList = document.getElementById('mobileUserList');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');

// Profile button
const profileBtn = document.getElementById('profileBtn');

let currentUser = localStorage.getItem('username');
let currentUserId = localStorage.getItem('userId');
let selectedUser = null;
let onlineUsers = new Set();
let recentChatsList = new Set();
let mediaRecorder = null;
let audioChunks = [];

// Check if user is logged in
if (!currentUser || !currentUserId) {
    window.location.href = '/';
}

// Display current user
currentUserSpan.textContent = `Logged in as: ${currentUser}`;

// Register user with socket
socket.emit('registerUser', { userId: currentUserId, username: currentUser });

// Profile functionality
if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        showProfileModal();
    });
}

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
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function editStatus() {
    const newStatus = prompt('Enter your new status:', 'Hey there! I\'m using Secure Chatroom');
    if (newStatus && newStatus.trim()) {
        // Here you would typically save to database
        console.log('Status updated:', newStatus);
        alert('Status updated! (This would be saved to database in production)');
    }
}

function changeAvatar() {
    alert('Avatar change feature would be implemented here!');
}

// Dark mode functionality
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

// Initialize theme
initTheme();

// Theme toggle event listener
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Push Notifications
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
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Focus window when notification is clicked
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Request notification permission on page load
requestNotificationPermission();

// Mobile sidebar toggle
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// Update mobile user list
function updateMobileUserList() {
    if (mobileUserList) {
        mobileUserList.innerHTML = '';
        onlineUsers.forEach(user => {
            if (user !== currentUser) {
                const userDiv = document.createElement('div');
                userDiv.className = 'mobile-user-item';
                userDiv.innerHTML = `
                    <span class="user-name">${user}</span>
                    <span class="status">🟢 Online</span>
                `;
                userDiv.addEventListener('click', () => {
                    selectUser(user);
                    // Highlight selected user
                    document.querySelectorAll('.mobile-user-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    userDiv.classList.add('selected');
                });
                mobileUserList.appendChild(userDiv);
            }
        });
    }
}

// Mobile search functionality
if (mobileSearchBtn && mobileUserSearch) {
    mobileSearchBtn.addEventListener('click', async () => {
        const searchTerm = mobileUserSearch.value.trim();
        if (!searchTerm) return;
        
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
            const users = await response.json();
            
            if (users.length > 0) {
                const user = users[0];
                selectUser(user.username);
                mobileUserSearch.value = '';
                // Close sidebar if open
                sidebar.classList.remove('show');
            } else {
                alert('User not found');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    });
    
    // Also allow Enter key to search
    mobileUserSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            mobileSearchBtn.click();
        }
    });
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    // Send typing indicator
    if (selectedUser) {
        socket.emit('typing', { to: selectedUser, isTyping: true });
    }
});

// Stop typing indicator when user stops typing
let typingTimeout;
messageInput.addEventListener('input', () => {
    clearTimeout(typingTimeout);
    if (selectedUser) {
        socket.emit('typing', { to: selectedUser, isTyping: true });
    }
    
    typingTimeout = setTimeout(() => {
        if (selectedUser) {
            socket.emit('typing', { to: selectedUser, isTyping: false });
        }
    }, 1000);
});

// Handle typing indicators
socket.on('userTyping', ({ from, isTyping }) => {
    if (selectedUser === from) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (isTyping) {
            if (!typingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'typingIndicator';
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>${from} is typing...</span>
                `;
                chatMessages.appendChild(indicator);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }
});

// Handle message reactions
socket.on('messageReaction', ({ messageId, reactions }) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        updateMessageReactions(messageElement, reactions);
    }
});

function updateMessageReactions(messageElement, reactions) {
    let reactionsContainer = messageElement.querySelector('.message-reactions');
    if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        messageElement.appendChild(reactionsContainer);
    }
    
    // Group reactions by type
    const reactionCounts = {};
    reactions.forEach(reaction => {
        reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
    });
    
    reactionsContainer.innerHTML = '';
    Object.entries(reactionCounts).forEach(([reaction, count]) => {
        const reactionSpan = document.createElement('span');
        reactionSpan.className = 'reaction';
        reactionSpan.innerHTML = `${getReactionEmoji(reaction)} ${count}`;
        reactionsContainer.appendChild(reactionSpan);
    });
}

function getReactionEmoji(reaction) {
    const emojis = {
        'like': '👍',
        'heart': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😠'
    };
    return emojis[reaction] || '👍';
}

// Logout functionality
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

// Image sending functionality
imageBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && selectedUser) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size must be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            socket.emit('privateMessage', { 
                to: selectedUser, 
                message: '', 
                media: { type: 'image', data: imageData, filename: file.name }
            });
        };
        reader.readAsDataURL(file);
    } else if (!selectedUser) {
        alert('Please select a user to send image to');
    }
    imageInput.value = ''; // Reset input
});

// Voice recording functionality
voiceBtn.addEventListener('click', async () => {
    if (!selectedUser) {
        alert('Please select a user to send voice note to');
        return;
    }
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        // Stop recording
        mediaRecorder.stop();
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
        voiceBtn.style.background = 'var(--bg-tertiary)';
        voiceBtn.style.color = 'var(--text-secondary)';
    } else {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onload = (e) => {
                    const audioData = e.target.result;
                    socket.emit('privateMessage', { 
                        to: selectedUser, 
                        message: '', 
                        media: { type: 'audio', data: audioData, filename: 'voice_note.wav' }
                    });
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            voiceBtn.style.background = 'var(--error-color)';
            voiceBtn.style.color = 'white';
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please check permissions.');
        }
    }
});

// File sharing functionality
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && selectedUser) {
            const reader = new FileReader();
            reader.onload = (e) => {
                socket.emit('privateMessage', {
                    to: selectedUser,
                    message: '',
                    media: {
                        type: 'file',
                        data: e.target.result,
                        filename: file.name,
                        size: file.size
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

if (documentInput) {
    documentInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && selectedUser) {
            const reader = new FileReader();
            reader.onload = (e) => {
                socket.emit('privateMessage', {
                    to: selectedUser,
                    message: '',
                    media: {
                        type: 'document',
                        data: e.target.result,
                        filename: file.name,
                        size: file.size
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

// Message search functionality
if (searchMessagesBtn) {
    searchMessagesBtn.addEventListener('click', () => {
        if (selectedUser) {
            showMessageSearchModal();
        } else {
            alert('Please select a user to search messages');
        }
    });
}

function showMessageSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-content">
            <div class="search-header">
                <h3><i class="fas fa-search"></i> Search Messages</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="search-body">
                <input type="text" class="search-input" placeholder="Search for messages..." id="messageSearchInput">
                <div class="search-results" id="searchResults">
                    <!-- Search results will appear here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const searchInput = modal.querySelector('#messageSearchInput');
    const searchResults = modal.querySelector('#searchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length > 2) {
            searchMessages(query, searchResults);
        } else {
            searchResults.innerHTML = '';
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function searchMessages(query, resultsContainer) {
    // This would typically search through loaded messages
    // For now, we'll show a placeholder
    resultsContainer.innerHTML = `
        <div class="search-result-item">
            <div class="search-result-text">Searching for "${query}"...</div>
            <div class="search-result-time">This feature searches through your conversation history</div>
        </div>
    `;
}

// Message scheduling functionality
if (scheduleMessageBtn) {
    scheduleMessageBtn.addEventListener('click', () => {
        if (selectedUser) {
            showScheduleMessageModal();
        } else {
            alert('Please select a user to schedule a message');
        }
    });
}

function showScheduleMessageModal() {
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
        <div class="schedule-modal-content">
            <div class="schedule-header">
                <h3><i class="fas fa-clock"></i> Schedule Message</h3>
                <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="schedule-body">
                <form class="schedule-form" id="scheduleForm">
                    <input type="text" placeholder="Message to send..." id="scheduledMessage" required>
                    <input type="datetime-local" id="scheduleTime" required>
                    <div class="schedule-actions">
                        <button type="button" class="cancel-btn" onclick="this.closest('.schedule-modal').remove()">Cancel</button>
                        <button type="submit" class="schedule-btn">Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const form = modal.querySelector('#scheduleForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = modal.querySelector('#scheduledMessage').value;
        const time = modal.querySelector('#scheduleTime').value;
        
        if (message && time) {
            scheduleMessage(message, time);
            modal.remove();
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function scheduleMessage(message, scheduledTime) {
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const delay = scheduledDate.getTime() - now.getTime();
    
    if (delay > 0) {
        setTimeout(() => {
            if (selectedUser) {
                socket.emit('privateMessage', {
                    to: selectedUser,
                    message: message
                });
                showNotification('Scheduled Message Sent', `Message sent to ${selectedUser}`);
            }
        }, delay);
        
        alert(`Message scheduled for ${scheduledDate.toLocaleString()}`);
    } else {
        alert('Please select a future time');
    }
}

// Group chat functionality
if (createGroupBtn) {
    createGroupBtn.addEventListener('click', () => {
        showCreateGroupModal();
    });
}

function showCreateGroupModal() {
    const groupName = prompt('Enter group name:');
    if (groupName && groupName.trim()) {
        const members = prompt('Enter member usernames (comma-separated):');
        if (members) {
            const memberList = members.split(',').map(m => m.trim()).filter(m => m);
            createGroup(groupName.trim(), memberList);
        }
    }
}

function createGroup(name, members) {
    // This would typically save to database
    console.log('Creating group:', name, 'with members:', members);
    
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.innerHTML = `
        <div class="group-icon">
            <i class="fas fa-users"></i>
        </div>
        <div class="group-info">
            <div class="group-name">${name}</div>
            <div class="group-members">${members.length} members</div>
        </div>
    `;
    
    groupItem.addEventListener('click', () => {
        selectGroup(name, members);
    });
    
    groupList.appendChild(groupItem);
    alert(`Group "${name}" created successfully!`);
}

function selectGroup(name, members) {
    // Clear previous selections
    document.querySelectorAll('.group-item').forEach(item => item.classList.remove('selected'));
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('selected'));
    
    // Select this group
    event.target.closest('.group-item').classList.add('selected');
    
    selectedUser = null;
    chatWith.textContent = `Group: ${name}`;
    userStatus.textContent = `${members.length} members`;
    
    // Load group chat history
    loadGroupChatHistory(name);
}

function loadGroupChatHistory(groupName) {
    chatMessages.innerHTML = `
        <div class="no-history">
            <i class="fas fa-comments"></i>
            <p>Group chat history would be loaded here</p>
            <small>Group: ${groupName}</small>
        </div>
    `;
}

// Search for users
searchBtn.addEventListener('click', async () => {
    const searchTerm = userSearch.value.trim();
    if (!searchTerm) return;
    
    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        const users = await response.json();
        
        if (users.length > 0) {
            const user = users[0];
            selectUser(user.username);
            userSearch.value = '';
        } else {
            alert('User not found');
        }
    } catch (error) {
        console.error('Search error:', error);
    }
});

// Handle user selection
function selectUser(username) {
    selectedUser = username;
    chatWith.textContent = `Chatting with: ${username}`;
    userStatus.textContent = onlineUsers.has(username) ? '🟢 Online' : '🔴 Offline';
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }
    
    // Clear current messages and show loading
    chatMessages.innerHTML = '<div class="loading">Loading chat history...</div>';
    
    // Load chat history
    loadChatHistory(username);
    
    // Add to recent chats
    recentChatsList.add(username);
    updateRecentChats();
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
            
            // Only show messages that aren't deleted for the current user
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
        
        // Add to recent chats
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

// Handle message sending
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message && selectedUser) {
        socket.emit('privateMessage', { to: selectedUser, message });
        // Don't append message immediately - wait for confirmation
        messageInput.value = '';
        
        // Add to recent chats
        recentChatsList.add(selectedUser);
        updateRecentChats();
    } else if (!selectedUser) {
        alert('Please select a user to chat with');
    }
});

// Handle message confirmation from server
socket.on('messageSent', ({ to, message, timestamp, media }) => {
    appendMessage(currentUser, message, true, timestamp, media);
});

// Handle incoming messages
socket.on('privateMessage', ({ from, message, timestamp, media }) => {
    appendMessage(from, message, false, timestamp, media);
    
    // Add to recent chats
    recentChatsList.add(from);
    updateRecentChats();
    
    // If not currently chatting with this user, show notification
    if (selectedUser !== from) {
        const notificationText = media ? 
            `${from} sent a ${media.type}` : 
            `${from}: ${message}`;
        showNotification('New Message', notificationText);
    }
});

// Handle message errors
socket.on('messageError', ({ error }) => {
    alert('Failed to send message: ' + error);
});

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
    
    // Add message actions for own messages
    if (isOwn && messageId) {
        addMessageActions(msg, messageId, true, message);
    }
    
    // Add context menu for all messages
    if (messageId) {
        addMessageContextMenu(msg, messageId, isOwn, message || '', hasMedia);
    }
}

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

// Open image in modal
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Update online users list
socket.on('userList', users => {
    onlineUsers = new Set(users);
    userList.innerHTML = '';
    
    users.forEach(user => {
        if (user !== currentUser) {
            const li = document.createElement('li');
            li.className = 'user-item';
            li.innerHTML = `
                <span class="user-name">${user}</span>
                <span class="status">🟢 Online</span>
            `;
            li.addEventListener('click', () => {
                selectUser(user);
                // Highlight the selected user
                document.querySelectorAll('.recent-chat-item, .user-item').forEach(item => {
                    item.style.background = 'var(--bg-secondary)';
                    item.style.color = 'var(--text-primary)';
                });
                li.style.background = 'var(--primary-color)';
                li.style.color = 'white';
            });
            userList.appendChild(li);
        }
    });
    
    // Update status if currently chatting with someone
    if (selectedUser) {
        userStatus.textContent = onlineUsers.has(selectedUser) ? '🟢 Online' : '🔴 Offline';
    }
    
    // Update mobile user list
    updateMobileUserList();
});

// Update recent chats
function updateRecentChats() {
    const recentChats = document.getElementById('recentChats');
    if (!recentChats) return;
    
    recentChats.innerHTML = '';
    
    // Get unique users from recent chats
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

// Show notification
function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('New Message', { body: message });
            }
        });
    }
}

// Request notification permission on page load
if ('Notification' in window) {
    Notification.requestPermission();
}

// Handle user disconnect
socket.on('userDisconnected', username => {
    onlineUsers.delete(username);
    if (selectedUser === username) {
        userStatus.textContent = '🔴 Offline';
    }
    updateMobileUserList(); // Update mobile user list
});

// Handle user connect
socket.on('userConnected', username => {
    onlineUsers.add(username);
    if (selectedUser === username) {
        userStatus.textContent = '🟢 Online';
    }
    updateMobileUserList(); // Update mobile user list
});

// Message editing and deletion
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

// Message context menu functionality
function addMessageContextMenu(messageElement, messageId, isOwn, messageText, hasMedia) {
    let pressTimer = null;
    let isLongPress = false;
    
    messageElement.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
            isLongPress = true;
            showMessageContextMenu(e, messageId, isOwn, messageText, hasMedia);
        }, 500);
    });
    
    messageElement.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
    });
    
    messageElement.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
    });
    
    // Touch events for mobile
    messageElement.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
            isLongPress = true;
            showMessageContextMenu(e, messageId, isOwn, messageText, hasMedia);
        }, 500);
    });
    
    messageElement.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });
}

function showMessageContextMenu(event, messageId, isOwn, messageText, hasMedia) {
    event.preventDefault();
    
    // Remove existing context menu
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
    
    // Position the menu
    const rect = event.target.getBoundingClientRect();
    contextMenu.style.position = 'fixed';
    contextMenu.style.top = rect.top + 'px';
    contextMenu.style.left = rect.left + 'px';
    contextMenu.style.zIndex = '1000';
    
    document.body.appendChild(contextMenu);
    
    // Close menu when clicking outside
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
    // Implementation for reply functionality
    alert('Reply functionality coming soon!');
    closeContextMenu();
}

function forwardMessage(messageId) {
    // Implementation for forward functionality
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
    // Implementation for star functionality
    alert('Message starred!');
    closeContextMenu();
}

// Attachment menu elements
const attachmentBtn = document.getElementById('attachmentBtn');
const attachmentMenu = document.getElementById('attachmentMenu');
const voiceRecordingUI = document.getElementById('voiceRecordingUI');
const recordingTime = document.getElementById('recordingTime');
const recordingInstruction = document.getElementById('recordingInstruction');
const pauseRecordingBtn = document.getElementById('pauseRecordingBtn');
const deleteRecordingBtn = document.getElementById('deleteRecordingBtn');
const sendRecordingBtn = document.getElementById('sendRecordingBtn');

// File input elements
const cameraInput = document.getElementById('cameraInput');
const photosInput = document.getElementById('photosInput');

// Voice recording variables
let recordingStartTime = null;
let recordingTimer = null;
let isRecording = false;
let isPaused = false;
let recordingLocked = false;

// Attachment menu functionality
if (attachmentBtn) {
    attachmentBtn.addEventListener('click', () => {
        attachmentMenu.classList.toggle('show');
    });
}

// Close attachment menu when clicking outside
document.addEventListener('click', (e) => {
    if (!attachmentMenu.contains(e.target) && !attachmentBtn.contains(e.target)) {
        attachmentMenu.classList.remove('show');
    }
});

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

// Voice recording functionality
if (voiceBtn) {
    voiceBtn.addEventListener('mousedown', startRecording);
    voiceBtn.addEventListener('mouseup', stopRecording);
    voiceBtn.addEventListener('mouseleave', stopRecording);
    
    // Touch events for mobile
    voiceBtn.addEventListener('touchstart', startRecording);
    voiceBtn.addEventListener('touchend', stopRecording);
}

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
            
            // Start recording timer
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

// File input handlers
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

// Message sending functionality
const sendBtn = document.querySelector('.send-btn');

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

// User search functionality
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

// Mobile search functionality
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

function searchUser(username) {
    if (username === currentUser) {
        alert('You cannot chat with yourself!');
        return;
    }
    
    // Add to recent chats
    recentChatsList.add(username);
    updateRecentChats();
    
    // Select the user
    selectUser(username);
    
    // Clear search input
    if (userSearch) userSearch.value = '';
    if (mobileUserSearch) mobileUserSearch.value = '';
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
                // Close sidebar on mobile
                if (sidebar) {
                    sidebar.classList.remove('show');
                }
            });
            mobileUserList.appendChild(div);
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
