import { useEffect, useRef } from 'react';

import { Nullable } from 'types/utils';

export const useClickOutside = (onClick: Function) => {
  const ref = useRef<Nullable<HTMLElement>>(null);

  const handleEvent: EventListener = (event) => {
    if (ref && ref.current) {
      if (!ref.current.contains(event.target as Nullable<HTMLElement>)) {
        onClick();
      }
    }
  };

  useEffect(() => {
    if (window.PointerEvent) {
      document.addEventListener('pointerdown', handleEvent);
    } else {
      document.addEventListener('mousedown', handleEvent);
      document.addEventListener('touchstart', handleEvent);
    }

    return () => {
      if (window.PointerEvent) {
        document.removeEventListener('pointerdown', handleEvent);
      } else {
        document.removeEventListener('mousedown', handleEvent);
        document.removeEventListener('touchstart', handleEvent);
      }
    };
  }, []);

  return { ref };
};
