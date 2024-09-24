import React, { useState } from 'react';

export const InputText: React.FC<{
  placeholder?: string;
  onChange: Function;
}> = ({ placeholder = '', onChange }) => {
  const [value, setValue] = useState<string>('');

  return (
    <input
      placeholder={placeholder}
      className="dsfr-input-text"
      name="preliminary-work"
      type="text"
      value={value}
      aria-describedby={''}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
