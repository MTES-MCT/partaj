import { defineMessages } from '@formatjs/intl';
import React, { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { AutocompleteUserField } from 'components/AutocompleteUserField';
import { Spinner } from 'components/Spinner';
import { useReferralAction } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { RequestersListItem } from '../RequestersListItem';

const messages = defineMessages({
  inputExplanation: {
    defaultMessage: `All users added to this referral will be able to access it, send messages and read answers.
      They will be notified of actions occurring on this referral.`,
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.ReferralForm.RequestersBlock.inputExplanation',
  },
  inputLabel: {
    defaultMessage: 'Add users to this referral',
    description:
      'Label for the suggest box that lets users be added to the referral.',
    id: 'components.ReferralForm.RequestersBlock.inputLabel',
  },
  listTitle: {
    defaultMessage: 'Requesters name',
    description:
      'Title for the list of users linked to a referral as requesters.',
    id: 'components.ReferralForm.RequestersBlock.listTitle',
  },
  listExplanation: {
    defaultMessage:
      'Identity of persons and services requesting the referral. ' +
      'It can be different from the authenticated user name if you want the referral to be formally addressed to someone else.',
    description:
      'Explanation text for the list of users linked to a referral as requesters.',
    id: 'components.ReferralForm.RequestersBlock.listExplanation',
  },
});

interface RequestersBlockProps {
  referral: types.Referral;
}

export const RequestersBlock: React.FC<RequestersBlockProps> = ({
  referral,
}) => {
  const seed = useUIDSeed();
  const { currentUser } = useCurrentUser();

  // Use a key to reset the autosuggest field when the form is completed and sent
  const [key, setKey] = useState(0);

  const addRequesterMutation = useReferralAction({
    onSettled: () => {
      setKey((key) => key + 1);
      addRequesterMutation.reset();
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
    <div className="space-y-8 mb-8">
      <div className="space-y-4">
        <div className="font-semibold">
          <FormattedMessage {...messages.listTitle} />
        </div>
        <div className="text-gray-500">
          <FormattedMessage {...messages.listExplanation} />
        </div>
        <ul className="list-group max-w-xl">
          {referral.users.map((user) => (
            <RequestersListItem
              {...{ currentUserCanPerformActions, referral, user }}
              key={user.id}
            />
          ))}
        </ul>
      </div>
      {currentUserCanPerformActions ? (
        <div className="space-y-4">
          <span className="font-semibold">
            <FormattedMessage {...messages.inputLabel} />
          </span>

          <div className="text-gray-500">
            <FormattedMessage {...messages.inputExplanation} />
          </div>
          <div className="relative max-w-xl">
            <AutocompleteUserField
              filterSuggestions={(suggestions) =>
                suggestions.filter(
                  (user) =>
                    referral.users.findIndex(
                      (referralUser) => user.id === referralUser.id,
                    ) === -1,
                )
              }
              inputProps={{
                disabled: addRequesterMutation.isLoading,
                id: seed('add-users-input-label'),
              }}
              key={key}
              onSuggestionSelected={(suggestion) =>
                addRequesterMutation.mutate({
                  action: 'add_requester',
                  payload: { requester: suggestion.id },
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
      ) : null}
    </div>
  );
};
