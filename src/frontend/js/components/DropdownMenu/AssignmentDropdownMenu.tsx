import React from 'react';

import { Spinner } from 'components/Spinner';
import { ArrowDownIcon, IconColor } from '../Icons';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  assignmentTooltip: {
    defaultMessage: 'Update assignment',
    description: 'assignment tooltip text',
    id: 'components.AssignmentDropdownButton.assignmentTooltip',
  },
});

interface DropdownButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  isLoading?: boolean;
  showDropdown: boolean;
  showWarning: boolean;
}

export const AssignmentDropdownButton: React.FC<DropdownButtonProps> = ({
  className,
  isLoading,
  showDropdown,
  showWarning,
  ...props
}) => {
  const intl = useIntl();
  return (
    <button
      className={`tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-base max-w-1/1 ${
        showWarning && 'border-2 border-warning-500'
      }`}
      aria-busy={isLoading}
      aria-disabled={isLoading}
      data-tooltip={intl.formatMessage(messages.assignmentTooltip)}
      data-testid="assignment-dropdown-button"
      {...props}
    >
      {
        <>
          {props.children}
          <div className="w-5">
            <ArrowDownIcon color={IconColor.GREY_400} />
          </div>
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
