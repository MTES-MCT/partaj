import React, { useContext, useEffect, useRef, useState } from 'react';
import { SelectModalContext } from '../../data/providers/SelectModalProvider';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectableItemProps {
  index: number;
  children: React.ReactNode;
  option: SelectOption;
  onOptionClick: Function;
  onHover: Function;
  selectedOption: { index: number; action: string };
}

export const SelectableItem = ({
  children,
  index,
  option,
  onOptionClick,
  selectedOption,
  onHover,
}: SelectableItemProps) => {
  const { onSelectedItemChange } = useContext(SelectModalContext);
  const itemRef = useRef(null);
  const [isSelected, setSelected] = useState(selectedOption.index === index);

  useEffect(() => {
    setSelected(selectedOption.index === index);

    if (
      (selectedOption?.action === 'ArrowUp' ||
        selectedOption?.action === 'ArrowDown') &&
      selectedOption.index === index
    ) {
      onSelectedItemChange(itemRef);
    }
  }, [selectedOption]);

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
      onMouseMove={() => index !== selectedOption.index && onHover(option)}
    >
      {children}
    </li>
  );
};
