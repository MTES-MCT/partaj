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
        className ? className : ' btn-black px-2 py-1 fill-white'
      } p-1`}
    >
      {children}
    </button>
  );
};
