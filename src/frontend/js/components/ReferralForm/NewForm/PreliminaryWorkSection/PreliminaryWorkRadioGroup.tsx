import React from 'react';
import { RadioGroup, RadioGroupOption } from '../../../inputs/RadioGroup';

export const PreliminaryWorkRadioGroup: React.FC<{
  onChange: (value: string) => void;
  defaultValue?: string;
}> = ({ onChange, defaultValue }) => {
  const groupId = 'form-preliminary-work';
  const options: Array<RadioGroupOption> = [
    {
      name: 'Oui',
      value: 'yes',
    },
    {
      name: 'Non',
      value: 'no',
    },
  ];

  return (
    <>
      <RadioGroup
        defaultValue={defaultValue}
        groupId={groupId}
        onChange={(value: string) => onChange(value)}
        options={options}
      />
    </>
  );
};
