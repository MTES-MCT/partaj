import React from 'react';
import { useUID } from 'react-uid';

interface SpinnerProps {
  'aria-hidden'?: boolean;
  className?: string;
  color?: string;
  size?: 'small' | 'large';
}

/** Component. Displays a rotating CSS loader. */
export const Spinner: React.FC<SpinnerProps> = (props) => {
  const { children, className, color, size } = props;
  const ariaHidden = props['aria-hidden'] || false;

  const uniqueID = useUID();
  const spinnerStyle = color
    ? { borderTopColor: color, borderLeftColor: color }
    : {};

  return (
    <div
      className={`spinner-container ${className}`}
      role="status"
      aria-labelledby={uniqueID}
      aria-hidden={ariaHidden}
    >
      <div
        className={`spinner spinner--${size || 'small'}`}
        style={spinnerStyle}
      />
      <div className="offscreen" id={uniqueID}>
        {children}
      </div>
    </div>
  );
};
