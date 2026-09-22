// ============================================================
// hootka – useKeyboardShortcuts Hook
// ============================================================

import { useEffect, useRef } from 'react';

export type ShortcutMap = Record<string, () => void>;

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (INPUT_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return false;
}

function eventToKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const key = e.key === ' ' ? 'Space' : e.key;
  parts.push(key);
  return parts.join('+');
}

/**
 * Globally binds keyboard shortcuts for the lifetime of the calling component.
 * Shortcuts are silently ignored when focus is inside an input/textarea/select.
 *
 * Keys use the KeyboardEvent.key convention.
 * Modifiers are prefixed: 'Ctrl+', 'Shift+', 'Alt+'.
 *
 * @example
 * useKeyboardShortcuts({
 *   Space:      () => togglePause(),
 *   Enter:      () => confirm(),
 *   ArrowRight: () => nextQuestion(),
 *   Escape:     () => exitGame(),
 *   '1':        () => selectTeam(0),
 * });
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const shortcutsRef = useRef<ShortcutMap>(shortcuts);
  useEffect(() => { shortcutsRef.current = shortcuts; }, [shortcuts]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (isEditableTarget(e.target)) return;
      const key = eventToKey(e);
      const handler = shortcutsRef.current[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);
}

/** Convenience key name constants */
export const Keys = {
  Space:      'Space',
  Enter:      'Enter',
  Escape:     'Escape',
  ArrowRight: 'ArrowRight',
  ArrowLeft:  'ArrowLeft',
  ArrowUp:    'ArrowUp',
  ArrowDown:  'ArrowDown',
  Tab:        'Tab',
  Team1: '1', Team2: '2', Team3: '3',
  Team4: '4', Team5: '5', Team6: '6',
  Team7: '7', Team8: '8', Team9: '9',
} as const;

export default useKeyboardShortcuts;
