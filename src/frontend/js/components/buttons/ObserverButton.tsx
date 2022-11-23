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
      referral.observers
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
            activeUrl="add_observer"
            inactiveUrl="remove_observer"
            body={{ observer: user.id }}
            iconActive={<EyeIcon size={8} color="primary500" />}
            iconInactive={<EyeIcon size={8} color="primary100" />}
            onSuccess={(data: any) => {
              onClick(data);
            }}
          />
          <div className="explicit-table-row-button">
            <div className="mr-20 whitespace-no-wrap">
              {' '}
              {isActive ? (
                <FormattedMessage {...messages.titleActive} />
              ) : (
                <FormattedMessage {...messages.titleInactive} />
              )}
            </div>
            {isActive ? (
              <FormattedMessage {...messages.contentActive} />
            ) : (
              <FormattedMessage {...messages.contentInactive} />
            )}
          </div>
        </>
      )}
    </>
  );
};
