import React from 'react';

type SelectButtonProps = React.PropsWithChildren<{
  isOptionsOpen: boolean;
  onClick: Function;
  hasError?: boolean;
  isDisabled: boolean;
}>;

export const SelectButton = ({
  isOptionsOpen,
  onClick,
  children,
  hasError = false,
  isDisabled,
}: SelectButtonProps) => {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOptionsOpen}
      aria-disabled={isDisabled}
      className={`flex items-center ${
        hasError ? 'dsfr-input-text-error' : ''
      } dsfr-input-select space-x-2`}
      onClick={() => onClick()}
    >
      {children}
    </button>
  );
};
