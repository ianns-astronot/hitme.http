// Event Handlers for UI interactions

import { state, setState } from './state.js';
import { renderApp } from './render.js';
import {
    GetCollection,
    CreateCollection,
    DeleteCollection,
    AddRequest,
    UpdateRequest,
    DeleteRequest,
    ExecuteRequest,
    UpdateCollection
} from '../wailsjs/go/main/App';

// Request handlers
export async function addNewRequest() {
    try {
        const newRequest = {
            id: '',
            collectionId: state.currentCollection.id,
            name: 'New Request',
            method: 'GET',
            url: 'https://api.example.com',
            queryParams: [],
            headers: [],
            body: { type: 'none', content: '' },
            authOverride: null,
            proxyOverrideId: null,
            lastRun: null
        };
        
        await AddRequest(state.currentCollection.id, newRequest);
        state.currentCollection = await GetCollection(state.currentCollection.id);
        state.currentRequest = state.currentCollection.requests[state.currentCollection.requests.length - 1];
        state.activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to add request:', err);
        alert('Failed to add request: ' + err);
    }
}

export async function selectRequest(requestId) {
    console.log('Selecting request:', requestId);
    state.currentRequest = state.currentCollection.requests.find(r => r.id === requestId);
    state.activeCollectionTab = null;
    renderApp();
}

export async function updateRequestName(name) {
    if (state.currentRequest) {
        state.currentRequest.name = name;
        try {
            await UpdateRequest(state.currentCollection.id, state.currentRequest);
            state.currentCollection = await GetCollection(state.currentCollection.id);
            state.currentRequest = state.currentCollection.requests.find(r => r.id === state.currentRequest.id);
        } catch (err) {
            console.error('Failed to update request name:', err);
        }
    }
}

export async function updateMethod(method) {
    if (state.currentRequest) {
        state.currentRequest.method = method;
        try {
            await UpdateRequest(state.currentCollection.id, state.currentRequest);
            state.currentCollection = await GetCollection(state.currentCollection.id);
            state.currentRequest = state.currentCollection.requests.find(r => r.id === state.currentRequest.id);
            renderApp();
        } catch (err) {
            console.error('Failed to update method:', err);
        }
    }
}

export async function updateURL(url) {
    if (state.currentRequest) {
        state.currentRequest.url = url;
        try {
            await UpdateRequest(state.currentCollection.id, state.currentRequest);
            state.currentCollection = await GetCollection(state.currentCollection.id);
            state.currentRequest = state.currentCollection.requests.find(r => r.id === state.currentRequest.id);
        } catch (err) {
            console.error('Failed to update URL:', err);
        }
    }
}

export async function sendRequest() {
    if (!state.currentRequest) return;
    
    console.log('Sending request:', state.currentRequest.name, state.currentRequest.url);
    try {
        const result = await ExecuteRequest(state.currentCollection.id, state.currentRequest.id);
        console.log('Request result:', result);
        state.currentRequest.lastRun = result;
        state.currentCollection = await GetCollection(state.currentCollection.id);
        state.currentRequest = state.currentCollection.requests.find(r => r.id === state.currentRequest.id);
        renderApp();
    } catch (err) {
        console.error('Failed to execute request:', err);
        alert('Failed to execute request: ' + err);
    }
}

export async function deleteRequest(requestId, event) {
    event.stopPropagation();
    
    const request = state.currentCollection.requests.find(r => r.id === requestId);
    if (!confirm(`Delete request "${request.name}"?`)) return;
    
    try {
        await DeleteRequest(state.currentCollection.id, requestId);
        state.currentCollection = await GetCollection(state.currentCollection.id);
        if (state.currentRequest && state.currentRequest.id === requestId) {
            state.currentRequest = null;
        }
        renderApp();
    } catch (err) {
        console.error('Failed to delete request:', err);
        alert('Failed to delete request: ' + err);
    }
}

// Settings handlers
export function selectSettingsItem(itemId) {
    console.log('=== selectSettingsItem called ===');
    console.log('Item ID:', itemId);
    
    state.activeCollectionTab = itemId;
    state.currentRequest = null;
    
    console.log('New activeCollectionTab:', state.activeCollectionTab);
    console.log('About to renderApp...');
    
    renderApp();
    
    console.log('=== selectSettingsItem completed ===');
}

// Collection handlers
export async function switchCollection(collectionId) {
    console.log('Switching collection to:', collectionId);
    try {
        state.currentCollection = await GetCollection(collectionId);
        state.currentRequest = null;
        state.activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to switch collection:', err);
        alert('Failed to switch collection: ' + err);
    }
}

export async function addNewCollection() {
    const name = prompt('Enter collection name:', 'New Collection');
    if (!name) return;
    
    console.log('Creating new collection:', name);
    try {
        const newCollection = await CreateCollection(name);
        state.allCollections = await GetCollections();
        state.currentCollection = await GetCollection(newCollection.id);
        state.currentRequest = null;
        state.activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to create collection:', err);
        alert('Failed to create collection: ' + err);
    }
}

export async function deleteCurrentCollection() {
    if (state.allCollections.length <= 1) {
        alert('Cannot delete the last collection');
        return;
    }
    
    if (!confirm(`Delete collection "${state.currentCollection.name}"?`)) return;
    
    console.log('Deleting collection:', state.currentCollection.name);
    try {
        await DeleteCollection(state.currentCollection.id);
        state.allCollections = await GetCollections();
        state.currentCollection = await GetCollection(state.allCollections[0].id);
        state.currentRequest = null;
        state.activeCollectionTab = null;
        renderApp();
    } catch (err) {
        console.error('Failed to delete collection:', err);
        alert('Failed to delete collection: ' + err);
    }
}

// Tab switching
export function switchRequestTab(tab) {
    console.log('Switching request tab to:', tab);
    state.activeRequestTab = tab;
    renderApp();
}

export function switchResponseTab(tab) {
    console.log('Switching response tab to:', tab);
    state.activeResponseTab = tab;
    renderApp();
}
