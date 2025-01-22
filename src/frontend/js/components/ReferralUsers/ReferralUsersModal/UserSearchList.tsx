import React from 'react';
import { UserSearchListItem } from './UserSearchListItem';
import { UserLite } from '../../../types';

interface UserListProps {
  results: UserLite[];
}

export const UserSearchList = ({ results }: UserListProps) => {
  return (
    <div className="flex flex-col user-list overflow-y-scroll">
      {results.map((user: UserLite) => {
        return <UserSearchListItem key={user.id} user={user} />;
      })}
    </div>
  );
};
