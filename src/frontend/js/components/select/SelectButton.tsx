import React from 'react';

type SelectButtonProps = React.PropsWithChildren<{
  isOptionsOpen: boolean;
  onClick: Function;
}>;

export const SelectButton = ({
  isOptionsOpen,
  onClick,
  children,
}: SelectButtonProps) => {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOptionsOpen}
      className={`flex items-center dsfr-input-select space-x-2`}
      onClick={() => onClick()}
    >
      <>{children}</>
    </button>
  );
};
