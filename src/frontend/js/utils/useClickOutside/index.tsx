import { useEffect, useRef } from 'react';

import { Nullable } from 'types/utils';

export const useClickOutside = ({
  onClick,
  ref,
  insideRef,
}: {
  onClick: Function;
  ref?: any;
  insideRef?: any;
}) => {
  ref = useRef<Nullable<HTMLDivElement>>(ref);

  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  const handleEvent: EventListener = (event) => {
    if (ref && ref.current) {
      if (!ref.current.contains(event.target as Nullable<HTMLElement>)) {
        if (
          !insideRef ||
          !insideRef.current ||
          !insideRef.current.contains(event.target as Nullable<HTMLElement>)
        ) {
          onClickRef.current();
        }
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
