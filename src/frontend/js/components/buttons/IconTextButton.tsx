import React, {MouseEventHandler, ReactNode} from 'react';

interface IconTextButtonProps {
  children: ReactNode;
  icon: ReactNode;
  cssClass?: string;
  testId?: string;
  onClick: MouseEventHandler;
}

export const IconTextButton = (
    { children, cssClass = 'default', testId = '', onClick, icon }: IconTextButtonProps) => {
  return (
    <button
      className={`btn btn-${cssClass} border border-primary-500 fill-white rounded-full p-1 flex `}
      onClick={onClick}
      data-test-id={testId}
    >
      <div className="mr-2">
        {icon}
      </div>
      {children}
    </button>
  );
};
