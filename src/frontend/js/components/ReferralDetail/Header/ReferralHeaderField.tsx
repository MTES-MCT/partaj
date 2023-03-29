import React, { PropsWithChildren, ReactNode } from 'react';

export const ReferralHeaderField: React.FC<PropsWithChildren<{
  title: string;
  icon: ReactNode;
}>> = ({ title, icon, children }) => {
  return (
    <>
      <div className="flex items-center space-x-2 text-grey-500 min-h-28 w-32">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </>
  );
};
