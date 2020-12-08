import React, { Dispatch, SetStateAction } from 'react';

import { Nullable } from 'types/utils';

export const TabGroup: React.FC = ({ children }) => (
  <div className="flex flex-row">{children}</div>
);

interface TabProps {
  disabled?: boolean;
  name: string;
  state: [Nullable<string>, Dispatch<SetStateAction<Nullable<string>>>];
}

export const Tab: React.FC<TabProps> = ({
  children,
  disabled,
  name,
  state,
}) => {
  const [activeTab, setActiveTab] = state;

  return (
    <button
      className={`p-4 border-b-4 flex flex-row space-x-2 ${
        activeTab === name && !disabled ? 'border-blue-600 text-blue-600' : ''
      }`}
      onClick={() => {
        if (!disabled) setActiveTab(name);
      }}
    >
      {children}
    </button>
  );
};
