import { defineMessages } from '@formatjs/intl';
import React, { useContext, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { Spinner } from 'components/Spinner';
import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { IconTextButton } from '../buttons/IconTextButton';
import { AddIcon } from '../Icons';
import { UserListItem } from '../UserListItem';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { UserList } from '../ReferralUsers/UserList';
import { InviteForm } from '../forms/InviteForm';
import { Message, ReferralUserRole } from 'types';

const messages = defineMessages({
  addObserver: {
    defaultMessage: 'Add a new observer',
    description: 'Add observer CTA text',
    id: 'components.ObserversRequesters.addObserver',
  },
  findObserver: {
    defaultMessage: 'Enter the first name or last name of the observer',
    description: 'Placeholder for observer search input',
    id: 'components.ObserversRequesters.findObserver',
  },
  invitationTitle: {
    defaultMessage: 'User not found? Please invite by email:',
    description: 'placeholder observer autossugect',
    id: 'components.ObserversRequesters.invitationTitle',
  },
  invitationDescription: {
    defaultMessage:
      'Be sure to fill the mail address used for Cerbere authentication',
    description: 'Invitation description',
    id: 'components.ObserversRequesters.invitationDescription',
  },
});

interface ObserversBlockProps {
  description: Message;
  title: Message;
  referral: types.Referral;
  invite?: boolean;
}

export const ObserversBlock: React.FC<ObserversBlockProps> = ({
  referral,
  invite = false,
  description,
  title,
}) => {
  const seed = useUIDSeed();
  const intl = useIntl();
  const { currentUser } = useCurrentUser();
  const { refetch } = useContext(ReferralContext);
  const [isAddingObserver, setAddingObserver] = useState(false);
  // Use a key to reset the autosuggest field when the form is completed and sent
  const [key, setKey] = useState(0);

  const addObserverMutation = useReferralAction({
    onSuccess: () => {
      refetch();
    },
    onSettled: () => {
      setKey((key) => key + 1);
      addObserverMutation.reset();
    },
  });

  const currentUserIsObserver = useMemo(
    () =>
      referral.observers.findIndex(
        (referralUser) => referralUser.id === currentUser?.id,
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsFromRequesterUnit = useMemo(
    () =>
      referral.requesters.findIndex((referralUser) =>
        referralUser.unit_name.startsWith(currentUser?.unit_name || 'N/A'),
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserIsReferralUnitMember = useMemo(
    () =>
      referral.units.findIndex(
        (unit) =>
          unit.members.findIndex(
            (unitMember) => unitMember.id === currentUser?.id,
          ) !== -1,
      ) !== -1,
    [referral, currentUser],
  );

  const currentUserCanPerformActions =
    currentUserIsFromRequesterUnit ||
    currentUserIsObserver ||
    currentUserIsReferralUnitMember;

  return (
    <div className={`w-full space-y-4`}>
      <div className="space-y-2">
        <UserList
          title={title}
          description={description}
          showList={referral.observers.length > 0}
        >
          <>
            {referral.observers.map((user) => (
              <UserListItem
                key={user.id}
                action="remove_observer"
                payload={{ user: user.id }}
                currentUserCanPerformActions={currentUserCanPerformActions}
                referral={referral}
                user={user}
              />
            ))}
          </>
        </UserList>

        {isAddingObserver && currentUserCanPerformActions ? (
          <>
            <AutocompleteUserField
              filterSuggestions={(suggestions) =>
                suggestions.filter(
                  (user) =>
                    user.first_name &&
                    referral.observers.findIndex(
                      (referralUser) => user.id === referralUser.id,
                    ) === -1,
                )
              }
              inputProps={{
                disabled: addObserverMutation.isLoading,
                id: seed('add-observer-input-label'),
                placeholder: intl.formatMessage(messages.findObserver),
              }}
              key={key}
              onSuggestionSelected={(suggestion) =>
                addObserverMutation.mutate(
                  {
                    action: 'add_observer',
                    payload: {
                      user: suggestion.id,
                    },
                    referral,
                  },
                  {
                    onSuccess: () => setAddingObserver(false),
                  },
                )
              }
            />
            {addObserverMutation.isLoading ? (
              <Spinner
                aria-hidden={true}
                className="absolute top-0 bottom-0"
                style={{ right: '1rem' }}
                size="small"
              />
            ) : null}
          </>
        ) : (
          <div key={'add-observer'} className="flex w-full items-left">
            <IconTextButton
              onClick={() => setAddingObserver(true)}
              testId="add-observer-button"
              icon={<AddIcon />}
              otherClasses="btn-gray btn-sm"
            >
              <FormattedMessage {...messages.addObserver} />
            </IconTextButton>
          </div>
        )}
      </div>
      {invite && (
        <div className="space-y-2">
          <div>
            <p>
              <FormattedMessage {...messages.invitationTitle} />
            </p>
            <p className="text-sm text-gray-500">
              {' '}
              <FormattedMessage {...messages.invitationDescription} />
            </p>
          </div>
          <InviteForm
            referral={referral}
            invitationRole={ReferralUserRole.OBSERVER}
          />
        </div>
      )}
    </div>
  );
};
