import { useRef, useEffect } from 'react';
import { createFocusTrap, enhanceWithAria, announce, addKeyboardNavigation } from '../lib/accessibility';

/**
 * Hook for managing accessibility features in components
 */
export function useAccessibility() {
  const focusTrapRef = useRef(null);
  
  /**
   * Set up a focus trap on a specific element
   * @param {HTMLElement} element - The element to trap focus within
   * @param {boolean} active - Whether the focus trap should be active
   */
  const setupFocusTrap = (element, active = true) => {
    if (!element) return;
    
    if (focusTrapRef.current) {
      focusTrapRef.current.deactivate();
    }
    
    const trap = createFocusTrap(element);
    focusTrapRef.current = trap;
    
    if (active) {
      trap.activate();
    }
    
    return trap;
  };
  
  /**
   * Clean up focus trap on unmount
   */
  useEffect(() => {
    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, []);
  
  /**
   * Make an announcement for screen readers
   * @param {string} message - The message to announce
   * @param {string} priority - The announcement priority (polite or assertive)
   */
  const makeAnnouncement = (message, priority = 'polite') => {
    announce(message, priority);
  };
  
  /**
   * Add keyboard navigation to an element
   * @param {HTMLElement} element - The element to enhance
   * @param {Object} options - Keyboard handlers
   */
  const setupKeyboardNavigation = (element, options = {}) => {
    if (!element) return { cleanup: () => {} };
    
    return addKeyboardNavigation(element, options);
  };
  
  return {
    setupFocusTrap,
    makeAnnouncement,
    setupKeyboardNavigation,
    enhanceWithAria
  };
}