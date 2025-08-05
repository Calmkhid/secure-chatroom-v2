document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const authMessage = document.getElementById('authMessage');

    // Toggle between login and signup forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        authMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        authMessage.textContent = '';
    });

    // Handle login
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Attempting login for:', username);

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Login response:', response.status, data);

            if (response.ok) {
                localStorage.setItem('username', username);
                localStorage.setItem('userId', data.user._id);
                console.log('Login successful, redirecting to /chat');
                // Add a small delay to ensure session is saved
                setTimeout(() => {
                    window.location.href = '/chat';
                }, 100);
            } else {
                authMessage.textContent = data.error || 'Login failed';
                authMessage.className = 'auth-message error';
                console.log('Login failed:', data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            authMessage.textContent = 'Network error. Please try again.';
            authMessage.className = 'auth-message error';
        }
    });

    // Handle signup
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            authMessage.textContent = 'Passwords do not match';
            authMessage.className = 'auth-message error';
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('username', username);
                localStorage.setItem('userId', data.user._id);
                // Add a small delay to ensure session is saved
                setTimeout(() => {
                    window.location.href = '/chat';
                }, 100);
            } else {
                authMessage.textContent = data.error || 'Signup failed';
                authMessage.className = 'auth-message error';
            }
        } catch (error) {
            authMessage.textContent = 'Network error. Please try again.';
            authMessage.className = 'auth-message error';
        }
    });
}); 