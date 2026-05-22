import { useCallback, useEffect } from 'react';

/**
 * Props for the keyboard navigation hook.
 */
interface UseKeyboardFormNavigationProps {
    /** Ref to the form or container element */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Optional callback when Enter is pressed on the last field */
    onSubmitLastField?: () => void;
    /** Selector for focusable elements. Defaults to standard form inputs. */
    focusableSelector?: string;
}

/**
 * useKeyboardFormNavigation
 * 
 * A custom hook to implement "Enter as Tab" behavior in forms.
 * - Enter: Move to next field
 * - Shift + Enter: Move to previous field
 * - Prevents default browser behavior (form submission) until the last field
 * 
 * @param props - Configuration for the hook
 */
export const useKeyboardFormNavigation = ({
    containerRef,
    onSubmitLastField,
    focusableSelector = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([type="submit"]), [tabindex]:not([tabindex="-1"])'
}: UseKeyboardFormNavigationProps) => {
    
    /**
     * Handles the keydown event within the container.
     * What it does: Intercepts Enter and Shift+Enter to manage focus.
     * Why it is used: Enhances accessibility and data entry speed.
     * Edge cases: 
     * - Textareas are excluded from Enter-to-next to allow new lines.
     * - Disabled elements are skipped.
     * - Submit buttons are handled by the browser.
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // We only care about Enter key
        if (e.key !== 'Enter') return;
        
        const target = e.target as HTMLElement;
        
        // Don't override standard Enter behavior for textareas (allow new lines)
        if (target.tagName === 'TEXTAREA') return;

        // Skip if it's a submit button 
        if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') return;

        // Prevent default submission
        e.preventDefault();

        // Get all focusable elements in the container
        const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(focusableSelector);

        if (!focusableElements || focusableElements.length === 0) return;

        // Convert NodeList to Array for indexing
        const elements = Array.from(focusableElements);
        
        // Find current element index. If the target is a child of a focusable element (like a span in a button),
        // we find the closest focusable element.
        const currentFocusable = target.closest(focusableSelector) as HTMLElement || target;
        const currentIndex = elements.indexOf(currentFocusable);

        if (e.shiftKey) {
            // MOVE PREVIOUS: Shift + Enter
            if (currentIndex > 0) {
                elements[currentIndex - 1]?.focus();
            }
        } else {
            // MOVE NEXT: Enter
            if (currentIndex < elements.length - 1) {
                elements[currentIndex + 1]?.focus();
            } else if (onSubmitLastField) {
                // If it's the last field, trigger submit callback
                onSubmitLastField();
            }
        }
    }, [containerRef, onSubmitLastField, focusableSelector]);

    // Attach listener to the container
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }
    }, [containerRef, handleKeyDown]);
};

export default useKeyboardFormNavigation;
