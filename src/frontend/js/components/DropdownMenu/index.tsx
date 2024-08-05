import React, { useState } from 'react';

import { Spinner } from 'components/Spinner';
import { Maybe, Nullable } from 'types/utils';
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
        `whitespace-nowrap flex max-w-full items-center w-full text-left px-4 py-2 text-sm ` +
        `leading-5 ` +
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
        `block rounded shadow-sm px-4 py-2 border focus:border-primary-300 focus:ring-blue ` +
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

export const useDropdownMenu = (isKeepDropdownMenu?: boolean) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const { ref } = useClickOutside({
    onClick: () => {
      isKeepDropdownMenu ? setShowDropdown(true) : setShowDropdown(false);
    },
  });

  const buttonProps = {
    'aria-haspopup': true,
    'aria-expanded': showDropdown,
    onClick: () => {
      setShowDropdown(!showDropdown);
    },
  };
  const getButtonProps = () => buttonProps;

  const getDropdownButtonProps = () => ({
    ...buttonProps,
    showDropdown,
  });

  const getDropdownContainer = (
    children: React.ReactNode,
    props?: React.ComponentProps<'div'>,
    side: 'left' | 'right' = 'left',
  ) => {
    const { className = '', ...restProps } = props || {};

    return showDropdown ? (
      <div
        className={`absolute max-w-64 w-full shadow-lg border border-gray-200 ${
          side === 'left'
            ? 'right-0 origin-top-right'
            : 'left-0 origin-top-left'
        } ${className} `}
        {...restProps}
      >
        {/* The actual dropdown menu content. */}
        {children}
      </div>
    ) : null;
  };

  const getContainerProps = (props = { className: '' }) => ({
    className: `relative ${props.className}`,
    ref: ref as React.MutableRefObject<Nullable<HTMLDivElement>>,
  });

  return {
    getButtonProps,
    getDropdownButtonProps,
    getContainerProps,
    getDropdownContainer,
    setShowDropdown,
    showDropdown,
  };
};
