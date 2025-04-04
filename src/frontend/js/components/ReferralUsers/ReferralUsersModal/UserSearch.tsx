import {
  QueryFunction,
  QueryKey,
  useMutation,
  useQueryClient,
} from 'react-query';
import React, { useContext, useEffect, useRef } from 'react';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { ReferralUsersModalContext } from '../../../data/providers/ReferralUsersModalProvider';
import { fetchList } from '../../../data/fetchList';
import { UserLite } from '../../../types';
import { SearchIcon } from '../../Icons';
import { UserSearchList } from './UserSearchList';
import { Spinner } from '../../Spinner';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

const messages = defineMessages({
  userSearchInput: {
    defaultMessage: 'Enter the name of the person to add',
    description: 'Placeholder and title for the user search input',
    id: 'components.UserSearch.userSearchInput',
  },
  noResults: {
    defaultMessage: 'No results for the search:',
    description: 'No results text',
    id: 'components.UserSearch.noResults',
  },
  userNotFoundTitle: {
    defaultMessage: "You can't find the person in our list?",
    description: 'Title if no user found',
    id: 'components.UserSearch.userNotFoundTitle',
  },
  userNotFoundDescription: {
    defaultMessage: 'Invite directly with his professional email',
    description: 'Description if no user found',
    id: 'components.UserSearch.userNotFoundDescription',
  },
  searching: {
    defaultMessage: 'Searching ...',
    description: 'Loading text',
    id: 'components.UserSearch.searching',
  },
});

export const UserSearch = () => {
  const intl = useIntl();
  const queryClient = useQueryClient();

  const { referral } = useContext(ReferralContext);
  const {
    inputValue,
    setInputValue,
    setTabActive,
    tabActive,
    results,
    setResults,
  } = useContext(ReferralUsersModalContext);
  const inputRef = useRef(null);

  useEffect(() => {
    if (tabActive === 'name') {
      inputRef && (inputRef.current! as HTMLElement).focus();
    }
  }, [tabActive]);

  const getUsers = async (value: string) => {
    return await queryClient.fetchQuery(
      ['users', { query: value }],
      fetchList as QueryFunction<any, QueryKey>,
    );
  };

  const mutation = useMutation((value: string) => getUsers(value), {
    onSuccess: (users, variables, context) => {
      setResults(
        users.results.filter(
          (user: UserLite) =>
            referral &&
            referral.users.findIndex(
              (referralUser) => user.id === referralUser.id,
            ) === -1,
        ),
      );
    },
  });

  return (
    <div
      className={`relative bg-white overflow-hidden flex flex-col flex-grow`}
    >
      <div className="flex sticky z-20 top-0 left-0 right-0 ">
        <div className="dsfr-search p-1 w-full">
          <div className="absolute left-2">
            <SearchIcon className="fill-grey600" />
          </div>
          <input
            ref={inputRef}
            placeholder={intl.formatMessage(messages.userSearchInput)}
            title={intl.formatMessage(messages.userSearchInput)}
            autoComplete="family-name"
            className={`pl-8 pr-1 w-full`}
            type="text"
            aria-label={intl.formatMessage(messages.userSearchInput)}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.value ? mutation.mutate(e.target.value) : setResults([]);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col flex-grow items-center bg-white overflow-hidden">
        {(mutation.isSuccess || mutation.isIdle) && (
          <>
            {results.length > 0 || !inputValue ? (
              <UserSearchList results={results} />
            ) : (
              <div className="flex flex-grow flex-col items-center justify-evenly">
                <div className="flex flex-col items-center">
                  <span className="text-primary-1000 text-lg">
                    <FormattedMessage {...messages.noResults} />
                  </span>
                  <span className="bg-gray-200"> {inputValue} </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-primary-1000 text-lg">
                    <FormattedMessage {...messages.userNotFoundTitle} />
                  </span>
                  <button
                    className="cursor-pointer underline"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setTabActive('email');
                    }}
                  >
                    <FormattedMessage {...messages.userNotFoundDescription} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {mutation.isLoading && (
          <div className="flex flex-grow flex-col items-center justify-center">
            <div className="flex">
              <Spinner size="small" color="#8080D1" className="inset-0" />
              <span>
                <FormattedMessage {...messages.searching} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
