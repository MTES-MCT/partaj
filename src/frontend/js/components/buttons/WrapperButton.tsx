import React, { ReactNode } from 'react';

interface WrapperButtonProps {
  children: ReactNode;
  onClick: () => void;
}

/* Component used to wrap any other component, fitting its content and converting as a button */
export const WrapperButton = ({ children, onClick }: WrapperButtonProps) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      type="button"
      className="wrapper-btn"
    >
      {children}
    </button>
  );
};
