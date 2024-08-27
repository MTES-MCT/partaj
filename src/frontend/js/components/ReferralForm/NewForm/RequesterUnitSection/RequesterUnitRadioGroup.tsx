import React from 'react';
import { RadioGroup, RadioGroupOption } from '../../../inputs/RadioGroup';
import {RequesterUnitType} from "../../../../types";

export const RequesterUnitRadioGroup: React.FC<{
  onChange: (value: RequesterUnitType) => void;
  defaultValue: string;
}> = ({ defaultValue, onChange }) => {
  const groupId = 'form-requester-unit';
  const options: Array<RadioGroupOption> = [
    {
      name: 'Service déconcentré',
      value: 'decentralised_unit',
    },
    {
      name: 'Administration centrale',
      value: 'central_unit',
    },
  ];

  return (
    <RadioGroup
      groupId={groupId}
      onChange={(value: RequesterUnitType) => onChange(value)}
      options={options}
      defaultValue={defaultValue}
    />
  );
};
