import React from 'react';
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
  selectedOption: number;
}

export const SelectableList = ({
  label,
  options,
  onOptionClick,
  selectedOption,
  itemContent,
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
        >
          {itemContent(option)}
        </SelectableItem>
      ))}
    </ul>
  );
};
