import React, { PropsWithChildren } from 'react';
import { WrapperButton } from '../buttons/WrapperButton';
import { CloseIcon } from '../Icons';

/** Colors corresponding to theme fill into tailwind.config.js **/
export enum ItemStyle {
  DEFAULT = 'default',
  NOTIFICATIONS = 'notifications',
  NOTES = 'note-filter',
}

interface RemovableItemProps {
  removeItem: () => void;
  style?: ItemStyle;
  iconSize?: number;
}

export const RemovableItem = ({
  removeItem,
  children,
  style = ItemStyle.DEFAULT,
  iconSize = 4,
}: PropsWithChildren<RemovableItemProps>) => {
  return (
    <div className={`removable-item removable-item--${style}`}>
      <div>{children}</div>
      <WrapperButton onClick={() => removeItem()}>
        <CloseIcon size={iconSize} />
      </WrapperButton>
    </div>
  );
};
