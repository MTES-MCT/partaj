import React, { MouseEventHandler, ReactNode } from 'react';

interface IconTextButtonProps {
  icon: ReactNode;
  text: string;
  otherClasses?: string;
  testId?: string;
  onClick: MouseEventHandler;
  buttonRef?: any;
  type?: 'submit' | 'reset' | 'button';
}

export const IconTextButton = ({
  testId,
  otherClasses = 'btn-default',
  onClick,
  icon,
  text,
  type = 'button',
  buttonRef,
}: IconTextButtonProps) => {
  return (
    <button
      ref={buttonRef}
      type={type}
      className={`btn ${otherClasses} space-x-1 pt-1 pb-1 pr-2 pl-2 flex items-center mr-2`}
      onClick={onClick}
      tabIndex={0}
      data-testid={testId}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
