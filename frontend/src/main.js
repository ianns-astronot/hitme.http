import './style.css';
import './app.css';
import './modal.css';
import './theme-variables.css';
import { handleUrlInput, handleUrlKeydown, handleHeaderKeyInput, handleHeaderKeyKeydown } from './autocomplete.js';
import { handleBodyInput, handleBodyKeydown } from './autopair.js';
import { showErrorModal, showSuccessModal, showConfirmModal, showInputModal } from './modal.js';
import { initTheme, toggleTheme, getCurrentTheme, openDevTools } from './theme.js';
import { Icons, ICON_SIZES } from './icons.js';

import {
    GetCollections,
    CreateCollection,
    GetCollection,
    UpdateCollection,
    DeleteCollection,
    AddRequest,
    UpdateRequest,
    DeleteRequest,
    ExecuteRequest,
    OpenDevTools
} from '../wailsjs/go/main/App';

// Helper to create icon HTML (since we use innerHTML)
function createIconHTML(iconName, size = 'md', className = '') {
    const iconSize = typeof size === 'string' ? ICON_SIZES[size] : size;
    const icons = {
        add: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        delete: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        send: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        settings: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-2-2l-4.2-4.2"></path></svg>`,
        moon: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        code: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
        folder: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        document: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        lock: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
        global: `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
    };
    
    return `<span class="icon ${className}">${icons[iconName] || ''}</span>`;
}

// Alias for backward compatibility
const renderIcon = createIconHTML;

// State
let currentCollection = null;
let currentRequest = null;
let allCollections = []; // Store all collections
let activeRequestTab = 'headers'; // headers, body, queryParams
let activeResponseTab = 'body'; // body, headers
let activeCollectionTab = null; // variables, auth, proxy - null means no settings selected

// Initialize app
async function initApp() {
    try {
        // Initialize theme first
        initTheme();
        
        allCollections = await GetCollections();
        
        // If no collections exist, create a default one
        if (!allCollections || allCollections.length === 0) {
            console.log('No collections found, creating default collection...');
            const defaultCollection = await CreateCollection('My Workspace');
            allCollections = [defaultCollection];
        }
        
        // Load the first collection
        if (allCollections && allCollections.length > 0) {
            currentCollection = await GetCollection(allCollections[0].id);
            renderApp();
        }
    } catch (err) {
        console.error('Failed to initialize app:', err);
        document.querySelector('#app').innerHTML = `
            <div style="padding: 20px; color: #ff6b6b;">
                <h2>Error initializing application</h2>
                <p>${err}</p>
            </div>
        `;
    }
}

// Render the main application UI
function renderApp() {
    console.log('🎨 === renderApp START ===');
    console.log('State:', {
        currentRequest: currentRequest?.name || 'null',
        activeCollectionTab: activeCollectionTab || 'null',
        currentCollection: currentCollection?.name || 'null'
    });
    
    // Determine what to render in main content
    let mainContent;
    if (currentRequest) {
        console.log('📄 Rendering: Request View');
        mainContent = renderRequestView();
    } else if (activeCollectionTab) {
        console.log('⚙️ Rendering: Collection Settings');
        mainContent = renderCollectionSettingsMain();
    } else {
        console.log('🏠 Rendering: Empty State');
        mainContent = renderEmptyState();
    }
    
    console.log('Main content length:', mainContent.length);
    
    document.querySelector('#app').innerHTML = `
        <div class="app-wrapper">
            <div class="app-container">
                <div class="sidebar" id="sidebar">
                    <div class="collection-selector">
                        <div class="collection-dropdown">
                            <button class="collection-select" onclick="window.toggleCollectionDropdown()">
                                <span class="collection-select-text">${currentCollection.name}</span>
                                <svg class="collection-select-icon" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <div class="collection-dropdown-menu" id="collectionDropdownMenu">
                                ${allCollections.map(col => `
                                    <div class="collection-dropdown-item ${col.id === currentCollection.id ? 'active' : ''}" 
                                         onclick="window.selectCollection('${col.id}')">
                                        <span class="collection-dropdown-item-text">${col.name}</span>
                                        ${col.id === currentCollection.id ? `
                                            <svg class="collection-dropdown-item-check" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button class="btn-icon" onclick="window.addNewCollection()" title="New Collection">
                            ${renderIcon('add', 12)}
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.deleteCurrentCollection()" title="Delete Collection">
                            ${renderIcon('delete', 12)}
                        </button>
                    </div>
                    
                    <div class="sidebar-content">
                        ${renderSidebarSettings()}
                        ${renderSidebarRequests()}
                    </div>
                </div>
                <div class="resize-handle" id="sidebarResize"></div>
                <div class="main-content">
                    ${mainContent}
                </div>
            </div>
            <div class="app-footer">
                <span class="footer-title">HitMe HTTP</span>
                <div class="footer-controls">
                    <button class="footer-btn" onclick="window.toggleThemeHandler()" title="Toggle Theme" id="themeToggle">
                        ${renderIcon(getCurrentTheme() === 'dark' ? 'sun' : 'moon', 16)}
                    </button>
                    <button class="footer-btn" onclick="window.openDevToolsHandler()" title="DevTools">
                        ${renderIcon('code', 16)}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Initialize resize handlers
    initResizeHandlers();
    
    console.log('🎨 === renderApp END ===');
}

// Setup event delegation - ONLY ONCE
let eventDelegationSetup = false;
function setupEventDelegation() {
    if (eventDelegationSetup) {
        console.log('Event delegation already initialized');
        return;
    }
    
    // Use event delegation on document level for sidebar
    document.addEventListener('click', function(e) {
        console.log('Document click detected:', e.target);
        
        // Settings item click
        const settingsItem = e.target.closest('.settings-item');
        console.log('Closest settings-item:', settingsItem);
        
        if (settingsItem) {
            const itemId = settingsItem.dataset.itemId;
            console.log('Settings item clicked! ItemId:', itemId);
            console.log('window.selectSettingsItem exists?', typeof window.selectSettingsItem);
            
            if (itemId && window.selectSettingsItem) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Calling window.selectSettingsItem...');
                window.selectSettingsItem(itemId);
            } else {
                console.error('Cannot call selectSettingsItem:', { itemId, func: typeof window.selectSettingsItem });
            }
            return;
        }
        
        // Request item click
        const requestItem = e.target.closest('.request-item');
        if (requestItem && !e.target.closest('.btn-icon-small')) {
            const requestId = requestItem.dataset.requestId;
            console.log('Request item clicked:', requestId);
            if (requestId && window.selectRequest) {
                e.preventDefault();
                e.stopPropagation();
                window.selectRequest(requestId);
            }
            return;
        }
    });
    
    eventDelegationSetup = true;
    console.log('Event delegation setup complete (document level)');
}

// Render empty state
function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>Welcome to HitMe HTTP</h3>
            <p>Select a request from the sidebar or configure collection settings</p>
        </div>
    `;
}

// Render sidebar settings
function renderSidebarSettings() {
    const settingsItems = [
        { id: 'variables', name: 'Variables' },
        { id: 'auth', name: 'Authorization' },
        { id: 'proxy', name: 'Proxy' }
    ];
    
    console.log('Rendering settings, activeCollectionTab:', activeCollectionTab);
    
    return `
        <div class="sidebar-section">
            <div class="sidebar-section-header">
                <h4>Settings</h4>
            </div>
            <div class="settings-list">
                ${settingsItems.map(item => {
                    const isActive = activeCollectionTab === item.id;
                    console.log(`Item ${item.id}: active=${isActive}`);
                    return `
                        <div class="settings-item ${isActive ? 'active' : ''}" 
                             data-item-id="${item.id}"
                             style="cursor: pointer; user-select: none;">
                            <span class="settings-name">${item.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Render sidebar requests
function renderSidebarRequests() {
    const requests = currentCollection.requests || [];
    
    return `
        <div class="sidebar-section">
            <div class="sidebar-section-header">
                <h4>Requests</h4>
                <button class="btn-icon" onclick="window.addNewRequest()" title="New Request">
                    ${renderIcon('add', 16)}
                </button>
            </div>
            <div class="request-list">
                ${requests.length === 0 ? '<div class="empty-state-small">No requests yet</div>' : ''}
                ${requests.map(req => `
                    <div class="request-item ${currentRequest && currentRequest.id === req.id ? 'active' : ''}" 
                         data-request-id="${req.id}">
                        <div class="request-item-content">
                            <span class="method-badge method-${req.method.toLowerCase()}">${req.method}</span>
                            <span class="request-name">${req.name}</span>
                        </div>
                        <button class="btn-icon-small btn-danger" onclick="window.deleteRequest('${req.id}', event)" title="Delete">
                            ${renderIcon('delete', 14)}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render collection settings in main content area
function renderCollectionSettingsMain() {
    console.log('🔧 renderCollectionSettingsMain called');
    console.log('activeCollectionTab:', activeCollectionTab);
    
    const titles = {
        'variables': 'Variables',
        'auth': 'Authorization',
        'proxy': 'Proxy Configuration'
    };
    
    const title = titles[activeCollectionTab] || 'Collection Settings';
    console.log('Title:', title);
    
    const content = renderCollectionSettingsContent();
    console.log('Content length:', content.length);
    
    const html = `
        <div class="collection-settings-main">
            <div class="settings-main-header">
                <h2>${title}</h2>
            </div>
            <div class="settings-main-content">
                ${content}
            </div>
        </div>
    `;
    
    console.log('🔧 renderCollectionSettingsMain returning HTML length:', html.length);
    return html;
}

// Render collection settings content based on active tab
function renderCollectionSettingsContent() {
    console.log('📄 renderCollectionSettingsContent called, tab:', activeCollectionTab);
    
    switch (activeCollectionTab) {
        case 'variables':
            return renderVariablesSettings();
        case 'auth':
            return renderAuthSettings();
        case 'proxy':
            return renderProxySettings();
        default:
            return '<div class="empty-message">Select a settings item from the sidebar</div>';
    }
}

// Render variables settings
function renderVariablesSettings() {
    const variables = currentCollection.variables || {};
    const variableEntries = Object.entries(variables);
    
    return `
        <div class="settings-section">
            <div class="settings-header">
                <h4>Global Variables</h4>
                <button class="btn-add" onclick="window.addVariable()">+ Add Variable</button>
            </div>
            <div class="settings-info">
                <small>Variables can be used in URLs, headers, and body using <code>{{'{{'}}variableName{{'}}'}}</code> syntax</small>
            </div>
            <div class="variables-list">
                ${variableEntries.length === 0 ? '<div class="empty-message">No variables defined</div>' : ''}
                ${variableEntries.map(([key, value]) => `
                    <div class="variable-item">
                        <input type="text" class="var-key" value="${key}" 
                               onchange="window.updateVariableKey('${key}', this.value)" 
                               placeholder="Variable name">
                        <input type="text" class="var-value" value="${value}" 
                               onchange="window.updateVariableValue('${key}', this.value)" 
                               placeholder="Variable value">
                        <button class="btn-delete" onclick="window.deleteVariable('${key}')">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render auth settings
function renderAuthSettings() {
    const auth = currentCollection.globalAuth || { type: 'none' };
    
    return `
        <div class="settings-section">
            <div class="settings-header">
                <h4>Global Authentication</h4>
            </div>
            <div class="settings-info">
                <small>Authentication will be applied to all requests unless overridden at request level</small>
            </div>
            <div class="auth-config">
                <label>Auth Type:</label>
                <select class="auth-type-select" onchange="window.updateAuthType(this.value)">
                    <option value="none" ${auth.type === 'none' ? 'selected' : ''}>None</option>
                    <option value="bearer" ${auth.type === 'bearer' ? 'selected' : ''}>Bearer Token</option>
                    <option value="basic" ${auth.type === 'basic' ? 'selected' : ''}>Basic Auth</option>
                    <option value="apikey" ${auth.type === 'apikey' ? 'selected' : ''}>API Key</option>
                </select>
                
                ${auth.type === 'bearer' ? `
                    <div class="auth-field">
                        <label>Bearer Token:</label>
                        <input type="text" class="auth-input" value="${auth.bearerToken || ''}" 
                               onchange="window.updateAuthBearerToken(this.value)" 
                               placeholder="Enter bearer token">
                    </div>
                ` : ''}
                
                ${auth.type === 'basic' ? `
                    <div class="auth-field">
                        <label>Username:</label>
                        <input type="text" class="auth-input" value="${auth.username || ''}" 
                               onchange="window.updateAuthUsername(this.value)" 
                               placeholder="Username">
                    </div>
                    <div class="auth-field">
                        <label>Password:</label>
                        <input type="password" class="auth-input" value="${auth.password || ''}" 
                               onchange="window.updateAuthPassword(this.value)" 
                               placeholder="Password">
                    </div>
                ` : ''}
                
                ${auth.type === 'apikey' ? `
                    <div class="auth-field">
                        <label>Key Name:</label>
                        <input type="text" class="auth-input" value="${auth.apiKeyName || ''}" 
                               onchange="window.updateAuthApiKeyName(this.value)" 
                               placeholder="e.g., X-API-Key">
                    </div>
                    <div class="auth-field">
                        <label>Key Value:</label>
                        <input type="text" class="auth-input" value="${auth.apiKey || ''}" 
                               onchange="window.updateAuthApiKey(this.value)" 
                               placeholder="API key value">
                    </div>
                    <div class="auth-field">
                        <label>Add To:</label>
                        <select class="auth-type-select" onchange="window.updateAuthApiKeyLocation(this.value)">
                            <option value="header" ${auth.apiKeyLocation === 'header' ? 'selected' : ''}>Header</option>
                            <option value="query" ${auth.apiKeyLocation === 'query' ? 'selected' : ''}>Query Parameter</option>
                        </select>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Render proxy settings
function renderProxySettings() {
    const proxies = currentCollection.proxies || [];
    const activeProxyId = currentCollection.activeProxyId;
    
    return `
        <div class="settings-section">
            <div class="settings-header">
                <h4>Proxy Configuration</h4>
                <button class="btn-add" onclick="window.addProxy()">+ Add Proxy</button>
            </div>
            <div class="settings-info">
                <small>Configure proxy servers for routing requests</small>
            </div>
            
            ${activeProxyId ? `
                <div class="proxy-active-info">
                    <span>✓ Proxy is active for all requests</span>
                    <button class="btn-clear-proxy" onclick="window.clearActiveProxy()">Disable Proxy</button>
                </div>
            ` : `
                <div class="proxy-inactive-info">
                    No proxy configured - using direct connection
                </div>
            `}
            
            <div class="proxy-list">
                ${proxies.length === 0 ? '<div class="empty-message">No proxies configured</div>' : ''}
                ${proxies.map((proxy, index) => `
                    <div class="proxy-item ${proxy.id === activeProxyId ? 'active-proxy' : ''}">
                        <div class="proxy-header">
                            <input type="radio" name="activeProxy" ${proxy.id === activeProxyId ? 'checked' : ''} 
                                   onchange="window.setActiveProxy('${proxy.id}')">
                            <input type="text" class="proxy-name" value="${proxy.name}" 
                                   onchange="window.updateProxyName(${index}, this.value)" 
                                   placeholder="Proxy name">
                            <button class="btn-delete" onclick="window.deleteProxy(${index})">×</button>
                        </div>
                        <div class="proxy-config">
                            <select class="proxy-scheme" onchange="window.updateProxyScheme(${index}, this.value)">
                                <option value="http" ${proxy.scheme === 'http' ? 'selected' : ''}>HTTP</option>
                                <option value="https" ${proxy.scheme === 'https' ? 'selected' : ''}>HTTPS</option>
                                <option value="socks5" ${proxy.scheme === 'socks5' ? 'selected' : ''}>SOCKS5</option>
                            </select>
                            <input type="text" class="proxy-host" value="${proxy.host}" 
                                   onchange="window.updateProxyHost(${index}, this.value)" 
                                   placeholder="Host">
                            <input type="number" class="proxy-port" value="${proxy.port}" 
                                   onchange="window.updateProxyPort(${index}, this.value)" 
                                   placeholder="Port">
                        </div>
                        <div class="proxy-credentials">
                            <input type="text" class="proxy-username" value="${proxy.username || ''}" 
                                   onchange="window.updateProxyUsername(${index}, this.value)" 
                                   placeholder="Username (optional)">
                            <input type="password" class="proxy-password" value="${proxy.password || ''}" 
                                   onchange="window.updateProxyPassword(${index}, this.value)" 
                                   placeholder="Password (optional)">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render request view (config + response side by side)
function renderRequestView() {
    if (!currentRequest) {
        return `
            <div class="empty-state">
                <h3>No request selected</h3>
                <p>Select a request from the sidebar or create a new one</p>
            </div>
        `;
    }
    
    return `
        <div class="request-view">
            <div class="request-breadcrumb">
                <span class="breadcrumb-collection">${currentCollection.name}</span>
                <span class="breadcrumb-separator">/</span>
                <input type="text" class="breadcrumb-request" value="${currentRequest.name}" 
                       onchange="window.updateRequestName(this.value)" 
                       placeholder="Request name">
            </div>
            <div class="request-url-bar">
                <div class="method-dropdown">
                    <button class="method-select" onclick="window.toggleMethodDropdown()">
                        <span class="method-select-text">${currentRequest.method}</span>
                        <svg class="method-select-icon" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="method-dropdown-menu" id="methodDropdownMenu">
                        ${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => `
                            <div class="method-dropdown-item ${currentRequest.method === method ? 'active' : ''}" 
                                 onclick="window.selectMethod('${method}')">
                                <span class="method-dropdown-item-text">${method}</span>
                                ${currentRequest.method === method ? `
                                    <svg class="method-dropdown-item-check" width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="url-input-container">
                    <input type="text" id="urlInput" class="url-input" value="${currentRequest.url}" 
                           oninput="window.handleUrlInput(event)" 
                           onkeydown="window.handleUrlKeydown(event)"
                           onchange="window.updateURL(this.value)" 
                           placeholder="https://api.example.com/endpoint">
                    <div id="autocompleteDropdown" class="autocomplete-dropdown" style="display: none;"></div>
                </div>
                <button class="btn-send" onclick="window.sendRequest()">
                    ${renderIcon('send', 10)}
                    <span>Send</span>
                </button>
            </div>
            <div class="request-content-split">
                <div class="request-config" id="requestConfig">
                    ${renderRequestConfig()}
                </div>
                <div class="resize-handle vertical" id="configResize"></div>
                <div class="request-response" id="requestResponse">
                    ${renderResponseViewer()}
                </div>
            </div>
        </div>
    `;
}

// Render request config (headers, body, query params)
function renderRequestConfig() {
    return `
        <div class="config-tabs">
            <button class="tab-btn ${activeRequestTab === 'headers' ? 'active' : ''}" 
                    onclick="window.switchRequestTab('headers')">Headers</button>
            <button class="tab-btn ${activeRequestTab === 'body' ? 'active' : ''}" 
                    onclick="window.switchRequestTab('body')">Body</button>
            <button class="tab-btn ${activeRequestTab === 'queryParams' ? 'active' : ''}" 
                    onclick="window.switchRequestTab('queryParams')">Query Params</button>
        </div>
        <div class="config-content">
            ${renderRequestTabContent()}
        </div>
    `;
}

// Render request list
function renderRequestList() {
    if (!currentCollection.requests || currentCollection.requests.length === 0) {
        return '<div class="empty-state">No requests yet. Click "New Request" to get started.</div>';
    }
    
    return currentCollection.requests.map(req => `
        <div class="request-item ${currentRequest && currentRequest.id === req.id ? 'active' : ''}" 
             onclick="window.selectRequest('${req.id}')">
            <span class="method-badge method-${req.method.toLowerCase()}">${req.method}</span>
            <span class="request-name">${req.name}</span>
        </div>
    `).join('');
}

// Render request tab content
function renderRequestTabContent() {
    if (!currentRequest) return '';
    
    switch (activeRequestTab) {
        case 'headers':
            return renderHeadersTab();
        case 'body':
            return renderBodyTab();
        case 'queryParams':
            return renderQueryParamsTab();
        default:
            return '<div class="info-text">Select a tab</div>';
    }
}

// Render headers tab
function renderHeadersTab() {
    const headers = currentRequest.headers || [];
    
    return `
        <div class="tab-content">
            <div class="tab-header">
                <h4>Headers</h4>
                <button class="btn-add" onclick="window.addHeader()">+ Add Header</button>
            </div>
            <div class="key-value-list">
                ${headers.length === 0 ? '<div class="empty-message">No headers. Click "Add Header" to add one.</div>' : ''}
                ${headers.map((header, index) => `
                    <div class="key-value-item">
                        <input type="checkbox" ${header.enabled ? 'checked' : ''} 
                               onchange="window.toggleHeader(${index}, this.checked)">
                        <div class="header-key-container">
                            <input type="text" id="headerKey${index}" class="key-input" value="${header.key}" 
                                   oninput="window.handleHeaderKeyInput(${index}, event)"
                                   onkeydown="window.handleHeaderKeyKeydown(event)"
                                   onchange="window.updateHeaderKey(${index}, this.value)" 
                                   placeholder="Header name">
                            <div id="headerAutocomplete${index}" class="autocomplete-dropdown" style="display: none;"></div>
                        </div>
                        <input type="text" class="value-input" value="${header.value}" 
                               onchange="window.updateHeaderValue(${index}, this.value)" 
                               placeholder="Header value">
                        <button class="btn-delete" onclick="window.deleteHeader(${index})">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render body tab
function renderBodyTab() {
    const body = currentRequest.body || { type: 'none', content: '' };
    
    return `
        <div class="tab-content">
            <div class="tab-header">
                <h4>Body</h4>
                <select class="body-type-select" onchange="window.updateBodyType(this.value)">
                    <option value="none" ${body.type === 'none' ? 'selected' : ''}>None</option>
                    <option value="json" ${body.type === 'json' ? 'selected' : ''}>JSON</option>
                    <option value="raw" ${body.type === 'raw' ? 'selected' : ''}>Raw Text</option>
                    <option value="form-urlencoded" ${body.type === 'form-urlencoded' ? 'selected' : ''}>Form URL Encoded</option>
                </select>
            </div>
            ${body.type === 'none' ? '<div class="empty-message">No body content</div>' : ''}
            ${body.type === 'json' || body.type === 'raw' ? `
                <textarea id="bodyTextarea" class="body-textarea" 
                          oninput="window.handleBodyInput(event)"
                          onkeydown="window.handleBodyKeydown(event)"
                          onchange="window.updateBodyContent(this.value)" 
                          placeholder="${body.type === 'json' ? 'Enter JSON content' : 'Enter raw text'}">${body.content || ''}</textarea>
            ` : ''}
            ${body.type === 'form-urlencoded' ? renderFormData() : ''}
        </div>
    `;
}

// Render form data
function renderFormData() {
    const formData = currentRequest.body?.formData || [];
    
    return `
        <div class="form-data-section">
            <button class="btn-add" onclick="window.addFormField()">+ Add Field</button>
            <div class="key-value-list">
                ${formData.length === 0 ? '<div class="empty-message">No form fields</div>' : ''}
                ${formData.map((field, index) => `
                    <div class="key-value-item">
                        <input type="checkbox" ${field.enabled ? 'checked' : ''} 
                               onchange="window.toggleFormField(${index}, this.checked)">
                        <input type="text" class="key-input" value="${field.key}" 
                               onchange="window.updateFormFieldKey(${index}, this.value)" 
                               placeholder="Field name">
                        <input type="text" class="value-input" value="${field.value}" 
                               onchange="window.updateFormFieldValue(${index}, this.value)" 
                               placeholder="Field value">
                        <button class="btn-delete" onclick="window.deleteFormField(${index})">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render query params tab
function renderQueryParamsTab() {
    const queryParams = currentRequest.queryParams || [];
    
    return `
        <div class="tab-content">
            <div class="tab-header">
                <h4>Query Parameters</h4>
                <button class="btn-add" onclick="window.addQueryParam()">+ Add Parameter</button>
            </div>
            <div class="key-value-list">
                ${queryParams.length === 0 ? '<div class="empty-message">No query parameters. Click "Add Parameter" to add one.</div>' : ''}
                ${queryParams.map((param, index) => `
                    <div class="key-value-item">
                        <input type="checkbox" ${param.enabled ? 'checked' : ''} 
                               onchange="window.toggleQueryParam(${index}, this.checked)">
                        <input type="text" class="key-input" value="${param.key}" 
                               onchange="window.updateQueryParamKey(${index}, this.value)" 
                               placeholder="Parameter name">
                        <input type="text" class="value-input" value="${param.value}" 
                               onchange="window.updateQueryParamValue(${index}, this.value)" 
                               placeholder="Parameter value">
                        <button class="btn-delete" onclick="window.deleteQueryParam(${index})">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render response viewer
function renderResponseViewer() {
    if (!currentRequest || !currentRequest.lastRun) {
        return `
            <div class="empty-state">
                <h3>No response yet</h3>
                <p>Send a request to see the response here</p>
            </div>
        `;
    }
    
    const result = currentRequest.lastRun;
    const statusClass = result.statusCode >= 200 && result.statusCode < 300 ? 'success' : 
                       result.statusCode >= 400 ? 'error' : 'info';
    
    return `
        <div class="response-header">
            <div class="response-status">
                <span class="status-badge status-${statusClass}">${result.statusCode} ${result.statusText}</span>
                <span class="response-time">${result.responseTime}ms</span>
                <span class="response-size">${formatBytes(result.responseSize)}</span>
            </div>
        </div>
        <div class="response-tabs">
            <button class="tab-btn ${activeResponseTab === 'body' ? 'active' : ''}" 
                    onclick="window.switchResponseTab('body')">Body</button>
            <button class="tab-btn ${activeResponseTab === 'headers' ? 'active' : ''}" 
                    onclick="window.switchResponseTab('headers')">Headers</button>
        </div>
        <div class="response-content">
            ${renderResponseTabContent()}
        </div>
    `;
}

// Render response tab content
function renderResponseTabContent() {
    if (!currentRequest || !currentRequest.lastRun) return '';
    
    const result = currentRequest.lastRun;
    
    if (activeResponseTab === 'body') {
        const body = result.responseBody || '(empty response)';
        const formattedBody = formatResponseBody(body, result.responseHeaders);
        const isJson = isJsonResponse(body, result.responseHeaders);
        
        if (isJson) {
            return `<div class="response-body"><pre>${highlightJson(formattedBody)}</pre></div>`;
        } else {
            return `<div class="response-body"><pre>${escapeHtml(formattedBody)}</pre></div>`;
        }
    } else {
        const headers = result.responseHeaders || {};
        return `
            <div class="response-headers">
                ${Object.keys(headers).length === 0 ? '<div class="empty-message">No headers</div>' : ''}
                ${Object.entries(headers).map(([key, value]) => `
                    <div class="header-item">
                        <span class="header-key">${escapeHtml(key)}:</span>
                        <span class="header-value">${escapeHtml(value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Check if response is JSON
function isJsonResponse(body, headers) {
    if (!body || body === '(empty response)') return false;
    
    // Check content-type header
    const contentType = headers ? Object.entries(headers).find(([key]) => 
        key.toLowerCase() === 'content-type'
    ) : null;
    
    if (contentType && contentType[1].toLowerCase().includes('application/json')) {
        return true;
    }
    
    // Check if body looks like JSON
    const trimmed = body.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
}

// Format response body (prettify JSON)
function formatResponseBody(body, headers) {
    if (!body || body === '(empty response)') return body;
    
    // Try to parse and prettify JSON
    if (isJsonResponse(body, headers)) {
        try {
            const parsed = JSON.parse(body);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If parsing fails, return original
            return body;
        }
    }
    
    return body;
}

// Highlight JSON syntax
function highlightJson(json) {
    if (!json) return '';
    
    return json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Event handlers
window.addNewRequest = async function() {
    try {
        const newRequest = {
            id: '', // Will be generated by backend
            collectionId: currentCollection.id,
            name: 'New Request',
            method: 'GET',
            url: 'https://api.example.com',
            queryParams: [],
            headers: [],
            body: {
                type: 'none',
                content: ''
            },
            authOverride: null,
            proxyOverrideId: null,
            lastRun: null
        };
        
        await AddRequest(currentCollection.id, newRequest);
        currentCollection = await GetCollection(currentCollection.id);
        currentRequest = currentCollection.requests[currentCollection.requests.length - 1];
        renderApp();
    } catch (err) {
        console.error('Failed to add request:', err);
        showErrorModal('Failed to add request', err.toString());
    }
};

window.selectRequest = async function(requestId) {
    console.log('Selecting request:', requestId);
    currentRequest = currentCollection.requests.find(r => r.id === requestId);
    activeCollectionTab = null; // Clear settings selection
    renderApp();
};

// Request basic info handlers
window.updateRequestName = async function(name) {
    if (!currentRequest) return;
    console.log('Updating request name:', name);
    currentRequest.name = name;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        currentCollection = await GetCollection(currentCollection.id);
        currentRequest = currentCollection.requests.find(r => r.id === currentRequest.id);
    } catch (err) {
        console.error('Failed to update request name:', err);
    }
};

window.updateMethod = async function(method) {
    if (!currentRequest) return;
    console.log('Updating method:', method);
    currentRequest.method = method;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        currentCollection = await GetCollection(currentCollection.id);
        currentRequest = currentCollection.requests.find(r => r.id === currentRequest.id);
        renderApp();
    } catch (err) {
        console.error('Failed to update method:', err);
    }
};

window.updateURL = async function(url) {
    if (!currentRequest) return;
    console.log('Updating URL:', url);
    currentRequest.url = url;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        currentCollection = await GetCollection(currentCollection.id);
        currentRequest = currentCollection.requests.find(r => r.id === currentRequest.id);
    } catch (err) {
        console.error('Failed to update URL:', err);
    }
};

// Collection management
window.switchCollection = async function(collectionId) {
    console.log('Switching collection to:', collectionId);
    try {
        currentCollection = await GetCollection(collectionId);
        currentRequest = null;
        activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to switch collection:', err);
        alert('Failed to switch collection: ' + err);
    }
};

// Settings item selection
window.selectSettingsItem = function(itemId) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🎯 selectSettingsItem CALLED');
    console.log('═══════════════════════════════════════');
    console.log('Item ID:', itemId);
    console.log('BEFORE - activeCollectionTab:', activeCollectionTab);
    console.log('BEFORE - currentRequest:', currentRequest?.name || 'null');
    
    activeCollectionTab = itemId;
    currentRequest = null; // Clear current request to show settings
    
    console.log('AFTER - activeCollectionTab:', activeCollectionTab);
    console.log('AFTER - currentRequest:', currentRequest);
    console.log('About to call renderApp()...');
    console.log('═══════════════════════════════════════');
    
    renderApp();
    
    console.log('');
    console.log('✅ selectSettingsItem COMPLETED');
    console.log('═══════════════════════════════════════');
    console.log('');
};

// Collection management
window.toggleCollectionDropdown = function() {
    const menu = document.getElementById('collectionDropdownMenu');
    const dropdown = menu?.closest('.collection-dropdown');
    const button = dropdown?.querySelector('.collection-select');
    const isOpen = menu?.classList.contains('show');
    
    if (isOpen) {
        menu.classList.remove('show');
        dropdown?.classList.remove('open');
    } else {
        // Calculate position for fixed dropdown
        if (button && menu) {
            const rect = button.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
        }
        menu?.classList.add('show');
        dropdown?.classList.add('open');
    }
};

window.selectCollection = async function(collectionId) {
    // Close dropdown
    const menu = document.getElementById('collectionDropdownMenu');
    const dropdown = menu?.closest('.collection-dropdown');
    menu?.classList.remove('show');
    dropdown?.classList.remove('open');
    
    // Switch collection
    console.log('Switching collection to:', collectionId);
    try {
        currentCollection = await GetCollection(collectionId);
        currentRequest = null;
        activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to switch collection:', err);
        showErrorModal('Failed to switch collection', err.toString());
    }
};

// Method dropdown management
window.toggleMethodDropdown = function() {
    const menu = document.getElementById('methodDropdownMenu');
    const isOpen = menu?.classList.contains('show');
    
    if (isOpen) {
        menu.classList.remove('show');
    } else {
        // Calculate position for fixed dropdown
        const button = document.querySelector('.method-select-button');
        if (button && menu) {
            const rect = button.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
        }
        menu?.classList.add('show');
    }
};

window.selectMethod = function(method) {
    // Close dropdown
    const menu = document.getElementById('methodDropdownMenu');
    menu?.classList.remove('show');
    
    // Update method
    window.updateMethod(method);
};

window.switchCollection = async function(collectionId) {
    console.log('Switching collection to:', collectionId);
    try {
        currentCollection = await GetCollection(collectionId);
        currentRequest = null;
        activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to switch collection:', err);
        showErrorModal('Failed to switch collection', err.toString());
    }
};

window.addNewCollection = async function() {
    const name = await showInputModal('New Collection', 'Enter collection name', 'My Collection');
    if (!name) return;
    
    console.log('Creating new collection:', name);
    try {
        const newCollection = await CreateCollection(name);
        allCollections = await GetCollections();
        currentCollection = await GetCollection(newCollection.id);
        currentRequest = null;
        activeCollectionTab = null;
        renderApp();
        showSuccessModal('Collection created successfully');
    } catch (err) {
        console.error('Failed to create collection:', err);
        showErrorModal('Failed to create collection', err.toString());
    }
};

window.deleteCurrentCollection = async function() {
    if (allCollections.length <= 1) {
        showErrorModal('Cannot delete collection', 'You must have at least one collection');
        return;
    }
    
    const confirmed = await showConfirmModal(
        'Delete Collection',
        `Are you sure you want to delete "${currentCollection.name}"?`
    );
    
    if (!confirmed) return;
    
    console.log('Deleting collection:', currentCollection.name);
    try {
        await DeleteCollection(currentCollection.id);
        allCollections = await GetCollections();
        currentCollection = await GetCollection(allCollections[0].id);
        currentRequest = null;
        activeCollectionTab = null;
        renderApp();
        showSuccessModal('Collection deleted successfully');
    } catch (err) {
        console.error('Failed to delete collection:', err);
        showErrorModal('Failed to delete collection', err.toString());
    }
};

window.deleteRequest = async function(requestId, event) {
    event.stopPropagation(); // Prevent selecting the request
    
    const request = currentCollection.requests.find(r => r.id === requestId);
    const confirmed = await showConfirmModal(
        'Delete Request',
        `Are you sure you want to delete "${request.name}"?`
    );
    
    if (!confirmed) return;
    
    try {
        await DeleteRequest(currentCollection.id, requestId);
        currentCollection = await GetCollection(currentCollection.id);
        if (currentRequest && currentRequest.id === requestId) {
            currentRequest = null;
        }
        renderApp();
        showSuccessModal('Request deleted successfully');
    } catch (err) {
        console.error('Failed to delete request:', err);
        showErrorModal('Failed to delete request', err.toString());
    }
};

// Collection settings handlers
window.toggleCollectionSettings = function() {
    showCollectionSettings = !showCollectionSettings;
    renderApp();
};

window.switchCollectionTab = function(tab) {
    activeCollectionTab = tab;
    renderApp();
};

// Variables management
window.addVariable = async function() {
    if (!currentCollection.variables) currentCollection.variables = {};
    
    const newKey = `var${Object.keys(currentCollection.variables).length + 1}`;
    currentCollection.variables[newKey] = '';
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to add variable:', err);
    }
};

window.updateVariableKey = async function(oldKey, newKey) {
    if (!currentCollection.variables || oldKey === newKey) return;
    
    const value = currentCollection.variables[oldKey];
    delete currentCollection.variables[oldKey];
    currentCollection.variables[newKey] = value;
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to update variable key:', err);
    }
};

window.updateVariableValue = async function(key, value) {
    if (!currentCollection.variables) return;
    
    currentCollection.variables[key] = value;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update variable value:', err);
    }
};

window.deleteVariable = async function(key) {
    if (!currentCollection.variables) return;
    
    delete currentCollection.variables[key];
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to delete variable:', err);
    }
};

// Tab switching
window.switchRequestTab = function(tab) {
    console.log('Switching request tab to:', tab);
    activeRequestTab = tab;
    renderApp();
};

window.switchResponseTab = function(tab) {
    console.log('Switching response tab to:', tab);
    activeResponseTab = tab;
    renderApp();
};

// Request execution
window.sendRequest = async function() {
    if (!currentRequest) return;
    
    console.log('Sending request:', currentRequest.name, currentRequest.url);
    try {
        const result = await ExecuteRequest(currentCollection.id, currentRequest.id);
        console.log('Request result:', result);
        currentRequest.lastRun = result;
        // Refresh collection to get updated request
        currentCollection = await GetCollection(currentCollection.id);
        currentRequest = currentCollection.requests.find(r => r.id === currentRequest.id);
        renderApp();
    } catch (err) {
        console.error('Failed to execute request:', err);
        showErrorModal('Request Failed', err.toString());
    }
};

// Headers management
window.addHeader = async function() {
    if (!currentRequest) return;
    if (!currentRequest.headers) currentRequest.headers = [];
    
    currentRequest.headers.push({ key: '', value: '', enabled: true });
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to add header:', err);
    }
};

window.toggleHeader = async function(index, enabled) {
    if (!currentRequest || !currentRequest.headers[index]) return;
    currentRequest.headers[index].enabled = enabled;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to toggle header:', err);
    }
};

window.updateHeaderKey = async function(index, key) {
    if (!currentRequest || !currentRequest.headers[index]) return;
    currentRequest.headers[index].key = key;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update header key:', err);
    }
};

window.updateHeaderValue = async function(index, value) {
    if (!currentRequest || !currentRequest.headers[index]) return;
    currentRequest.headers[index].value = value;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update header value:', err);
    }
};

window.deleteHeader = async function(index) {
    if (!currentRequest || !currentRequest.headers[index]) return;
    currentRequest.headers.splice(index, 1);
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to delete header:', err);
    }
};

// Body management
window.updateBodyType = async function(type) {
    if (!currentRequest) return;
    if (!currentRequest.body) currentRequest.body = {};
    
    currentRequest.body.type = type;
    if (type === 'none') {
        currentRequest.body.content = '';
        currentRequest.body.formData = [];
    } else if (type === 'form-urlencoded') {
        currentRequest.body.content = '';
        if (!currentRequest.body.formData) currentRequest.body.formData = [];
    } else {
        currentRequest.body.formData = [];
    }
    
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to update body type:', err);
    }
};

window.updateBodyContent = async function(content) {
    if (!currentRequest) return;
    if (!currentRequest.body) currentRequest.body = { type: 'raw', content: '' };
    
    currentRequest.body.content = content;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update body content:', err);
    }
};

// Form data management
window.addFormField = async function() {
    if (!currentRequest) return;
    if (!currentRequest.body) currentRequest.body = { type: 'form-urlencoded', formData: [] };
    if (!currentRequest.body.formData) currentRequest.body.formData = [];
    
    currentRequest.body.formData.push({ key: '', value: '', enabled: true });
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to add form field:', err);
    }
};

window.toggleFormField = async function(index, enabled) {
    if (!currentRequest || !currentRequest.body?.formData?.[index]) return;
    currentRequest.body.formData[index].enabled = enabled;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to toggle form field:', err);
    }
};

window.updateFormFieldKey = async function(index, key) {
    if (!currentRequest || !currentRequest.body?.formData?.[index]) return;
    currentRequest.body.formData[index].key = key;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update form field key:', err);
    }
};

window.updateFormFieldValue = async function(index, value) {
    if (!currentRequest || !currentRequest.body?.formData?.[index]) return;
    currentRequest.body.formData[index].value = value;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update form field value:', err);
    }
};

window.deleteFormField = async function(index) {
    if (!currentRequest || !currentRequest.body?.formData?.[index]) return;
    currentRequest.body.formData.splice(index, 1);
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to delete form field:', err);
    }
};

// Query params management
window.addQueryParam = async function() {
    if (!currentRequest) return;
    if (!currentRequest.queryParams) currentRequest.queryParams = [];
    
    currentRequest.queryParams.push({ key: '', value: '', enabled: true });
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to add query param:', err);
    }
};

window.toggleQueryParam = async function(index, enabled) {
    if (!currentRequest || !currentRequest.queryParams[index]) return;
    currentRequest.queryParams[index].enabled = enabled;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to toggle query param:', err);
    }
};

window.updateQueryParamKey = async function(index, key) {
    if (!currentRequest || !currentRequest.queryParams[index]) return;
    currentRequest.queryParams[index].key = key;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update query param key:', err);
    }
};

window.updateQueryParamValue = async function(index, value) {
    if (!currentRequest || !currentRequest.queryParams[index]) return;
    currentRequest.queryParams[index].value = value;
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
    } catch (err) {
        console.error('Failed to update query param value:', err);
    }
};

window.deleteQueryParam = async function(index) {
    if (!currentRequest || !currentRequest.queryParams[index]) return;
    currentRequest.queryParams.splice(index, 1);
    try {
        await UpdateRequest(currentCollection.id, currentRequest);
        renderApp();
    } catch (err) {
        console.error('Failed to delete query param:', err);
    }
};

// Auth management
window.updateAuthType = async function(type) {
    currentCollection.globalAuth = { type };
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to update auth type:', err);
    }
};

window.updateAuthBearerToken = async function(token) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'bearer' };
    currentCollection.globalAuth.bearerToken = token;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update bearer token:', err);
    }
};

window.updateAuthUsername = async function(username) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'basic' };
    currentCollection.globalAuth.username = username;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update username:', err);
    }
};

window.updateAuthPassword = async function(password) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'basic' };
    currentCollection.globalAuth.password = password;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update password:', err);
    }
};

window.updateAuthApiKey = async function(apiKey) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'apikey' };
    currentCollection.globalAuth.apiKey = apiKey;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update API key:', err);
    }
};

window.updateAuthApiKeyName = async function(name) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'apikey' };
    currentCollection.globalAuth.apiKeyName = name;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update API key name:', err);
    }
};

window.updateAuthApiKeyLocation = async function(location) {
    if (!currentCollection.globalAuth) currentCollection.globalAuth = { type: 'apikey' };
    currentCollection.globalAuth.apiKeyLocation = location;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update API key location:', err);
    }
};

// Proxy management
window.addProxy = async function() {
    if (!currentCollection.proxies) currentCollection.proxies = [];
    
    const newProxy = {
        id: `proxy-${Date.now()}`,
        name: 'New Proxy',
        scheme: 'http',
        host: 'localhost',
        port: 8080,
        username: null,
        password: null
    };
    
    currentCollection.proxies.push(newProxy);
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to add proxy:', err);
    }
};

window.setActiveProxy = async function(proxyId) {
    currentCollection.activeProxyId = proxyId;
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to set active proxy:', err);
    }
};

window.clearActiveProxy = async function() {
    currentCollection.activeProxyId = null;
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to clear active proxy:', err);
    }
};

window.updateProxyName = async function(index, name) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].name = name;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy name:', err);
    }
};

window.updateProxyScheme = async function(index, scheme) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].scheme = scheme;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy scheme:', err);
    }
};

window.updateProxyHost = async function(index, host) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].host = host;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy host:', err);
    }
};

window.updateProxyPort = async function(index, port) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].port = parseInt(port);
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy port:', err);
    }
};

window.updateProxyUsername = async function(index, username) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].username = username || null;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy username:', err);
    }
};

window.updateProxyPassword = async function(index, password) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    currentCollection.proxies[index].password = password || null;
    
    try {
        await UpdateCollection(currentCollection);
    } catch (err) {
        console.error('Failed to update proxy password:', err);
    }
};

window.deleteProxy = async function(index) {
    if (!currentCollection.proxies || !currentCollection.proxies[index]) return;
    
    const deletedProxyId = currentCollection.proxies[index].id;
    currentCollection.proxies.splice(index, 1);
    
    // If deleted proxy was active, clear active proxy
    if (currentCollection.activeProxyId === deletedProxyId) {
        currentCollection.activeProxyId = null;
    }
    
    try {
        await UpdateCollection(currentCollection);
        currentCollection = await GetCollection(currentCollection.id);
        renderApp();
    } catch (err) {
        console.error('Failed to delete proxy:', err);
    }
};

// Resize handlers
function initResizeHandlers() {
    const sidebarResize = document.getElementById('sidebarResize');
    const configResize = document.getElementById('configResize');
    const sidebar = document.getElementById('sidebar');
    const requestConfig = document.getElementById('requestConfig');
    const requestResponse = document.getElementById('requestResponse');
    
    // Sidebar resize
    if (sidebarResize && sidebar) {
        let isResizing = false;
        
        sidebarResize.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 600) {
                sidebar.style.width = newWidth + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
            }
        });
    }
    
    // Config/Response vertical resize
    if (configResize && requestConfig && requestResponse) {
        let isResizing = false;
        
        configResize.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const container = requestConfig.parentElement;
            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            const minWidth = 300;
            const maxWidth = containerRect.width - 300;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                requestConfig.style.flex = 'none';
                requestConfig.style.width = newWidth + 'px';
                requestResponse.style.flex = '1';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
            }
        });
    }
}

// Export autocomplete and autopair handlers to window
window.handleUrlInput = (event) => handleUrlInput(event, currentCollection);
window.handleUrlKeydown = handleUrlKeydown;
window.handleHeaderKeyInput = handleHeaderKeyInput;
window.handleHeaderKeyKeydown = handleHeaderKeyKeydown;
window.handleBodyInput = handleBodyInput;
window.handleBodyKeydown = handleBodyKeydown;

// Export modal functions to window
window.showErrorModal = showErrorModal;
window.showSuccessModal = showSuccessModal;
window.showConfirmModal = showConfirmModal;
window.showInputModal = showInputModal;

// Export theme functions to window
window.toggleThemeHandler = function() {
    const newTheme = toggleTheme();
    console.log('Theme switched to:', newTheme);
    
    // Update icon
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerHTML = renderIcon(newTheme === 'dark' ? 'sun' : 'moon', 16);
    }
};

window.openDevToolsHandler = function() {
    // Try to simulate F12 key press
    const event = new KeyboardEvent('keydown', {
        key: 'F12',
        code: 'F12',
        keyCode: 123,
        which: 123,
        bubbles: true,
        cancelable: true
    });
    
    document.dispatchEvent(event);
    
    // Also try Ctrl+Shift+I
    setTimeout(() => {
        const ctrlShiftI = new KeyboardEvent('keydown', {
            key: 'I',
            code: 'KeyI',
            keyCode: 73,
            which: 73,
            ctrlKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(ctrlShiftI);
    }, 100);
    
    // Show instructions in console
    console.log('%c=== DevTools Instructions ===', 'color: #c96442; font-size: 14px; font-weight: bold;');
    console.log('%cIf DevTools did not open automatically, use:', 'color: #5e5d59;');
    console.log('%c• Press F12', 'color: #141413; font-weight: 500;');
    console.log('%c• Right-click > Inspect', 'color: #141413; font-weight: 500;');
    console.log('%c• Ctrl+Shift+I (Windows/Linux)', 'color: #141413; font-weight: 500;');
    console.log('%c• Cmd+Option+I (macOS)', 'color: #141413; font-weight: 500;');
    
    // Show a subtle notification using existing modal system
    showSuccessModal('DevTools: Press F12 or Right-click > Inspect');
};

// Helper function to show devtools notification
function showDevToolsNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 20px;
        background: rgba(201, 100, 66, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        font-size: 13px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = 'Press F12 to open DevTools';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.getCurrentTheme = getCurrentTheme;

// Debug: Test all window functions
window.testFunctions = function() {
    const requiredFunctions = [
        'addNewRequest', 'selectRequest', 'updateRequestName', 'updateMethod', 'updateURL',
        'switchSidebarTab', 'switchCollection', 'addNewCollection', 'deleteCurrentCollection',
        'deleteRequest', 'switchCollectionTab', 'switchRequestTab', 'switchResponseTab',
        'sendRequest', 'addHeader', 'toggleHeader', 'updateHeaderKey', 'updateHeaderValue',
        'deleteHeader', 'updateBodyType', 'updateBodyContent', 'addFormField', 'toggleFormField',
        'updateFormFieldKey', 'updateFormFieldValue', 'deleteFormField', 'addQueryParam',
        'toggleQueryParam', 'updateQueryParamKey', 'updateQueryParamValue', 'deleteQueryParam',
        'addVariable', 'updateVariableKey', 'updateVariableValue', 'deleteVariable',
        'updateAuthType', 'updateAuthBearerToken', 'updateAuthUsername', 'updateAuthPassword',
        'updateAuthApiKey', 'updateAuthApiKeyName', 'updateAuthApiKeyLocation',
        'addProxy', 'setActiveProxy', 'clearActiveProxy', 'updateProxyName', 'updateProxyScheme',
        'updateProxyHost', 'updateProxyPort', 'updateProxyUsername', 'updateProxyPassword', 'deleteProxy',
        'selectSettingsItem'
    ];
    
    const missing = [];
    const found = [];
    
    requiredFunctions.forEach(func => {
        if (typeof window[func] === 'function') {
            found.push(func);
        } else {
            missing.push(func);
        }
    });
    
    console.log('=== Function Test Results ===');
    console.log('Found:', found.length, '/', requiredFunctions.length);
    console.log('Missing:', missing);
    
    if (missing.length === 0) {
        console.log('✅ All functions are defined!');
    } else {
        console.error('❌ Missing functions:', missing);
    }
    
    return { found, missing };
};

console.log('App initialized. Run window.testFunctions() to test all functions.');
console.log('Testing selectSettingsItem:', typeof window.selectSettingsItem);
console.log('Testing switchSidebarTab:', typeof window.switchSidebarTab);

// Test if functions are callable
setTimeout(() => {
    console.log('=== Post-init function check ===');
    console.log('selectSettingsItem:', typeof window.selectSettingsItem);
    console.log('Current state:', {
        activeCollectionTab,
        currentRequest: currentRequest?.name
    });
    
    // Test manual call
    console.log('=== Testing manual call ===');
    console.log('Calling selectSettingsItem("variables")...');
    // Uncomment to test: window.selectSettingsItem('variables');
}, 1000);

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('collectionDropdownMenu');
    const dropdown = e.target.closest('.collection-dropdown');
    
    if (menu && !dropdown && menu.classList.contains('show')) {
        menu.classList.remove('show');
        const dropdownContainer = menu.closest('.collection-dropdown');
        dropdownContainer?.classList.remove('open');
    }
    
    // Close method dropdown
    const methodMenu = document.getElementById('methodDropdownMenu');
    const methodDropdown = e.target.closest('.method-dropdown');
    
    if (methodMenu && !methodDropdown && methodMenu.classList.contains('show')) {
        methodMenu.classList.remove('show');
    }
});

// Start the app - MUST BE LAST!
console.log('=== Starting app initialization ===');
setupEventDelegation(); // Setup BEFORE initApp
initApp();
