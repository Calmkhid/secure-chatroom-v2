
// Connect to Socket.io
const socket = io();
let currentUser = null;
let currentChat = 'group';

// UI Elements
const loginContainer = document.getElementById("login-container");
const signupContainer = document.getElementById("signup-container");
const chatContainer = document.getElementById("chat-container");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignup = document.getElementById("show-signup");
const showLogin = document.getElementById("show-login");
const sendButton = document.getElementById("send");
const messageInput = document.getElementById("message");
const chatWindow = document.getElementById("chat-window");
const privateInput = document.getElementById("private-username");
const toggleGroup = document.getElementById("toggle-group");

showSignup.onclick = () => {
    loginContainer.classList.add("hidden");
    signupContainer.classList.remove("hidden");
};
showLogin.onclick = () => {
    signupContainer.classList.add("hidden");
    loginContainer.classList.remove("hidden");
};

loginForm.onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    socket.emit("login", { username, password });
};

signupForm.onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;
    socket.emit("signup", { username, password });
};

socket.on("loginSuccess", username => {
    currentUser = username;
    loginContainer.classList.add("hidden");
    signupContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");
});

sendButton.onclick = () => {
    const msg = messageInput.value.trim();
    if (!msg) return;
    socket.emit("chatMessage", {
        to: currentChat,
        message: msg,
    });
    appendMessage(currentUser, msg, true);
    messageInput.value = "";
};

socket.on("chatMessage", data => {
    appendMessage(data.from, data.message, false);
});

toggleGroup.onclick = () => {
    currentChat = "group";
};

privateInput.onchange = () => {
    if (privateInput.value) currentChat = privateInput.value;
};

function appendMessage(sender, message, isSelf) {
    const div = document.createElement("div");
    div.className = "message" + (isSelf ? " private" : "");
    div.innerHTML = `<span class="from">${sender}:</span> <span class="text">${message}</span>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
