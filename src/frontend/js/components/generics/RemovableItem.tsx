import React, { PropsWithChildren } from 'react';
import { WrapperButton } from '../buttons/WrapperButton';
import { CloseIcon } from '../Icons';

/** Colors corresponding to theme fill into tailwind.config.js **/
export enum ItemStyle {
  DEFAULT = 'default',
}

interface RemovableItemProps {
  removeItem: () => void;
  style?: ItemStyle;
  iconClassName?: string;
  iconTitle?: string;
}

export const RemovableItem = ({
  removeItem,
  children,
  style = ItemStyle.DEFAULT,
  iconClassName,
  iconTitle,
}: PropsWithChildren<RemovableItemProps>) => {
  return (
    <div className={`removable-item removable-item--${style}`}>
      <span>{children}</span>
      <WrapperButton onClick={() => removeItem()}>
        <CloseIcon className={iconClassName} title={iconTitle} />
      </WrapperButton>
    </div>
  );
};
