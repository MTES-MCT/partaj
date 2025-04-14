import React from 'react';

import { Spinner } from 'components/Spinner';
import { ArrowDownIcon } from '../Icons';
import { getEmphasisStyle } from '../../utils/styles';

interface DropdownButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  isLoading?: boolean;
  showDropdown: boolean;
  label: string;
  showWarning: boolean;
}

export const AssignmentDropdownButton: React.FC<DropdownButtonProps> = ({
  className,
  isLoading,
  showDropdown,
  showWarning,
  label,
  ...props
}) => {
  return (
    <button
      className={`tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-base max-w-1/1 ${
        showWarning && getEmphasisStyle()
      }`}
      aria-busy={isLoading}
      aria-disabled={isLoading}
      aria-label={label}
      data-tooltip={label}
      data-testid="assignment-dropdown-button"
      {...props}
    >
      {
        <>
          {props.children}
          <ArrowDownIcon className="fill-grey400" />
        </>
      }
      {isLoading ? (
        <span aria-hidden="true">
          <Spinner size="small" />
        </span>
      ) : null}
    </button>
  );
};
