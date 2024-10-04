import React, { useState } from 'react';

export const InputText: React.FC<{
  placeholder?: string;
  hasError?: boolean;
}> = ({ placeholder = '', hasError = false }) => {
  const [value, setValue] = useState<string>('');

  return (
    <input
      placeholder={placeholder}
      className={`dsfr-input-text ${hasError ? 'dsfr-input-text-error' : ''}`}
      name="preliminary-work"
      type="text"
      value={value}
      aria-describedby={''}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
