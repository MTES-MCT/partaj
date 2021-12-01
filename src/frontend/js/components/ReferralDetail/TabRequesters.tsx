import { defineMessages } from '@formatjs/intl';
import React, { Fragment, useMemo, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { FormattedMessage } from 'react-intl';
import { QueryFunction, QueryKey, useQueryClient } from 'react-query';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useReferralAction } from 'data';
import { fetchList } from 'data/fetchList';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  inputExplanation: {
    defaultMessage: `All users added to this referral will be able to access it, send messages and read answers.
      They will be notified of actions occurring on this referral.`,
    description:
      'Explanation text for the suggest box to add users to the referral.',
    id: 'components.TabRequesters.inputExplanation',
  },
  inputLabel: {
    defaultMessage: 'Add users to this referral',
    description:
      'Label for the suggest box that lets users be added to the referral.',
    id: 'components.TabRequesters.inputLabel',
  },
  listTitle: {
    defaultMessage: 'Users linked to this referral',
    description:
      'Title for the list of users linked to a referral as requesters.',
    id: 'components.ReferralDetail.TabRequesters.listTitle',
  },
  removeUser: {
    defaultMessage: 'Remove user from referral',
    description:
      'Accessible text for the button to remove a given user from a referral.',
    id: 'components.TabRequesters.removeUser',
  },
  removingUser: {
    defaultMessage: 'Removing { user } from referral...',
    description:
      'Accessible text for the loader while removing a user from a referral.',
    id: 'components.TabRequesters.removingUser',
  },
});

interface RequestersListItem {
  currentUserCanPerformActions: boolean;
  referral: types.Referral;
  user: types.User;
}

const RequestersListItem: React.FC<RequestersListItem> = ({
  currentUserCanPerformActions,
  referral,
  user,
}) => {
  const seed = useUIDSeed();
  const removeRequesterMutation = useReferralAction();

  return (
    <li className="list-group-item block">
      <div className="flex flex-row space-x-32 items-center justify-between">
        <div>
          <div>{getUserFullname(user)}</div>
          <div className="text-gray-500">{user.unit_name}</div>
        </div>
        {currentUserCanPerformActions ? (
          <div>
            <button
              type="button"
              aria-labelledby={seed(user)}
              aria-busy={removeRequesterMutation.isLoading}
              onClick={() =>
                removeRequesterMutation.mutate({
                  action: 'remove_requester',
                  payload: { requester: user.id },
                  referral,
                })
              }
            >
              {removeRequesterMutation.isIdle ? (
                <svg role="img" className="w-6 h-6 fill-current">
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-user-disconnect`}
                  />
                  <title id={seed(user)}>
                    <FormattedMessage {...messages.removeUser} />
                  </title>
                </svg>
              ) : null}
              {removeRequesterMutation.isLoading ? (
                <Fragment>
                  <Spinner size="small">
                    <FormattedMessage
                      {...messages.removingUser}
                      values={{ user: getUserFullname(user) }}
                    />
                  </Spinner>
                </Fragment>
              ) : null}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
};

interface TabRequestersProps {
  referral: types.Referral;
}

export const TabRequesters: React.FC<TabRequestersProps> = ({ referral }) => {
  const queryClient = useQueryClient();
  const seed = useUIDSeed();
  const { currentUser } = useCurrentUser();

  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<types.UserLite[]>([]);

  const getUsers: Autosuggest.SuggestionsFetchRequested = async ({ value }) => {
    const users: types.APIList<types.UserLite> = await queryClient.fetchQuery(
      ['users', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
    setSuggestions(
      users.results.filter(
        (user) =>
          referral.users.findIndex(
            (referralUser) => user.id === referralUser.id,
          ) === -1,
      ),
    );
  };

  const addRequesterMutation = useReferralAction({
    onSettled: () => {
      setValue('');
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
    <div className="max-w-xl space-y-8">
      <div className="space-y-4">
        <div className="font-semibold">
          <FormattedMessage {...messages.listTitle} />
        </div>
        <ul className="list-group">
          {referral.users.map((user) => (
            <RequestersListItem
              {...{ currentUserCanPerformActions, referral, user }}
              key={user.id}
            />
          ))}
        </ul>
      </div>

      {currentUserCanPerformActions ? (
        <form className="space-y-4">
          <label
            className="font-semibold"
            htmlFor={seed('add-users-input-label')}
          >
            <FormattedMessage {...messages.inputLabel} />
          </label>
          <div className="text-gray-500">
            <FormattedMessage {...messages.inputExplanation} />
          </div>
          <div className="relative">
            <Autosuggest
              aria-busy={addRequesterMutation.isLoading}
              suggestions={suggestions}
              onSuggestionsFetchRequested={getUsers}
              onSuggestionsClearRequested={() => setSuggestions([])}
              onSuggestionSelected={(_, { suggestion }) => {
                addRequesterMutation.mutate({
                  action: 'add_requester',
                  payload: { requester: suggestion.id },
                  referral,
                });
              }}
              getSuggestionValue={(userLite) => getUserFullname(userLite)}
              renderSuggestion={(userLite) => getUserFullname(userLite)}
              inputProps={{
                disabled: addRequesterMutation.isLoading,
                id: seed('add-users-input-label'),
                onChange: (_, { newValue }) => {
                  setValue(newValue);
                },
                value,
              }}
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
        </form>
      ) : null}
    </div>
  );
};
