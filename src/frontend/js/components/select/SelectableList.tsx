import React from 'react';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  label: string;
  options: Array<SelectOption>;
  onOptionClick: Function;
  closeModal: Function;
  getOptionClass?: Function;
  selectedOption: number;
}

export const SelectableList = ({
  label,
  options,
  onOptionClick,
  selectedOption,
  getOptionClass,
  closeModal,
}: SelectProps) => {
  return (
    <ul className="select-options w-full" role="listbox" aria-label={label}>
      {options.map((option, index) => (
        <li
          role="option"
          aria-selected={selectedOption === index}
          key={option.id}
          className={`flex items-center justify-start w-full space-x-2 cursor-pointer text-s p-1 ${
            getOptionClass ? getOptionClass(option) : ''
          }`}
          onClick={() => {
            onOptionClick(option.id);
            closeModal();
          }}
        >
          {option.name}
        </li>
      ))}
    </ul>
  );
};
