// ══════════════════════════════════════════════════════
//  login.js — Admin authentication handler
//  Depends on: supabase-client.js
// ══════════════════════════════════════════════════════

(function () {
    'use strict';

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorBox = document.getElementById('login-error');

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.add('visible');
    }

    function clearError() {
        errorBox.textContent = '';
        errorBox.classList.remove('visible');
    }

    function setLoading(loading) {
        loginBtn.disabled = loading;
        loginBtn.textContent = loading ? 'Signing in…' : 'Sign In';
    }

    // If already logged in, skip to admin
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) window.location.href = 'admin.html';
    });

    // Handle Enter key
    [emailInput, passwordInput].forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter') loginBtn.click();
        });
    });

    loginBtn.addEventListener('click', async function () {
        clearError();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter your email and password.');
            return;
        }

        setLoading(true);

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

        setLoading(false);

        if (error) {
            showError(error.message || 'Login failed. Check your credentials.');
            return;
        }

        window.location.href = 'admin.html';
    });
})();
