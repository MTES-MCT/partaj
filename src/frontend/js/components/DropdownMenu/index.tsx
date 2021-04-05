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

interface DropdownOpenButtonProps {
  showDropdown: boolean;
}

export const DropdownOpenButton: React.FC<DropdownOpenButtonProps> = ({
  children,
  showDropdown,
  ...props
}) => {
  return (
    <button
      {...props}
      className={
        `block rounded shadow-sm px-4 py-2 border focus:border-primary-300 focus:shadow-outline-blue ` +
        `transition ease-in-out duration-150 ${
          showDropdown
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'bg-white border-gray-300 text-gray-500'
        }`
      }
    >
      {children}
    </button>
  );
};

export const useDropdownMenu = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { ref } = useClickOutside(() => setShowDropdown(false));

  const buttonProps = {
    'aria-haspopup': true,
    'aria-expanded': showDropdown,
    onClick: () => setShowDropdown(!showDropdown),
  };

  const getButtonProps = () => buttonProps;

  const getDropdownButtonProps = () => ({
    ...buttonProps,
    showDropdown,
  });

  const getDropdownContainer = (
    children: React.ReactNode,
    props?: React.ComponentProps<'div'>,
  ) => {
    const { className = '', ...restProps } = props || {};
    return showDropdown ? (
      <div
        className={`origin-top-right absolute right-0 mt-2 w-64 rounded shadow-lg overflow-hidden ${className}`}
        {...restProps}
      >
        <div className="rounded bg-white shadow-xs">
          {/* The actual dropdown menu content. */}
          {children}
        </div>
      </div>
    ) : null;
  };

  const getContainerProps = () => ({
    className: 'ml-3 relative self-start',
    ref: ref as React.MutableRefObject<Nullable<HTMLDivElement>>,
  });

  return {
    getButtonProps,
    getDropdownButtonProps,
    getContainerProps,
    getDropdownContainer,
    showDropdown,
  };
};
