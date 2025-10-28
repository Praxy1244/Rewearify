// Accessibility utilities for the application

/**
 * Focus trap utility for modal dialogs
 * @param {HTMLElement} element - The element to trap focus within
 * @returns {Object} - Methods to activate and deactivate the focus trap
 */
export function createFocusTrap(element) {
  let focusableElements = [];
  
  const getFocusableElements = () => {
    return element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    
    const firstFocusableEl = focusableElements[0];
    const lastFocusableEl = focusableElements[focusableElements.length - 1];

    // If shift + tab and on first element, move to last element
    if (e.shiftKey && document.activeElement === firstFocusableEl) {
      lastFocusableEl.focus();
      e.preventDefault();
    } 
    // If tab and on last element, move to first element
    else if (!e.shiftKey && document.activeElement === lastFocusableEl) {
      firstFocusableEl.focus();
      e.preventDefault();
    }
  };

  return {
    activate: () => {
      focusableElements = Array.from(getFocusableElements());
      if (focusableElements.length) {
        focusableElements[0].focus();
      }
      element.addEventListener('keydown', handleKeyDown);
    },
    deactivate: () => {
      element.removeEventListener('keydown', handleKeyDown);
    }
  };
}

/**
 * Adds ARIA attributes to elements based on their state
 * @param {HTMLElement} element - The element to enhance
 * @param {Object} options - ARIA attributes to add
 */
export function enhanceWithAria(element, options = {}) {
  Object.entries(options).forEach(([key, value]) => {
    element.setAttribute(`aria-${key}`, value);
  });
}

/**
 * Creates an announcement for screen readers
 * @param {string} message - The message to announce
 * @param {string} priority - The announcement priority (polite or assertive)
 */
export function announce(message, priority = 'polite') {
  const announcer = document.getElementById('screen-reader-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  
  // Clear and then set to ensure announcement
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
}

function createAnnouncer() {
  const announcer = document.createElement('div');
  announcer.id = 'screen-reader-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Adds keyboard navigation to custom UI components
 * @param {HTMLElement} element - The element to enhance
 * @param {Object} options - Configuration options
 */
export function addKeyboardNavigation(element, options = {}) {
  const {
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEscape,
    onTab
  } = options;

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
        if (onEnter) {
          onEnter(e);
        }
        break;
      case ' ':
        if (onSpace) {
          onSpace(e);
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          onArrowUp(e);
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          onArrowDown(e);
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          onArrowLeft(e);
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          onArrowRight(e);
        }
        break;
      case 'Escape':
        if (onEscape) {
          onEscape(e);
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(e);
        }
        break;
      default:
        break;
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  
  return {
    cleanup: () => {
      element.removeEventListener('keydown', handleKeyDown);
    }
  };
}