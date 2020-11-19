import React, { useState } from 'react';

import { Spinner } from 'components/Spinner';
import { Nullable } from 'types/utils';
import { useClickOutside } from 'utils/useClickOutside';

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

interface DropdownMenuProps {
  buttonContent: React.ReactNode;
  buttonTitleId: string;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  buttonContent,
  buttonTitleId,
  children,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { ref } = useClickOutside(() => setShowDropdown(false));

  return (
    <div
      className="ml-3 relative self-start"
      ref={ref as React.MutableRefObject<Nullable<HTMLDivElement>>}
    >
      {/* The button that opens/closes the dropdown. */}
      <button
        className={
          `block rounded shadow-sm px-4 py-2 border focus:border-blue-300 focus:shadow-outline-blue ` +
          `transition ease-in-out duration-150 ${
            showDropdown
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 text-gray-600'
          }`
        }
        type="button"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-labelledby={buttonTitleId}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {buttonContent}
      </button>

      {showDropdown ? (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded shadow-lg">
          <div className="rounded bg-white shadow-xs">
            {/* The actual dropdown menu content. */}
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
};
