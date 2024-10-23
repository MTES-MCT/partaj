import React, { useContext, useEffect, useRef } from 'react';
import { SelectModal } from './SelectModal';
import { SelectModalContext } from '../../data/providers/SelectModalProvider';

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
  const { onSelectedItemChange } = useContext(SelectModalContext);
  const itemRef = useRef(null);

  useEffect(() => {
    isSelected && onSelectedItemChange(itemRef);
  }, [isSelected]);

  return (
    <li
      ref={itemRef}
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
