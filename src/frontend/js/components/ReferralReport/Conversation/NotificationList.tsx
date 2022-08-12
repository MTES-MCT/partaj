import React from 'react';
import { NotificationItem } from './NotificationItem';
import { UserLite } from '../../../types';

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
        return <NotificationItem removeItem={removeItem} item={item} />;
      })}
    </div>
  );
};
