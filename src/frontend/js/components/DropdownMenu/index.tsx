import { Spinner } from 'components/Spinner';
import React from 'react';

interface DropdownButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  isLoading?: boolean;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  className,
  isLoading,
  ...props
}) => {
  return (
    <button
      className={
        `whitespace-no-wrap flex max-w-full items-center justify-between w-full text-left px-4 py-2 text-sm ` +
        `leading-5 text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900 ` +
        `${className} ${isLoading ? 'cursor-wait' : ''}`
      }
      aria-busy={isLoading}
      aria-disabled={isLoading}
      {...props}
    >
      {props.children || null}
      {isLoading ? (
        <span aria-hidden="true">
          <Spinner size="small" />
        </span>
      ) : null}
    </button>
  );
};
