import React, { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
}

export const SubmitButton = ({ children, className }: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      className={`btn ${
        className
          ? className
          : 'btn-primary border border-primary-500 fill-white rounded-full'
      } p-1`}
    >
      {children}
    </button>
  );
};
