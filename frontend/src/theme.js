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
    // Try to call backend function if available
    if (window.go && window.go.main && window.go.main.App && window.go.main.App.OpenDevTools) {
        window.go.main.App.OpenDevTools();
    }
    
    // Also log to console
    console.log('=== DevTools Console ===');
    console.log('Press F12 or Right-click > Inspect to open DevTools');
    console.log('Theme:', getCurrentTheme());
    console.log('Available commands:');
    console.log('- window.testFunctions() - Test all functions');
    console.log('- window.toggleTheme() - Toggle theme');
    
    // Try to focus console
    if (typeof console.clear === 'function') {
        // Don't clear, just make it visible
    }
}
