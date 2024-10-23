import React, { useEffect, useState } from 'react';

export const InputText: React.FC<{
  placeholder?: string;
  hasError?: boolean;
  defaultValue: string;
  onDebounce?: Function;
  id: string;
}> = ({ placeholder = '', hasError = false, id, onDebounce, defaultValue }) => {
  const [bufferedValue, setBufferedValue] = useState<string>(defaultValue);
  const [value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    const pollForChange = setInterval(() => {
      if (value !== bufferedValue) {
        setBufferedValue(value);
        onDebounce?.(value);
      }
    }, 500);

    return () => {
      clearInterval(pollForChange);
    };
  }, [value, bufferedValue]);

  return (
    <input
      id={id}
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
