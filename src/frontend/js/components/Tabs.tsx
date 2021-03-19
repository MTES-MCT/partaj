import React, { Dispatch, SetStateAction } from 'react';

import { Nullable } from 'types/utils';

interface TabProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  disabled?: boolean;
  name: string;
  state: [Nullable<string>, Dispatch<SetStateAction<Nullable<string>>>];
}

export const Tab: React.FC<TabProps> = ({
  children,
  className = '',
  disabled,
  name,
  state,
  ...restProps
}) => {
  const [activeTab, setActiveTab] = state;

  return (
    <button
      className={`tab space-x-2 ${
        activeTab === name && !disabled
          ? 'border-primary-500 text-primary-500'
          : ''
      } ${className}`}
      onClick={() => {
        if (!disabled) setActiveTab(name);
      }}
      {...restProps}
    >
      {children}
    </button>
  );
};
