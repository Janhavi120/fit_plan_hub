const authToken = () => localStorage.getItem('token');

const activeUser = () => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
};

const loggedIn = () => Boolean(authToken());

function guard(role = null) {
    const user = activeUser();

    if (!loggedIn()) {
        location.replace('login.html');
        return false;
    }

    if (role && user?.role !== role) {
        location.replace(
            user.role === 'trainer'
                ? 'trainer-dashboard.html'
                : 'user-feed.html'
        );
        return false;
    }

    return true;
}

async function sendRequest(endpoint, config = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(config.headers || {})
    };

    if (authToken()) {
        headers.Authorization = `Bearer ${authToken()}`;
    }

    try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
            ...config,
            headers
        });

        if (res.status === 401) {
            localStorage.clear();
            location.replace('login.html');
            return null;
        }

        return await res.json();
    } catch (err) {
        throw err;
    }
}

function notify(text, variant = 'success') {
    const box = document.createElement('div');
    box.className = `message ${variant}`;
    box.textContent = text;

    Object.assign(box.style, {
        position: 'fixed',
        top: '18px',
        right: '18px',
        zIndex: 1000,
        padding: '14px 22px',
        borderRadius: '8px',
        boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
        animation: 'fadeInRight .3s ease'
    });

    document.body.appendChild(box);

    setTimeout(() => {
        box.style.animation = 'fadeOutRight .3s ease';
        setTimeout(() => box.remove(), 300);
    }, 2800);
}

const animStyle = document.createElement('style');
animStyle.textContent = `
@keyframes fadeInRight {
    from { transform: translateX(80px); opacity: 0 }
    to { transform: translateX(0); opacity: 1 }
}
@keyframes fadeOutRight {
    from { transform: translateX(0); opacity: 1 }
    to { transform: translateX(80px); opacity: 0 }
}
`;
document.head.appendChild(animStyle);

function signOut() {
    localStorage.clear();
    location.replace('index.html');
}

const money = value => `₹${Number(value).toFixed(2)}`;

const readableDate = value =>
    new Date(value).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
