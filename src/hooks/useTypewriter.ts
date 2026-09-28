import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  speed?: number;
  startDelay?: number;
}

interface UseTypewriterReturn {
  displayed: string;
  done: boolean;
}

export function useTypewriter(
  text: string,
  options?: UseTypewriterOptions
): UseTypewriterReturn {
  const speed = options?.speed ?? 38;
  const startDelay = options?.startDelay ?? 600;

  const [displayed, setDisplayed] = useState<string>('');
  const [done, setDone] = useState<boolean>(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let currentIndex = 0;
    let intervalId: NodeJS.Timeout | null = null;

    const delayTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayed(text.slice(0, currentIndex + 1));
          currentIndex++;
          if (currentIndex >= text.length) {
            setDone(true);
            if (intervalId) clearInterval(intervalId);
          }
        } else {
          setDone(true);
          if (intervalId) clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
