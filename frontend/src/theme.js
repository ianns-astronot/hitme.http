// Theme Management System

// Get system preference
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get saved theme or default to system
export function getCurrentTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        return saved;
    }
    return getSystemTheme();
}

// Apply theme to document
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Toggle theme
export function toggleTheme() {
    const current = getCurrentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    return next;
}

// Initialize theme on load
export function initTheme() {
    const theme = getCurrentTheme();
    applyTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const saved = localStorage.getItem('theme');
        if (!saved) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Open devtools console
export function openDevTools() {
    // In Wails, we can use runtime to open devtools
    if (window.runtime && window.runtime.BrowserOpenURL) {
        console.log('DevTools: Check browser console (F12)');
    }
    // For web, just log
    console.log('=== DevTools Console ===');
    console.log('Theme:', getCurrentTheme());
    console.log('Available commands:');
    console.log('- window.testFunctions() - Test all functions');
    console.log('- window.toggleTheme() - Toggle theme');
}
