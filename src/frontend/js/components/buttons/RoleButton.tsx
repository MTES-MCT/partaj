import React, { useContext, useRef } from 'react';
import {
  ReferralLite,
  ReferralUserAction,
  ReferralUserRole,
  UserLite,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ChevronBottomIcon, IconColor } from '../Icons';
import { RoleModalContext } from '../../data/providers/RoleModalProvider';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  requester: {
    defaultMessage: 'Requester',
    description: 'referral user button title when requester',
    id: 'components.RoleButton.requester',
  },
  observer: {
    defaultMessage: 'Guest',
    description: 'referral user button title when observer',
    id: 'components.RoleButton.observer',
  },
  invite: {
    defaultMessage: 'Invite',
    description: 'referral user button title when no referral role',
    id: 'components.RoleButton.invite',
  },
});

export const RoleButton = ({
  user,
  role,
  action,
  payload,
  beforeOnClick,
}: {
  user: Nullable<UserLite>;
  role: Nullable<ReferralUserRole>;
  action: ReferralUserAction;
  beforeOnClick?: Function;
  payload: any;
}) => {
  const buttonRef = useRef(null);
  const { displayModal } = useContext(RoleModalContext);
  return (
    <>
      <button
        ref={buttonRef}
        className={`action-button action-button-light-gray`}
        onClick={(e) => {
          /* stopPropagation is used to avoid redirection if the button is nested inside a link */
          e.stopPropagation();

          if (beforeOnClick) {
            beforeOnClick() &&
              displayModal({ user, buttonRef, action, payload });
          } else {
            displayModal({ user, buttonRef, action, payload });
          }
        }}
      >
        <>
          <span>
            {role === ReferralUserRole.OBSERVER && (
              <FormattedMessage {...messages.observer} />
            )}
            {role === ReferralUserRole.REQUESTER && (
              <FormattedMessage {...messages.requester} />
            )}
            {role === null && <FormattedMessage {...messages.invite} />}
          </span>
          <ChevronBottomIcon color={IconColor.PRIMARY_1000} />
        </>
      </button>
    </>
  );
};
