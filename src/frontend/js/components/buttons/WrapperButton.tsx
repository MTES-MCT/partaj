import React, { ReactNode } from 'react';

interface WrapperButtonProps {
  children: ReactNode;
  onClick: () => void;
}

export const WrapperButton = ({ children, onClick }: WrapperButtonProps) => {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      role="button"
      className="wrapper-btn"
    >
      {children}
    </div>
  );
};
