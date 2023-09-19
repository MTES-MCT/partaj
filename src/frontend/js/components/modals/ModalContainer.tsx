import React, { PropsWithChildren } from 'react';

import { CrossIcon } from 'components/Icons';
import { useClickOutside } from '../../utils/useClickOutside';

export enum ModalSize {
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
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
  withCloseButton?: boolean;
}>> = ({
  isModalOpen,
  size = ModalSize.L,
  color = OverlayColor.DEFAULT,
  style,
  setModalOpen,
  modalIdentifier = 'default',
  withCloseButton = false,
  children,
}) => {
  const { ref } = useClickOutside({
    onClick: () => setModalOpen(false),
  });

  const maxWidthVariants = {
    L: 'max-w-512',
    XL: 'max-w-800',
    XXL: 'max-w-800',
  };

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
        className={`relative z-20 rounded overflow-auto bg-white w-full max-h-9/10 ${maxWidthVariants[size]}`}
        style={style}
      >
        {withCloseButton && (
          <div className="absolute top-0 right-0 p-3">
            <button
              aria-labelledby={'close'}
              className={`p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700`}
              onClick={(e) => {
                e.preventDefault();
                setModalOpen(false);
              }}
            >
              <CrossIcon className="w-6 h-6" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
