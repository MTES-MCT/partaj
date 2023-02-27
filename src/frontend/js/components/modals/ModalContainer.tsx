import React, { PropsWithChildren } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';

export enum ModalSize {
  L = '512',
  XL = '800',
  XXL = '800',
}

export enum OverlayColor {
  DEFAULT = 'bg-gray-transparent-70p',
  TRANSPARENT = 'bg-transparent',
}

export const ModalContainer: React.FC<PropsWithChildren<{
  isModalOpen: boolean;
  size: ModalSize;
  color?: OverlayColor;
  style?: any;
  setModalOpen: Function;
  modalIdentifier?: string;
}>> = ({
  isModalOpen,
  size = ModalSize.L,
  color = OverlayColor.DEFAULT,
  style,
  setModalOpen,
  modalIdentifier = 'default',
  children,
}) => {
  const { ref } = useClickOutside({
    onClick: () => setModalOpen(false),
  });

  return (
    <div
      data-testid={`modal-${modalIdentifier}`}
      className={`${
        isModalOpen ? 'fixed' : 'hidden'
      } ${color} inset-0 z-19 flex justify-center items-center`}
      style={{ margin: 0 }}
    >
      <div
        ref={ref}
        className={`z-20 rounded overflow-auto bg-white w-full max-w-${size} max-h-9/10`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
};
