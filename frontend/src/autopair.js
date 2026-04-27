// Auto-pairing for JSON body textarea

const PAIR_CHARS = {
    '{': '}',
    '[': ']',
    '"': '"',
    "'": "'",
    '(': ')',
};

const CLOSING_CHARS = new Set(['}', ']', '"', "'", ')']);

export function handleBodyInput(event) {
    // This is called after the character is already inserted
    // We use keydown for auto-pairing
}

export function handleBodyKeydown(event) {
    const textarea = event.target;
    const key = event.key;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Auto-pairing for opening characters
    if (PAIR_CHARS[key]) {
        event.preventDefault();
        
        const before = value.substring(0, start);
        const selected = value.substring(start, end);
        const after = value.substring(end);
        
        if (selected) {
            // Wrap selection
            textarea.value = before + key + selected + PAIR_CHARS[key] + after;
            textarea.selectionStart = start + 1;
            textarea.selectionEnd = end + 1;
        } else {
            // Insert pair
            textarea.value = before + key + PAIR_CHARS[key] + after;
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        
        return;
    }
    
    // Skip closing character if it's already there
    if (CLOSING_CHARS.has(key) && value[start] === key && start === end) {
        event.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
    }
    
    // Auto-indent on Enter
    if (key === 'Enter') {
        const before = value.substring(0, start);
        const after = value.substring(start);
        const lines = before.split('\n');
        const currentLine = lines[lines.length - 1];
        const indent = currentLine.match(/^\s*/)[0];
        
        // Check if we're between brackets
        const charBefore = before[before.length - 1];
        const charAfter = after[0];
        const isBetweenBrackets = 
            (charBefore === '{' && charAfter === '}') ||
            (charBefore === '[' && charAfter === ']');
        
        if (isBetweenBrackets) {
            event.preventDefault();
            const newIndent = indent + '  '; // 2 spaces
            textarea.value = before + '\n' + newIndent + '\n' + indent + after;
            textarea.selectionStart = textarea.selectionEnd = start + 1 + newIndent.length;
        } else if (charBefore === '{' || charBefore === '[') {
            event.preventDefault();
            const newIndent = indent + '  ';
            textarea.value = before + '\n' + newIndent + after;
            textarea.selectionStart = textarea.selectionEnd = start + 1 + newIndent.length;
        } else {
            event.preventDefault();
            textarea.value = before + '\n' + indent + after;
            textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }
        
        return;
    }
    
    // Auto-delete pair on Backspace
    if (key === 'Backspace' && start === end && start > 0) {
        const charBefore = value[start - 1];
        const charAfter = value[start];
        
        if (PAIR_CHARS[charBefore] === charAfter) {
            event.preventDefault();
            textarea.value = value.substring(0, start - 1) + value.substring(start + 1);
            textarea.selectionStart = textarea.selectionEnd = start - 1;
            return;
        }
    }
    
    // Tab for indentation
    if (key === 'Tab') {
        event.preventDefault();
        
        if (start !== end) {
            // Indent/unindent selection
            const before = value.substring(0, start);
            const selected = value.substring(start, end);
            const after = value.substring(end);
            
            if (event.shiftKey) {
                // Unindent
                const lines = selected.split('\n');
                const unindented = lines.map(line => line.replace(/^  /, '')).join('\n');
                textarea.value = before + unindented + after;
                textarea.selectionStart = start;
                textarea.selectionEnd = start + unindented.length;
            } else {
                // Indent
                const lines = selected.split('\n');
                const indented = lines.map(line => '  ' + line).join('\n');
                textarea.value = before + indented + after;
                textarea.selectionStart = start;
                textarea.selectionEnd = start + indented.length;
            }
        } else {
            // Insert 2 spaces
            const before = value.substring(0, start);
            const after = value.substring(start);
            textarea.value = before + '  ' + after;
            textarea.selectionStart = textarea.selectionEnd = start + 2;
        }
        
        return;
    }
}
