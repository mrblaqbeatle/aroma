// Hamburger menu toggle (robust version)
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('nav-overlay');

    // Only require core elements
    if (!hamburger || !navLinks) return;

    function openMenu() {
        navLinks.classList.add('open');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (overlay) {
            overlay.classList.add('active');
        }
    }

    function closeMenu() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';

        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Toggle menu
    hamburger.addEventListener('click', function () {
        if (navLinks.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close on overlay click (if exists)
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Close menu when a nav link is clicked
    const links = navLinks.querySelectorAll('a');
    links.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
});