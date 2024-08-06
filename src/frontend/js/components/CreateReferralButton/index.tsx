import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import { NavLink } from 'react-router-dom';
import { AddIcon } from '../Icons';

const messages = defineMessages({
  draftReferral: {
    defaultMessage: 'Create a referral',
    description: 'Button to create a new referral.',
    id: 'components.CreateReferralButton.draftReferral',
  },
});

export const CreateReferralButton: React.FC = () => {
  return (
    <NavLink
      to="/new-referral"
      role="button"
      tabIndex={0}
      className={`btn btn-primary flex items-center space-x-1 pl-3`}
    >
      <AddIcon className="fill-white w-5 h-5" />
      <span className="mb-0.5">
        <FormattedMessage {...messages.draftReferral} />
      </span>
    </NavLink>
  );
};
