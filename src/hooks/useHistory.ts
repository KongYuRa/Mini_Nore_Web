import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const state = history[historyIndex];

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const resolvedState = typeof newState === 'function'
      ? (newState as (prev: T) => T)(history[historyIndex])
      : newState;

    // Only add to history if state actually changed
    if (JSON.stringify(resolvedState) === JSON.stringify(history[historyIndex])) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(resolvedState);

    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setHistory(newHistory);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return { state, setState, undo, redo, canUndo, canRedo };
}
