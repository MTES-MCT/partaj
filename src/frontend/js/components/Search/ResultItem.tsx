import { UserLite } from '../../types';
import React from 'react';
import { getUserFullname } from '../../utils/user';

interface ResultItemProps {
  item: UserLite;
  onClick: (item: UserLite) => void;
  isSelected: boolean;
}

export const ResultItem = ({ item, onClick, isSelected }: ResultItemProps) => {
  return (
    <div
      onClick={(e) => onClick(item)}
      className={`result-item`}
      role="option"
      aria-selected={isSelected}
    >
      {getUserFullname(item)}
    </div>
  );
};
