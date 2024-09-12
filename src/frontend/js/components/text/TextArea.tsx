import React, { useContext, useEffect, useRef, useState } from 'react';
import { ReferralContext } from '../../data/providers/ReferralProvider';

export const TextArea: React.FC<{
  maxLength?: number;
  cols?: number;
  rows?: number;
  defaultValue: string;
  onDebounce?: Function
}> = ({ maxLength, cols = 80, rows = 5, onDebounce, defaultValue }) => {
  const [bufferedValue, setBufferedValue] = useState<string>(defaultValue);
  const [value, setValue] = useState<string>(defaultValue);
  const ref = useRef(null);

  useEffect(() => {
    const pollForChange = setInterval(() => {
      if (value !== bufferedValue) {
        setBufferedValue(value);
        onDebounce && onDebounce(value);
      }
    }, 500);

    return () => {
      clearInterval(pollForChange);
    };
  }, [value, bufferedValue]);

  return (
    <textarea
      className="dsfr-input-text"
      ref={ref}
      cols={cols}
      rows={rows}
      name="preliminary-work"
      value={value}
      maxLength={maxLength}
      aria-describedby={''}
      onChange={(e) => {
        console.log("TIEPSSSSSS")
        setValue(e.target.value)}
      }
    />
  );
};
