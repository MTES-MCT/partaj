import React, { MouseEventHandler, ReactNode } from 'react';

interface IconTextButtonProps {
  children: ReactNode;
  icon: ReactNode;
  cssClass?: string;
  testId?: string;
  onClick: MouseEventHandler;
}

export const IconTextButton = ({
  children,
  cssClass = 'default',
  testId = '',
  onClick,
  icon,
}: IconTextButtonProps) => {
  return (
    <button
      className={`btn btn-${cssClass} rounded-sm pt-1 pb-1 pr-2 pl-2 flex items-center`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="mr-2">{icon}</div>
      {children}
    </button>
  );
};
