// Autocomplete functionality

// Common HTTP headers for autocomplete
export const COMMON_HEADERS = [
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Authorization',
    'Cache-Control',
    'Connection',
    'Content-Type',
    'Content-Length',
    'Cookie',
    'Host',
    'Origin',
    'Referer',
    'User-Agent',
    'X-API-Key',
    'X-Auth-Token',
    'X-Requested-With'
];

// Autocomplete state
export const autocompleteState = {
    visible: false,
    items: [],
    selectedIndex: 0,
    targetElement: null,
    cursorPosition: 0,
    type: 'variable' // 'variable' or 'header'
};

// URL input handlers for variable autocomplete
export function handleUrlInput(event, currentCollection) {
    const input = event.target;
    const value = input.value;
    const cursorPos = input.selectionStart;
    
    // Check if user typed '{'
    if (value[cursorPos - 1] === '{') {
        // Auto-complete to '{{}}'
        const before = value.substring(0, cursorPos);
        const after = value.substring(cursorPos);
        input.value = before + '}' + after;
        input.selectionStart = input.selectionEnd = cursorPos;
        
        // Show variable suggestions
        showVariableAutocomplete(input, cursorPos, '', currentCollection);
    } else {
        // Check if cursor is inside {{}}
        const beforeCursor = value.substring(0, cursorPos);
        const lastOpenBrace = beforeCursor.lastIndexOf('{{');
        const lastCloseBrace = beforeCursor.lastIndexOf('}}');
        
        if (lastOpenBrace > lastCloseBrace && lastOpenBrace !== -1) {
            // Inside variable placeholder
            const searchText = beforeCursor.substring(lastOpenBrace + 2);
            showVariableAutocomplete(input, cursorPos, searchText, currentCollection);
        } else {
            hideAutocomplete();
        }
    }
}

export function handleUrlKeydown(event) {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown || dropdown.style.display === 'none') return;
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        autocompleteState.selectedIndex = Math.min(
            autocompleteState.selectedIndex + 1,
            autocompleteState.items.length - 1
        );
        updateAutocompleteSelection();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        autocompleteState.selectedIndex = Math.max(autocompleteState.selectedIndex - 1, 0);
        updateAutocompleteSelection();
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        selectAutocompleteItem(autocompleteState.selectedIndex);
    } else if (event.key === 'Escape') {
        hideAutocomplete();
    }
}

// Header key input handlers
export function handleHeaderKeyInput(index, event) {
    const input = event.target;
    const value = input.value;
    
    if (value.length > 0) {
        showHeaderAutocomplete(input, index, value);
    } else {
        hideHeaderAutocomplete(index);
    }
}

export function handleHeaderKeyKeydown(event) {
    const input = event.target;
    const index = parseInt(input.id.replace('headerKey', ''));
    const dropdown = document.getElementById(`headerAutocomplete${index}`);
    
    if (!dropdown || dropdown.style.display === 'none') return;
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        autocompleteState.selectedIndex = Math.min(
            autocompleteState.selectedIndex + 1,
            autocompleteState.items.length - 1
        );
        updateHeaderAutocompleteSelection(index);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        autocompleteState.selectedIndex = Math.max(autocompleteState.selectedIndex - 1, 0);
        updateHeaderAutocompleteSelection(index);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        selectHeaderAutocompleteItem(index, autocompleteState.selectedIndex);
    } else if (event.key === 'Escape') {
        hideHeaderAutocomplete(index);
    }
}

// Show variable autocomplete
function showVariableAutocomplete(input, cursorPos, searchText, currentCollection) {
    const variables = currentCollection.variables || {};
    const variableNames = Object.keys(variables);
    
    if (variableNames.length === 0) {
        hideAutocomplete();
        return;
    }
    
    // Filter variables based on search text
    const filtered = searchText 
        ? variableNames.filter(name => name.toLowerCase().includes(searchText.toLowerCase()))
        : variableNames;
    
    if (filtered.length === 0) {
        hideAutocomplete();
        return;
    }
    
    autocompleteState.visible = true;
    autocompleteState.items = filtered;
    autocompleteState.selectedIndex = 0;
    autocompleteState.targetElement = input;
    autocompleteState.cursorPosition = cursorPos;
    autocompleteState.type = 'variable';
    
    const dropdown = document.getElementById('autocompleteDropdown');
    dropdown.innerHTML = filtered.map((name, index) => `
        <div class="autocomplete-item ${index === 0 ? 'selected' : ''}" 
             onclick="window.selectAutocompleteItem(${index})">
            <span class="autocomplete-name">${name}</span>
            <span class="autocomplete-value">${variables[name]}</span>
        </div>
    `).join('');
    
    // Position dropdown using fixed positioning
    const rect = input.getBoundingClientRect();
    dropdown.style.display = 'block';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
}

