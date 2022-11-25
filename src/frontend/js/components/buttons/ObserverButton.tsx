import React, { useEffect, useState } from 'react';
import { ReferralLite, User, UserLite } from '../../types';
import { Nullable } from '../../types/utils';
import { ToggleAPIButton } from './ToggleAPIButton';
import { EyeIcon } from '../Icons';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  titleActive: {
    defaultMessage: 'Stop observation',
    description: 'Title text explanation for button when active',
    id: 'components.ReferralTable.titleActive',
  },
  titleInactive: {
    defaultMessage: 'Start observation',
    description: 'Title text explanation for button when inactive',
    id: 'components.ReferralTable.titleInactive',
  },
  contentActive: {
    defaultMessage: 'Observer is a passive actor who will be notified for answer send, delay change and referral closed events',
    description:
      'Title text explanation for button when inactive',
    id: 'components.ReferralTable.contentActive',
  },
  contentInactive: {
    defaultMessage:
      'Stopping the observation will remove all notifications for this referral',
    description: 'Title text explanation for button when inactive',
    id: 'components.ReferralTable.contentInactive',
  },
});

export const ObserverButton = ({
  user,
  referral,
  onClick,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  onClick: Function;
}) => {
  const isObserver = (referral: ReferralLite, user: Nullable<User>) => {
    return (
      user &&
      referral &&
      referral.users_restricted
        .map((requester: UserLite) => requester.id)
        .includes(user.id)
    );
  };

  const [isActive, setActive] = useState(isObserver(referral, user));

  useEffect(() => {
    setActive(isObserver(referral, user));
  }, [referral, user]);

  return (
    <>
      {referral && user && (
        <>
          <ToggleAPIButton
            referralId={referral.id}
            isActive={isActive}
            activeUrl="add_requester"
            inactiveUrl="remove_requester"
            body={
              {
                requester: user.id,
                notifications: 'R',
              }
            }
            iconActive={<EyeIcon size={8} color="primary500" />}
            iconInactive={<EyeIcon size={8} color="primary100" />}
            onSuccess={(data: any) => {
              onClick(data);
            }}
          />
          <div className="hover-table-row-button">
            <div className="hover-table-row-button-title">
              {' '}
              {isActive ? (<span><FormattedMessage {...messages.titleActive} /></span>

              ) : (
                <span><FormattedMessage {...messages.titleInactive} /></span>
              )}
            </div>
            {isActive ? (
              <span><FormattedMessage {...messages.contentActive} /></span>
            ) : (
              <span><FormattedMessage {...messages.contentInactive} /></span>
            )}
          </div>
        </>
      )}
    </>
  );
};
