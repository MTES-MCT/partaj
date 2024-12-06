import React, { MouseEventHandler, ReactNode } from 'react';

interface IconTextButtonProps {
  icon: ReactNode;
  text: string;
  otherClasses?: string;
  spanClasses?: string;
  testId?: string;
  onClick: MouseEventHandler;
  buttonRef?: any;
  type?: 'submit' | 'reset' | 'button';
}

export const IconTextButton = ({
  testId,
  otherClasses = 'btn-default',
  spanClasses = '',
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
      className={`btn space-x-1 py-1 px-2 flex items-center mr-2 ${otherClasses}`}
      onClick={onClick}
      tabIndex={0}
      data-testid={testId}
    >
      {icon}
      <span className={`${spanClasses}`}>{text}</span>
    </button>
  );
};
