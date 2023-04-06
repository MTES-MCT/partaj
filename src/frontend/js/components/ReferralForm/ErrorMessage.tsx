import React from 'react';

interface ErrorMessageProps {
  message: string;
  icon: React.ReactNode;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  icon,
}) => {
  return (
    <div className="border-l-4  bg-danger-200 border-danger-1000  px-4 py-2 flex  items-center space-x-2">
      <div className="text-danger-1000 pr-4">{icon}</div>
      <div className="text-danger-1000">{message}</div>
    </div>
  );
};
