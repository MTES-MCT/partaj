import React, { PropsWithChildren, ReactNode } from 'react';

export const ReferralHeaderField: React.FC<PropsWithChildren<{
  title: string | ReactNode;
  icon: ReactNode;
  className?: string;
}>> = ({ title, icon, children, className = 'items-center' }) => {
  return (
    <>
      <div
        className={`flex space-x-2 text-gray-450 min-h-28 min-w-32 ${className}`}
      >
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </>
  );
};
