import React from 'react';

type SelectButtonProps = React.PropsWithChildren<{
  isOptionsOpen: boolean;
  onClick: Function;
  hasError?: boolean;
}>;

export const SelectButton = ({
  isOptionsOpen,
  onClick,
  children,
  hasError = false,
}: SelectButtonProps) => {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOptionsOpen}
      className={`flex items-center ${
        hasError ? 'dsfr-input-text-error' : ''
      } dsfr-input-select space-x-2`}
      onClick={() => onClick()}
    >
      {children}
    </button>
  );
};
