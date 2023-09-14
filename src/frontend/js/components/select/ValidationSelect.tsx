import React from 'react';
import { BaseSelect, SelectOption } from './BaseSelect';
import { IconColor, ValidationIcon } from '../Icons';

export const ValidationSelect = ({
  options,
}: {
  options: Array<SelectOption>;
}) => {
  return (
    <>
      {
        <BaseSelect options={options} buttonCss="btn-outline" height={320}>
          <ValidationIcon color={IconColor.BLACK} />
          <span>Validation</span>
        </BaseSelect>
      }
    </>
  );
};