import React, { ReactNode } from 'react';

interface SubmitButtonProps {
  children: ReactNode;
}

export const SubmitButton = ({ children }: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      className="btn btn-primary border border-primary-500 fill-white rounded-full p-1"
    >
      {children}
    </button>
  );
};
