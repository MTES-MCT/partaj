import React from 'react';
import { getNotificationName } from '../../../utils/user';
import { UserLite } from '../../../types';
import { CloseIcon } from '../../Icons';
import { WrapperButton } from '../../buttons/WrapperButton';

interface NotificationItemProps {
  item: UserLite;
  removeItem: (item: UserLite) => void;
}

export const NotificationItem = ({
  item,
  removeItem,
}: NotificationItemProps) => {
  return (
    <div className="notification-item">
      <div>{getNotificationName(item)}</div>
      <WrapperButton onClick={() => removeItem(item)}>
        <CloseIcon />
      </WrapperButton>
    </div>
  );
};
