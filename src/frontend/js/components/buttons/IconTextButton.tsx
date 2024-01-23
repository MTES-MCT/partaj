import React, { MouseEventHandler, ReactNode } from 'react';

interface IconTextButtonProps {
  children: ReactNode;
  icon: ReactNode;
  otherClasses?: string;
  testId?: string;
  onClick: MouseEventHandler;
  buttonRef?: any;
  type?: 'submit' | 'reset' | 'button';
}

export const IconTextButton = ({
  children,
  testId,
  otherClasses = 'btn-default',
  onClick,
  icon,
  type = 'button',
  buttonRef,
}: IconTextButtonProps) => {
  return (
    <button
      ref={buttonRef}
      type={type}
      className={`btn ${otherClasses} pt-1 pb-1 pr-2 pl-2 flex items-center`}
      onClick={onClick}
      tabIndex={0}
      data-testid={testId}
    >
      <div className="mr-2">{icon}</div>
      {children}
    </button>
  );
};
