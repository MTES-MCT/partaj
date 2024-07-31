import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import { appData } from 'appData';
import { NavLink } from 'react-router-dom';

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
      className={`btn btn-primary-outline flex items-center space-x-2`}
    >
      <svg role="presentation" className="navbar-icon" aria-hidden="true">
        <use xlinkHref={`${appData.assets.icons}#icon-plus`} />
      </svg>
      <span>
        <FormattedMessage {...messages.draftReferral} />
      </span>
    </NavLink>
  );
};
