/**
 * Result Modal
 * Displays workflow execution results in a rich modal UI
 */
class ResultModal {
  constructor() {
    this.modal = null;
    this.contentEl = null;
    this.timestampEl = null;
    this.currentData = null;
    this.init();
  }

  init() {
    this.modal = document.getElementById('result-modal');
    this.contentEl = document.getElementById('result-content');
    this.timestampEl = document.getElementById('result-timestamp');
    
    if (!this.modal) {
      console.warn('Result modal element not found');
      return;
    }

    // Close button
    const closeBtn = this.modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Copy button
    const copyBtn = document.getElementById('result-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  }

  /**
   * Show the result modal with the given data
   * @param {Object} resultData - The result data from DisplayNode
   */
  showResult(resultData) {
    if (!this.modal || !this.contentEl) {
      // Fallback to alert if modal not available
      alert(resultData.formattedOutput || JSON.stringify(resultData, null, 2));
      return;
    }

    this.currentData = resultData;

    // Set content
    this.contentEl.innerHTML = this.formatForHtml(resultData.formattedOutput);

    // Set timestamp
    if (this.timestampEl && resultData.timestamp) {
      const date = new Date(resultData.timestamp);
      this.timestampEl.textContent = date.toLocaleString('ja-JP');
      this.timestampEl.classList.remove('hidden');
    } else if (this.timestampEl) {
      this.timestampEl.classList.add('hidden');
    }

    // Show modal
    this.modal.classList.remove('hidden');
  }

  /**
   * Close the modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  /**
   * Copy the result to clipboard
   */
  async copyToClipboard() {
    if (!this.currentData) return;

    const textToCopy = this.currentData.formattedOutput || 
                       JSON.stringify(this.currentData.originalData, null, 2);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showCopyFeedback();
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      this.fallbackCopy(textToCopy);
    }
  }

  /**
   * Show visual feedback when copy is successful
   */
  showCopyFeedback() {
    const copyBtn = document.getElementById('result-copy-btn');
    if (!copyBtn) return;

    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'コピーしました！';
    copyBtn.classList.add('copied');

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
  }

  /**
   * Fallback copy method for older browsers
   */
  fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textarea);
  }

  /**
   * Format the output text for HTML display
   */
  formatForHtml(text) {
    if (!text) return '';
    
    // Escape HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');

    // Highlight URLs
    html = html.replace(
      /(https?:\/\/[^\s<]+)/g, 
      '<a href="$1" class="result-link" target="_blank" rel="noopener">$1</a>'
    );

    return html;
  }
}

// Initialize and expose globally
if (typeof window !== 'undefined') {
  window.resultModal = new ResultModal();
}
