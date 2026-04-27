// Application State Management

export const state = {
    currentCollection: null,
    currentRequest: null,
    allCollections: [],
    activeRequestTab: 'headers',
    activeResponseTab: 'body',
    activeCollectionTab: null
};

export function setState(updates) {
    Object.assign(state, updates);
}

export function getState() {
    return state;
}
