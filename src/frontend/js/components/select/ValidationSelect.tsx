import React from 'react';
import { BaseSelect, SelectOption } from "./BaseSelect";

export const ValidationSelect = ({options} : { options: Array<SelectOption>}) => {
  return (
    <BaseSelect options={options} />
  );
};
