import React, { useEffect, useState } from 'react';
import { ReferralUserLink, ReferralUserRole } from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ChevronBottomIcon } from '../Icons';

const messages = defineMessages({
  requester: {
    defaultMessage: 'Requester',
    description: 'referral user button title when requester',
    id: 'components.ReferralUserRoleButton.requester',
  },
  observer: {
    defaultMessage: 'Guest',
    description: 'referral user button title when observer',
    id: 'components.ReferralUserRoleButton.observer',
  },
});

export const ReferralUserRoleButton = ({
  user,
  onClick,
  setShowModal,
}: {
  user: Nullable<ReferralUserLink>;
  onClick: Function;
  setShowModal: Function;
}) => {
  return (
    <>
      {user && (
        <button
          className={`subscribe-button`}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            setShowModal(true);
            e.stopPropagation();
            onClick();
          }}
        >
          <>
            <span>
              {user.role === ReferralUserRole.OBSERVER && (
                <FormattedMessage {...messages.observer} />
              )}
              {user.role === ReferralUserRole.REQUESTER && (
                <FormattedMessage {...messages.requester} />
              )}
            </span>
            <ChevronBottomIcon />
          </>
        </button>
      )}
    </>
  );
};
