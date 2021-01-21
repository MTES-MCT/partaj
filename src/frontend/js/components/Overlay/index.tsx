import React, { useEffect, useState } from 'react';

interface OverlayProps {
  Close: React.FC;
  isOpen: boolean;
  onClick: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ Close, isOpen, onClick }) => {
  /**
   * Manage the hidden & opacity classes in a useEffect with timers to make sure
   * the user actually sees the opacity animation.
   */
  const [isHidden, setIsHidden] = useState(!isOpen);
  const [isOpacityZero, setIsOpacityZero] = useState(!isOpen);

  useEffect(() => {
    if (isOpen && isHidden && isOpacityZero) {
      setIsHidden(false);
      const timeout = setTimeout(() => setIsOpacityZero(false), 50);
      return () => clearTimeout(timeout);
    }

    if (!isOpen && !isHidden && !isOpacityZero) {
      setIsOpacityZero(true);
      const timeout = setTimeout(() => setIsHidden(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return (
    <div
      className={`absolute inset-0 bg-black cursor-pointer lg:hidden ${
        isOpacityZero ? 'opacity-0' : 'opacity-75'
      } ${isHidden ? 'hidden' : 'visible'} transition duration-500 ease-in-out`}
      onClick={onClick}
    >
      <Close />
    </div>
  );
};
