import React from 'react';
import { BaseSelect, SelectOption } from './BaseSelect';
import { ValidationIcon } from '../Icons';

export const ValidationSelect = ({
  options,
}: {
  options: Array<SelectOption>;
}) => {
  return (
    <>
      {
        <BaseSelect options={options} buttonCss="btn-outline" height={320}>
          <ValidationIcon className="fill-black" />
          <span>Validation</span>
        </BaseSelect>
      }
    </>
  );
};
