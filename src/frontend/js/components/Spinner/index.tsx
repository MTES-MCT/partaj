import React from 'react';
import { useUID } from 'react-uid';

interface SpinnerProps {
  size?: 'small' | 'large';
  children: React.ReactNode;
}

/** Component. Displays a rotating CSS loader. */
export const Spinner = ({ children, size }: SpinnerProps) => {
  const uniqueID = useUID();
  return (
    <div className="spinner-container" role="status" aria-labelledby={uniqueID}>
      <div className={`spinner spinner--${size || 'small'}`} />
      <div className="offscreen" id={uniqueID}>
        {children}
      </div>
    </div>
  );
};
