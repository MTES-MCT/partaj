import React, { useEffect, useState } from 'react';
import { RadioButton } from '../buttons/RadioButton';
import { kebabCase } from 'lodash-es';
import { getIndexOf } from '../../utils/array';

export interface RadioGroupOption {
  name: string;
  value: string;
}

export interface SelectedOption {
  index: number;
  focus: number;
}

export const RadioGroup: React.FC<{
  groupId: string;
  options: Array<RadioGroupOption>;
  defaultValue?: string;
  onChange: (value: any) => void;
}> = ({ options, defaultValue = '', groupId, onChange }) => {
  const initialOption = getIndexOf(
    defaultValue,
    options.map((a) => a.value),
  );
  const [selectedOption, setSelectedOption] = useState<SelectedOption>({
    index: initialOption,
    focus: 0,
  });

  useEffect(() => {
    selectedOption.index != -1 && onChange(options[selectedOption.index].value);
  }, [selectedOption]);

  const onClick = (index: number, value: string) => {
    setSelectedOption({ index, focus: 0 });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    switch (key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        setSelectedOption((prevState) => {
          const newIndex =
            prevState.index - 1 >= 0 ? prevState.index - 1 : options.length - 1;
          return {
            index: newIndex,
            focus: 1,
          };
        });
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedOption((prevState) => {
          const newIndex =
            prevState.index == options.length - 1 ? 0 : prevState.index + 1;
          return {
            index: newIndex,
            focus: 1,
          };
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex space-x-4">
      {options.map((option: RadioGroupOption, index: number) => (
        <RadioButton
          key={`option-${kebabCase(option.name)}-${kebabCase(option.value)}`}
          groupName={groupId}
          name={option.name}
          value={option.value}
          isSelected={selectedOption.index === index}
          isFocused={
            selectedOption.index === index && selectedOption.focus === 1
          }
          onClick={(value: string) => onClick(index, value)}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );
};
