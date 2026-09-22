// ============================================================
// hootka – useTimer Hook
// ============================================================
// Accurate countdown backed by performance.now() + rAF.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTimerOptions {
  /** Duration in seconds */
  duration: number;
  /** Called ~every 100 ms with (timeLeft, elapsed) */
  onTick?: (timeLeft: number, elapsed: number) => void;
  /** Called once when timer reaches 0 */
  onComplete?: () => void;
  /** Auto-start on mount */
  autoStart?: boolean;
}

export interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  elapsed: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer({ duration, onTick, onComplete, autoStart = false }: UseTimerOptions): UseTimerReturn {
  const onTickRef     = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onTickRef.current = onTick; },     [onTick]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const [timeLeft,    setTimeLeft]    = useState<number>(duration);
  const [isRunning,   setIsRunning]   = useState<boolean>(false);
  const [isPaused,    setIsPaused]    = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsed,     setElapsed]     = useState<number>(0);

  const rafIdRef        = useRef<number | null>(null);
  const startTsRef      = useRef<number | null>(null);
  const accumulatedRef  = useRef<number>(0);
  const lastTickRef     = useRef<number>(0);
  const durationRef     = useRef<number>(duration);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  const tick = useCallback((now: number) => {
    if (startTsRef.current === null) return;

    const runningSeconds = (now - startTsRef.current) / 1000;
    const totalElapsed   = accumulatedRef.current + runningSeconds;
    const remaining      = Math.max(0, durationRef.current - totalElapsed);

    setTimeLeft(remaining);
    setElapsed(totalElapsed);

    if (now - lastTickRef.current >= 100) {
      lastTickRef.current = now;
      onTickRef.current?.(remaining, totalElapsed);
    }

    if (remaining <= 0) {
      setIsRunning(false);
      setIsPaused(false);
      setIsCompleted(true);
      accumulatedRef.current = durationRef.current;
      startTsRef.current     = null;
      rafIdRef.current       = null;
      onCompleteRef.current?.();
      return;
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    accumulatedRef.current = 0;
    lastTickRef.current    = 0;
    startTsRef.current     = performance.now();
    setTimeLeft(durationRef.current);
    setElapsed(0);
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    if (rafIdRef.current !== null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
    if (startTsRef.current !== null) {
      accumulatedRef.current += (performance.now() - startTsRef.current) / 1000;
      startTsRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(true);
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    startTsRef.current = performance.now();
    setIsRunning(true);
    setIsPaused(false);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [isPaused, tick]);

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
    startTsRef.current     = null;
    accumulatedRef.current = 0;
    setTimeLeft(durationRef.current);
    setElapsed(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false);
  }, []);

  const reset = useCallback(() => {
    const wasRunning = isRunning;
    stop();
    if (wasRunning || autoStart) setTimeout(start, 0);
  }, [isRunning, stop, start, autoStart]);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) start();
    return () => { if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current); };
  }, []);

  return { timeLeft, isRunning, isPaused, isCompleted, elapsed, start, pause, resume, stop, reset };
}

export default useTimer;
