import React from 'react';
import { UserLite } from '../../../types';
import { getNotificationName } from '../../../utils/user';
import { ItemStyle, RemovableItem } from '../../generics/RemovableItem';

interface NotificationListProps {
  notifications: UserLite[];
  removeItem: (item: UserLite) => void;
}

export const NotificationList = ({
  notifications,
  removeItem,
}: NotificationListProps) => {
  return (
    <div className="flex p-2">
      {notifications.map((item: UserLite) => {
        return (
          <RemovableItem
            removeItem={() => removeItem(item)}
            style={ItemStyle.NOTIFICATIONS}
            key={item.id}
          >
            {getNotificationName(item)}
          </RemovableItem>
        );
      })}
    </div>
  );
};
