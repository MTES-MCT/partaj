import React, { MouseEventHandler, ReactNode } from 'react';

interface DescriptionProps {
  children: ReactNode;
}

export const DescriptionText = ({ children }: DescriptionProps) => {
  return <p className={`text-sm text-gray-500 mb-2`}>{children}</p>;
};
