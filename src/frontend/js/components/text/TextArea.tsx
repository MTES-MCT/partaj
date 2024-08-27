import React, { useState } from 'react';

export const TextArea: React.FC<{
  maxLength?: number;
  cols?: number;
  rows?: number;
}> = ({ maxLength, cols = 80, rows = 5 }) => {
  const [value, setValue] = useState<string>('');

  return (
    <textarea
      className="dsfr-input-text"
      cols={cols}
      rows={rows}
      name="preliminary-work"
      value={value}
      maxLength={maxLength}
      aria-describedby={''}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
