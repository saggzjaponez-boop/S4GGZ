const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.querySelector('.side-menu');
const content = document.querySelector('.content');
const themeToggle = document.getElementById('theme-toggle');

function setMenuCollapsed(collapsed) {
    sideMenu.classList.toggle('collapsed', collapsed);
    content.classList.toggle('menu-collapsed', collapsed);
    menuToggle.classList.toggle('open', !collapsed);
    menuToggle.setAttribute('aria-expanded', String(!collapsed));
}

// initialize (menu shown by default)
setMenuCollapsed(false);

menuToggle.addEventListener('click', () => {
    const isCollapsed = sideMenu.classList.toggle('collapsed');
    content.classList.toggle('menu-collapsed', isCollapsed);
    menuToggle.classList.toggle('open', !isCollapsed);
    menuToggle.setAttribute('aria-expanded', String(!isCollapsed));
});

// Theme toggle: light / dark
function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');
}

// Restore theme from localStorage
const savedTheme = localStorage.getItem('site-theme') || 'light';
applyTheme(savedTheme);
if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('site-theme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
}

/* --- Chat functionality (client-side persistence) --- */
(function(){
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return; // not on chat page

    const API_BASE = '/api/messages';
    const MESSAGES_KEY = 's4ggz_chat_messages_v1';
    const COOKIE_NAME = 's4ggz_username';

    function setCookie(name, value, days){
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        document.cookie = name + '=' + encodeURIComponent(value) + ';path=/;expires=' + d.toUTCString();
    }
    function getCookie(name){
        const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return v ? decodeURIComponent(v.pop()) : null;
    }

    // Modal handling
    const usernameModal = document.getElementById('username-modal');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username-input');
    const changeBtn = document.getElementById('change-username');

    function showUsernameModal(show){
        if (!usernameModal) return;
        usernameModal.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (show) {
            usernameInput.focus();
        }
    }

    // Messages rendering
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    async function loadMessages(){
        try{
            const res = await fetch(API_BASE);
            if (!res.ok) throw new Error('Network');
            return await res.json();
        }catch(e){
            // fallback to localStorage
            try{ return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]'); }catch(e){return []}
        }
    }

    function saveMessagesLocal(list){ localStorage.setItem(MESSAGES_KEY, JSON.stringify(list)); }

    function renderMessages(list){
        messagesEl.innerHTML = '';
        list.forEach(msg => {
            const el = document.createElement('div');
            el.className = 'message ' + (msg.user === currentUser ? 'self' : 'other');
            const meta = document.createElement('div'); meta.className='meta';
            const date = new Date(msg.time);
            meta.textContent = msg.user + ' • ' + date.toLocaleString();
            const txt = document.createElement('div'); txt.className='text'; txt.textContent = msg.text;
            el.appendChild(meta); el.appendChild(txt);
            messagesEl.appendChild(el);
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // username
    let currentUser = getCookie(COOKIE_NAME) || '';
    if (!currentUser) showUsernameModal(true);
    else showUsernameModal(false);

    if (usernameForm) usernameForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const v = usernameInput.value.trim();
        if (!v) return;
        currentUser = v;
        setCookie(COOKIE_NAME, currentUser, 365);
        showUsernameModal(false);
    });

    if (changeBtn) changeBtn.addEventListener('click', ()=>{
        usernameInput.value = currentUser || '';
        showUsernameModal(true);
    });

    // initial render
    (async ()=>{
        const list = await loadMessages();
        saveMessagesLocal(list);
        renderMessages(list);
    })();

    // prefill username input if available
    if (usernameInput && currentUser) usernameInput.value = currentUser;

    if (form) form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const text = input.value;
        if (!text || !text.trim()) return;
        if (!currentUser){ showUsernameModal(true); return; }
        if (text.length > 5000){ alert('Message too long (max 5000 chars)'); return; }
        try{
            const res = await fetch(API_BASE, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user: currentUser, text }) });
            if (!res.ok) throw new Error('Send failed');
            const saved = await res.json();
            // append and render
            const currentList = await loadMessages();
            currentList.push(saved);
            saveMessagesLocal(currentList);
            renderMessages(currentList);
            input.value = '';
            updateCounter();
        }catch(err){
            alert('Failed to send message to server. You can try again.');
        }
    });

    // character counter
    const counterEl = document.getElementById('char-counter');
    function updateCounter(){
        if (!counterEl) return;
        const len = input.value.length;
        counterEl.textContent = len + '/5000';
    }
    input.addEventListener('input', updateCounter);
    updateCounter();

    // Expose simple clear (for dev) via window for now
    window.S4GGZ = window.S4GGZ || {};
    window.S4GGZ.clearChat = ()=>{ localStorage.removeItem(MESSAGES_KEY); renderMessages(); };

    // Note: messages are stored in localStorage and thus persist per-browser. To make chat global across visitors
    // you would need a backend or a realtime DB (Firebase, supabase, etc.). I can add an optional Firebase sync if you want.

})();