import React, { useEffect } from 'react';
import { SelectableItem } from './SelectableItem';
import { kebabCase } from 'lodash-es';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  label: string;
  options: Array<SelectOption>;
  onOptionClick: Function;
  itemContent: Function;
  onItemHover: Function;
  selectedOption: number;
}

export const SelectableList = ({
  label,
  options,
  onOptionClick,
  selectedOption,
  itemContent,
  onItemHover,
}: SelectProps) => {
  return (
    <ul
      className="select-options list-none bg-white w-full"
      role="listbox"
      aria-label={label}
    >
      {options.map((option, index) => (
        <SelectableItem
          key={`${kebabCase(option.id)}-${index}`}
          option={option}
          isSelected={selectedOption === index}
          onOptionClick={onOptionClick}
          onHover={onItemHover}
        >
          {itemContent(option)}
        </SelectableItem>
      ))}
    </ul>
  );
};
