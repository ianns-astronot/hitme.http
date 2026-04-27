// Modal System for HitMe HTTP

// Show error modal
export function showErrorModal(title, message) {
    return showModal({
        type: 'error',
        title: title,
        message: message,
        buttons: [
            { text: 'OK', type: 'primary', action: 'close' }
        ]
    });
}

// Show success modal
export function showSuccessModal(message) {
    return showModal({
        type: 'success',
        title: 'Success',
        message: message,
        buttons: [
            { text: 'OK', type: 'primary', action: 'close' }
        ],
        autoClose: 2000
    });
}

// Show confirm modal
export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        showModal({
            type: 'confirm',
            title: title,
            message: message,
            buttons: [
                { text: 'Cancel', type: 'secondary', action: () => resolve(false) },
                { text: 'Confirm', type: 'danger', action: () => resolve(true) }
            ]
        });
    });
}

// Show input modal (prompt replacement)
export function showInputModal(title, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
        showModal({
            type: 'input',
            title: title,
            placeholder: placeholder,
            defaultValue: defaultValue,
            buttons: [
                { text: 'Cancel', type: 'secondary', action: () => resolve(null) },
                { text: 'OK', type: 'primary', action: 'submit' }
            ],
            onSubmit: (value) => resolve(value)
        });
    });
}

// Generic modal function
function showModal(config) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = `modal modal-${config.type}`;
    
    // Create modal header
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const icon = document.createElement('span');
    icon.className = `modal-icon ${config.type}`;
    icon.innerHTML = getIcon(config.type);
    
    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = config.title;
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Create modal body
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    if (config.type === 'input') {
        // Create input field for input modal
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'modal-input';
        input.placeholder = config.placeholder || '';
        input.value = config.defaultValue || '';
        input.id = 'modal-input-field';
        
        // Focus input after modal is shown
        setTimeout(() => input.focus(), 100);
        
        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (config.onSubmit) {
                    config.onSubmit(input.value);
                    closeModal(overlay);
                }
            } else if (e.key === 'Escape') {
                closeModal(overlay);
            }
        });
        
        body.appendChild(input);
    } else {
        // Create message paragraph for other modals
        const message = document.createElement('p');
        message.className = 'modal-message';
        message.textContent = config.message;
        body.appendChild(message);
    }
    
    // Create modal footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    config.buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `modal-btn modal-btn-${btn.type}`;
        button.textContent = btn.text;
        button.onclick = () => {
            if (btn.action === 'close') {
                closeModal(overlay);
            } else if (btn.action === 'submit') {
                // Handle submit for input modal
                const input = document.getElementById('modal-input-field');
                if (input && config.onSubmit) {
                    config.onSubmit(input.value);
                }
                closeModal(overlay);
            } else if (typeof btn.action === 'function') {
                btn.action();
                closeModal(overlay);
            }
        };
        footer.appendChild(button);
    });
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.classList.add('modal-show');
    }, 10);
    
    // Auto close if specified
    if (config.autoClose) {
        setTimeout(() => {
            closeModal(overlay);
        }, config.autoClose);
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
    
    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(overlay);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeModal(overlay) {
    overlay.classList.remove('modal-show');
    setTimeout(() => {
        overlay.remove();
    }, 300);
}

function getIcon(type) {
    const icons = {
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="9 12 11 14 15 10"></polyline>
        </svg>`,
        confirm: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`
    };
    return icons[type] || icons.info;
}
