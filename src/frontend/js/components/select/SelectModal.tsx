import React, { useEffect } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';

type OnKeyDown = React.PropsWithChildren<{
  onKeyDown: {
    Enter: Function;
    ArrowUp: Function;
    ArrowDown: Function;
    Close: Function;
  };
  onClickOutside: Function;
  position?: 'top' | 'bottom';
  isOptionsOpen: boolean;
}>;

export const SelectModal = ({
  onKeyDown,
  onClickOutside,
  isOptionsOpen,
  children,
  position = 'bottom',
}: OnKeyDown) => {
  const { ref } = useClickOutside({
    onClick: () => {
      onClickOutside();
    },
  });
  const style = position === 'bottom' ? { top: '36px' } : { bottom: '36px' };
  const handleListKeyDown = (e: any) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onKeyDown.Enter();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onKeyDown.ArrowUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onKeyDown.ArrowDown();
        break;
      case 'Esc':
      case 'Escape':
      case 27:
        e.preventDefault();
        onKeyDown.Close();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOptionsOpen) {
      ref.current && (ref.current as HTMLElement).focus();
    } else {
      ref.current && (ref.current as HTMLElement).blur();
    }
  }, [isOptionsOpen]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onKeyDown={handleListKeyDown}
      style={{ zIndex: 20, ...style }}
      className={`focus-visible:outline-none absolute min-w-80 shadow-select bg-white max-h-224 max-w-480 overflow-y-auto ${
        isOptionsOpen ? 'block' : 'hidden'
      }`}
    >
      {children}
    </div>
  );
};
