import { defineMessages } from '@formatjs/intl';
import React, { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { Spinner } from 'components/Spinner';
import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { RequestersListItem } from '../RequestersListItem';
import { IconTextButton } from '../buttons/IconTextButton';
import { AddIcon } from '../Icons';

const messages = defineMessages({
  listTitle: {
    defaultMessage: 'Observers name',
    description:
      'Title for the list of users linked to a referral as Observers.',
    id: 'components.ReferralForm.ObserversBlock.listTitle',
  },
  listExplanation: {
    defaultMessage:
      'Add one or more person(s) from one or more units interested in the outcome of the referral',
    description:
      'Explanation text for the list of users linked to a referral as Observers.',
    id: 'components.ReferralForm.ObserversBlock.listExplanation',
  },
  addObserver: {
    defaultMessage: 'Add a new observer',
    description: 'Add oberever CTA text',
    id: 'components.ObserversBlock.addObserver',
  },
  findObserver: {
    defaultMessage: 'find the observer',
    description: 'placeholder observer autossugect',
    id: 'components.ObserversBlock.findObserver',
  },
});

interface ObserversBlockProps {
  referral: types.Referral;
}

export const ObserversBlock: React.FC<ObserversBlockProps> = ({ referral }) => {
  const seed = useUIDSeed();
  const intl = useIntl();

  const { currentUser } = useCurrentUser();

  // Use a key to reset the autosuggest field when the form is completed and sent
  const [key, setKey] = useState(0);
  const [isAddingObserver, setAddingObserver] = useState(false);

  const addRequesterMutation = useReferralAction({
    onSettled: () => {
      setKey((key) => key + 1);
      addRequesterMutation.reset();
      setAddingObserver(false);
    },
  });

  const currentUserIsRequester = useMemo(
    () =>
      referral.users.findIndex(
        (referralUser) => referralUser.id === currentUser?.id,
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
    currentUserIsRequester || currentUserIsReferralUnitMember;

  return (
    <div className="space-y-4 mb-4">
      <div className="space-y-4">
        <div className="font-semibold">
          <FormattedMessage {...messages.listTitle} />
        </div>
        <div className="text-gray-500">
          <FormattedMessage {...messages.listExplanation} />
        </div>
        <ul className="list-group max-w-xl">
          {referral.observers.map((user) => (
            <RequestersListItem
              {...{
                currentUserCanPerformActions,
                referral,
                user,
                action: 'remove_observer',
                payload: { observer: user.id },
              }}
              key={user.id}
            />
          ))}
        </ul>
      </div>

      {isAddingObserver && currentUserCanPerformActions ? (
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <AutocompleteUserField
              filterSuggestions={(suggestions) =>
                suggestions.filter(
                  (user) =>
                    referral.observers.findIndex(
                      (referralUser) => user.id === referralUser.id,
                    ) === -1,
                )
              }
              inputProps={{
                disabled: addRequesterMutation.isLoading,
                id: seed('add-users-input-label'),
                placeholder: intl.formatMessage(messages.findObserver),
              }}
              key={key}
              onSuggestionSelected={(suggestion) =>
                addRequesterMutation.mutate({
                  action: 'add_observer',
                  payload: { observer: suggestion.id },
                  referral,
                })
              }
            />
            {addRequesterMutation.isLoading ? (
              <Spinner
                aria-hidden={true}
                className="absolute top-0 bottom-0"
                style={{ right: '1rem' }}
                size="small"
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div key={'add-version'} className="flex w-full items-left">
          <IconTextButton
            onClick={() => setAddingObserver(true)}
            testId="add-Observer-button"
            icon={<AddIcon />}
          >
            <FormattedMessage {...messages.addObserver} />
          </IconTextButton>
        </div>
      )}
    </div>
  );
};
