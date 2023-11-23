import React, { PropsWithChildren, ReactNode } from 'react';

export const ReferralHeaderField: React.FC<PropsWithChildren<{
  title: string;
  icon: ReactNode;
}>> = ({ title, icon, children }) => {
  return (
    <>
      <div className="flex items-center space-x-2 text-gray-450 min-h-28 min-w-32">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </>
  );
};