// Hide variable autocomplete
function hideAutocomplete() {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    autocompleteState.visible = false;
}

// Update autocomplete selection
function updateAutocompleteSelection() {
    const dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) return;
    
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        if (index === autocompleteState.selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Select autocomplete item
function selectAutocompleteItem(index) {
    const selectedVar = autocompleteState.items[index];
    const input = autocompleteState.targetElement;
    const value = input.value;
    const cursorPos = autocompleteState.cursorPosition;
    
    // Find the {{ before cursor
    const beforeCursor = value.substring(0, cursorPos);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    
    // Find the }} after cursor
    const afterCursor = value.substring(cursorPos);
    const nextCloseBrace = afterCursor.indexOf('}}');
    
    if (lastOpenBrace !== -1 && nextCloseBrace !== -1) {
        const before = value.substring(0, lastOpenBrace + 2);
        const after = value.substring(cursorPos + nextCloseBrace);
        input.value = before + selectedVar + after;
        input.selectionStart = input.selectionEnd = before.length + selectedVar.length;
    }
    
    hideAutocomplete();
    input.focus();
    
    // Trigger change event
    if (window.updateURL) {
        window.updateURL(input.value);
    }
}

// Show header autocomplete
function showHeaderAutocomplete(input, index, searchText) {
    const filtered = COMMON_HEADERS.filter(header => 
        header.toLowerCase().startsWith(searchText.toLowerCase())
    );
    
    if (filtered.length === 0) {
        hideHeaderAutocomplete(index);
        return;
    }
    
    autocompleteState.visible = true;
    autocompleteState.items = filtered;
    autocompleteState.selectedIndex = 0;
    autocompleteState.targetElement = input;
    autocompleteState.type = 'header';
    
    const dropdown = document.getElementById(`headerAutocomplete${index}`);
    dropdown.innerHTML = filtered.map((name, idx) => `
        <div class="autocomplete-item ${idx === 0 ? 'selected' : ''}" 
             onclick="window.selectHeaderAutocompleteItem(${index}, ${idx})">
            <span class="autocomplete-name">${name}</span>
        </div>
    `).join('');
    
    // Position dropdown using fixed positioning
    const rect = input.getBoundingClientRect();
    dropdown.style.display = 'block';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
}

// Hide header autocomplete
function hideHeaderAutocomplete(index) {
    const dropdown = document.getElementById(`headerAutocomplete${index}`);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    autocompleteState.visible = false;
}

// Update header autocomplete selection
function updateHeaderAutocompleteSelection(index) {
    const dropdown = document.getElementById(`headerAutocomplete${index}`);
    if (!dropdown) return;
    
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, idx) => {
        if (idx === autocompleteState.selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Select header autocomplete item
function selectHeaderAutocompleteItem(headerIndex, itemIndex) {
    const selectedHeader = autocompleteState.items[itemIndex];
    const input = autocompleteState.targetElement;
    
    input.value = selectedHeader;
    hideHeaderAutocomplete(headerIndex);
    input.focus();
    
    // Trigger change event
    if (window.updateHeaderKey) {
        window.updateHeaderKey(headerIndex, selectedHeader);
    }
}

// Export for window
window.selectAutocompleteItem = selectAutocompleteItem;
window.selectHeaderAutocompleteItem = selectHeaderAutocompleteItem;

// Close autocomplete when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.url-input-container') && 
        !event.target.closest('.header-key-container') &&
        !event.target.closest('.autocomplete-dropdown')) {
        hideAutocomplete();
        // Hide all header autocompletions
        document.querySelectorAll('[id^="headerAutocomplete"]').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

// Hide autocomplete on scroll
document.addEventListener('scroll', function(event) {
    if (autocompleteState.visible) {
        hideAutocomplete();
        // Hide all header autocompletions
        document.querySelectorAll('[id^="headerAutocomplete"]').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
}, true); // Use capture phase to catch all scroll events
