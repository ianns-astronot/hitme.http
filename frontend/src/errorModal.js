// Error Modal Component

let errorModalVisible = false;

export function showErrorModal(title, message, details = null) {
    errorModalVisible = true;
    
    const modal = document.createElement('div');
    modal.className = 'error-modal-overlay';
    modal.innerHTML = `
        <div class="error-modal">
            <div class="error-modal-header">
                <span class="error-icon">⚠️</span>
                <h3>${escapeHtml(title)}</h3>
                <button class="error-modal-close" onclick="window.closeErrorModal()">×</button>
            </div>
            <div class="error-modal-body">
                <p>${escapeHtml(message)}</p>
                ${details ? `
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <pre>${escapeHtml(details)}</pre>
                    </details>
                ` : ''}
            </div>
            <div class="error-modal-footer">
                <button class="btn-primary" onclick="window.closeErrorModal()">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeErrorModal();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeErrorModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

export function closeErrorModal() {
    const modal = document.querySelector('.error-modal-overlay');
    if (modal) {
        modal.remove();
    }
    errorModalVisible = false;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export to window for onclick handlers
window.closeErrorModal = closeErrorModal;
