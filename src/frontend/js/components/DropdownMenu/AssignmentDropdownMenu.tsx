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
}

export const AssignmentDropdownButton: React.FC<DropdownButtonProps> = ({
  className,
  isLoading,
  showDropdown,
  ...props
}) => {
  const intl = useIntl();
  return (
    <button
      className="tooltip button whitespace-no-wrap button-white-grey button-superfit text-base space-x-2"
      aria-busy={isLoading}
      aria-disabled={isLoading}
      data-tooltip={intl.formatMessage(messages.assignmentTooltip)}
      data-testid="assignment-dropdown-button"
      {...props}
    >
      {
        <>
          {props.children}
          <ArrowDownIcon color={IconColor.GREY_400} />
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
