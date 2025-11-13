import { useRef, useCallback, useState } from 'react';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
}

export interface UseDragAndDropOptions {
  onDragStart?: (e: PointerEvent) => void;
  onDragMove?: (state: DragState, e: PointerEvent) => void;
  onDragEnd?: (state: DragState, e: PointerEvent) => void;
  dragThreshold?: number; // Minimum distance to start dragging
  longPressDuration?: number; // Duration for long press in ms
  disabled?: boolean;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    dragThreshold = 5,
    longPressDuration = 200,
    disabled = false,
  } = options;

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasDragStartedRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Mark that pointer is down
      isPointerDownRef.current = true;

      // Capture pointer for smooth tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const rect = e.currentTarget.getBoundingClientRect();
      dragStateRef.current = {
        isDragging: false,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };

      hasDragStartedRef.current = false;

      // Start long press timer for touch devices
      if (e.pointerType === 'touch' && longPressDuration > 0) {
        longPressTimerRef.current = setTimeout(() => {
          if (!hasDragStartedRef.current) {
            triggerHapticFeedback('light');
          }
        }, longPressDuration);
      }
    },
    [disabled, longPressDuration]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Only process move if pointer is actually down (prevents hover from triggering)
      if (!isPointerDownRef.current) return;

      const state = dragStateRef.current;
      state.currentX = e.clientX;
      state.currentY = e.clientY;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Start dragging if threshold is exceeded
      if (!state.isDragging && distance > dragThreshold) {
        state.isDragging = true;
        setIsDragging(true);
        hasDragStartedRef.current = true;

        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        if (onDragStart) {
          onDragStart(e.nativeEvent);
        }

        triggerHapticFeedback('light');
      }

      if (state.isDragging && onDragMove) {
        onDragMove(state, e.nativeEvent);
      }
    },
    [disabled, dragThreshold, onDragStart, onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Mark that pointer is no longer down
      isPointerDownRef.current = false;

      // Release pointer capture
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const state = dragStateRef.current;

      if (state.isDragging) {
        if (onDragEnd) {
          onDragEnd(state, e.nativeEvent);
        }
        triggerHapticFeedback('medium');
      }

      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      hasDragStartedRef.current = false;
    },
    [disabled, onDragEnd]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Mark that pointer is no longer down
      isPointerDownRef.current = false;

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const state = dragStateRef.current;

      if (state.isDragging) {
        if (onDragEnd) {
          onDragEnd(state, e.nativeEvent);
        }
      }

      setIsDragging(false);
      dragStateRef.current.isDragging = false;
      hasDragStartedRef.current = false;
    },
    [disabled, onDragEnd]
  );

  return {
    isDragging,
    dragState: dragStateRef.current,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}

// Haptic feedback utility
export function triggerHapticFeedback(
  intensity: 'light' | 'medium' | 'heavy' = 'medium'
) {
  if (!navigator.vibrate) return;

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  navigator.vibrate(patterns[intensity]);
}
