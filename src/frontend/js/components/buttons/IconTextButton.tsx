import React, { MouseEventHandler, ReactNode } from 'react';

interface IconTextButtonProps {
  children: ReactNode;
  icon: ReactNode;
  otherClasses?: string;
  testId?: string;
  onClick: MouseEventHandler;
  type?: 'submit' | 'reset' | 'button' | undefined;
}

export const IconTextButton = ({
  children,
  testId = '',
  otherClasses = 'btn-default',
  onClick,
  icon,
  type = 'button',
}: IconTextButtonProps) => {
  return (
    <button
      type={type}
      className={`btn ${otherClasses} pt-1 pb-1 pr-2 pl-2 flex items-center`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="mr-2">{icon}</div>
      {children}
    </button>
  );
};
