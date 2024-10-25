import React, { useContext, useEffect } from 'react';
import { SelectableItem } from './SelectableItem';
import { kebabCase } from 'lodash-es';
import { SelectModalContext } from '../../data/providers/SelectModalProvider';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  label: string;
  itemContent: Function;
}

export const SelectableList = ({ label, itemContent }: SelectProps) => {
  const {
    options,
    selectableListRef,
    onItemHover,
    selectedOption,
    onSelect,
  } = useContext(SelectModalContext);

  return (
    <ul
      className="relative flex flex-col selectable-list list-none bg-white w-full max-h-224 overflow-y-auto"
      role="listbox"
      aria-label={label}
      ref={selectableListRef}
    >
      {options.map((option: SelectOption, index: number) => (
        <SelectableItem
          index={index}
          key={`${kebabCase(option.id)}-${index}`}
          option={option}
          selectedOption={selectedOption}
          onOptionClick={onSelect}
          onHover={onItemHover}
        >
          {itemContent(option)}
        </SelectableItem>
      ))}
    </ul>
  );
};
