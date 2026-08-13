import { useEffect, useState } from 'react';

interface TypewriterProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pause?: number;
  className?: string;
}

export function Typewriter({
  phrases,
  typingSpeed = 95,
  deletingSpeed = 45,
  pause = 1800,
  className = '',
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let timeout: number;

    if (!deleting) {
      if (text.length < current.length) {
        timeout = window.setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
      } else {
        timeout = window.setTimeout(() => setDeleting(true), pause);
      }
    } else if (text.length > 0) {
      timeout = window.setTimeout(() => setText(current.slice(0, text.length - 1)), deletingSpeed);
    } else {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
    }

    return () => window.clearTimeout(timeout);
  }, [text, deleting, index, phrases, typingSpeed, deletingSpeed, pause]);

  return (
    <span className={className}>
      <span dir="auto">{text}</span>
      <span className="animate-pulse text-gold">|</span>
    </span>
  );
}
