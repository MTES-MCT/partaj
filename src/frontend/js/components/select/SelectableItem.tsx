import React, { useEffect } from 'react';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectableItemProps {
  children: React.ReactNode;
  option: SelectOption;
  onOptionClick: Function;
  onHover: Function;
  isSelected: boolean;
}

export const SelectableItem = ({
  children,
  option,
  onOptionClick,
  isSelected,
  onHover,
}: SelectableItemProps) => {
  useEffect(() => {}, [isSelected]);

  return (
    <li
      role="option"
      aria-selected={isSelected}
      key={option.id}
      className="flex items-center justify-start w-full space-x-2 cursor-pointer text-s px-4 py-2"
      onClick={() => {
        onOptionClick(option.id);
      }}
      onMouseEnter={() => onHover(option)}
    >
      {children}
    </li>
  );
};
