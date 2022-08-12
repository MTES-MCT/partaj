import { UserLite } from '../../types';
import React from 'react';
import { getUserFullname } from '../../utils/user';

interface ResultItemProps {
  item: UserLite;
  onClick: (item: UserLite) => void;
}

export const ResultItem = ({ item, onClick }: ResultItemProps) => {
  return (
    <div onClick={(e) => onClick(item)} className="result-item">
      {getUserFullname(item)}
    </div>
  );
};
