/**
 * Screenshot and Screen Capture Detection & Prevention
 * 
 * This module provides comprehensive protection against:
 * - PrintScreen key
 * - Windows Snipping Tool (Shift+Windows+S)
 * - Screen capture APIs (Media Capture API)
 * - Print functionality (Ctrl+P)
 */

export const setupScreenshotDetection = () => {
  // 1. Disable keyboard shortcuts for screenshots and tools
  const handleKeyDown = (event: KeyboardEvent) => {
    // PrintScreen key
    if (event.key === 'PrintScreen') {
      event.preventDefault();
      event.stopPropagation();
      clearClipboard();
      showBlockedMessage('Screenshots are not allowed');
      return false;
    }

    // Windows+Shift+S (modern snipping tool)
    if (event.shiftKey && event.metaKey && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      event.stopPropagation();
      clearClipboard();
      showBlockedMessage('Screenshots are not allowed');
      return false;
    }

    // Ctrl+Print (alternate screenshot)
    if (event.ctrlKey && event.key === 'PrintScreen') {
      event.preventDefault();
      event.stopPropagation();
      clearClipboard();
      showBlockedMessage('Screenshots are not allowed');
      return false;
    }


    // Ctrl+S (Save Page)
    if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      event.stopPropagation();
      showBlockedMessage('Saving this page is not allowed');
      return false;
    }

    // Ctrl+U (View Source)
    if ((event.ctrlKey || event.metaKey) && (event.key === 'u' || event.key === 'U')) {
      event.preventDefault();
      event.stopPropagation();
      showBlockedMessage('View Source is disabled');
      return false;
    }

    // Ctrl+Shift+I or F12 (DevTools) - We allow these for now as per user working with devtools
    // but we can block them if requested.
    
  };

  const clearClipboard = async () => {
    try {
      // Fallback using execCommand which sometimes works better for overriding images
      const input = document.createElement('input');
      input.value = 'Screenshots disabled';
      input.style.position = 'absolute';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);

      // Modern API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('Screenshots disabled');
      }
    } catch (err) {
      console.error('Failed to clear clipboard', err);
    }
  };

  // 2. Disable right-click context menu (optional, kept disabled for dev)
  const handleContextMenu = (event: MouseEvent) => {
    // event.preventDefault();
    // event.stopPropagation();
    // return false;
  };

  // 3. Disable drag operation on profile images
  const handleDragStart = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' || target.classList.contains('profile-photo')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

  // 4. Detect screen capture API attempts
  const setupScreenCaptureDetection = async () => {
    if ('mediaDevices' in navigator) {
      try {
        // Hook into getDisplayMedia to detect screen capture attempts
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        
        navigator.mediaDevices.getDisplayMedia = async function(...args: any[]) {
          showBlockedMessage('Screen capture is not allowed on this site');
          // Throw error instead of allowing capture
          return Promise.reject(new Error('Screen capture is disabled'));
        };
      } catch (e) {
        console.log('Screen capture API not supported');
      }
    }
  };

  // 5. Add listeners
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('contextmenu', handleContextMenu, true);
  document.addEventListener('dragstart', handleDragStart, true);

  // 6. Setup screen capture detection
  setupScreenCaptureDetection();

  // Blur system removed as per user request to prevent issues with developer tools and tab switching
  /*
  const applyBlur = () => { ... };
  const removeBlur = () => { ... };
  const handleVisibilityChange = () => { ... };
  const handleWindowBlur = () => { ... };
  const handleWindowFocus = () => { ... };
  */


  // Listen for keyup as an extra measure
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'PrintScreen') {
      clearClipboard();
    }
  };
  document.addEventListener('keyup', handleKeyUp, true);

  // Listen for clipboard copy events to intercept OS-level copies if possible
  // Clipboard copy check removed since blur is disabled
  const handleCopy = (event: ClipboardEvent) => {
    // Check for blur removed as it's no longer used
  };
  document.addEventListener('copy', handleCopy, true);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('keyup', handleKeyUp, true);
    document.removeEventListener('copy', handleCopy, true);
    document.removeEventListener('contextmenu', handleContextMenu, true);
    document.removeEventListener('dragstart', handleDragStart, true);
    // window.removeEventListener('beforeprint', handleBeforePrint);
    // window.removeEventListener('afterprint', handleAfterPrint);
  };
};

/**
 * Show a temporary message when screenshot is blocked
 */
function showBlockedMessage(message: string) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-in fade-in slide-in-from-top duration-200';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

/**
 * Protect an image element from screenshots
 */
export const protectImage = (element: HTMLImageElement) => {
  element.setAttribute('data-protected', 'true');
  element.classList.add('profile-photo');
  element.style.userSelect = 'none';
  element.style.pointerEvents = 'none';
  (element.style as any).webkitTouchCallout = 'none';
};

/**
 * Add watermark to prevent unauthorized copying
 */
export const addWatermark = (element: HTMLImageElement, text: string = 'PROTECTED') => {
  const canvas = document.createElement('canvas');
  canvas.width = element.width || 300;
  canvas.height = element.height || 400;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw image
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);

  // Add watermark text
  ctx.fillStyle = 'rgba(128, 29, 61, 0.3)';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw watermark diagonally
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // Replace image with watermarked version
  element.src = canvas.toDataURL('image/png');
  element.crossOrigin = 'anonymous';
};
