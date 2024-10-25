import React, { useContext, useEffect } from 'react';
import { SelectModalContext } from '../../data/providers/SelectModalProvider';

type SelectModalProps = React.PropsWithChildren<{
  position?: 'top' | 'bottom';
  isOptionsOpen: boolean;
}>;

export const SelectModal = ({
  isOptionsOpen,
  children,
  position = 'bottom',
}: SelectModalProps) => {
  const { ref, handleListKeyDown } = useContext(SelectModalContext);

  const style = position === 'bottom' ? { top: '36px' } : { bottom: '36px' };

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
      onKeyDown={handleListKeyDown}
      tabIndex={-1}
      style={{ zIndex: 20, ...style }}
      className={`focus-visible:outline-none absolute min-w-80 shadow-select bg-white max-w-480 overflow-hidden ${
        isOptionsOpen ? 'block' : 'hidden'
      }`}
    >
      {children}
    </div>
  );
};
