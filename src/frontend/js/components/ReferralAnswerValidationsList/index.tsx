import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { QueryStatus, useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Machine } from 'xstate';

import { appData } from 'appData';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralAnswerValidationStatusBadge } from 'components/ReferralAnswerValidationStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferralAnswerValidationRequests } from 'data';
import { fetchList } from 'data/fetchList';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { getUserFullname } from 'utils/user';
import { AnswerValidationRequestBtn } from './AnswerValidationRequestBtn';

const messages = defineMessages({
  errorMissingValidator: {
    defaultMessage:
      'Select a validator using the search box before attempting to request a validation.',
    description:
      'Error message to warn users when they try to request a validation without picking a validator.',
    id: 'components.ReferralAnswerValidationsList.errorMissingValidator',
  },
  errorRequest: {
    defaultMessage:
      'Something went wrong, the validation could not be requested.',
    description:
      'Error message to warn users when the request to add a validator to an answer failed.',
    id: 'components.ReferralAnswerValidationsList.errorRequest',
  },
  formLabel: {
    defaultMessage: 'Add validations for this answer',
    description:
      'Accessibility label for the validator search box & button in referral answers.',
    id: 'components.ReferralAnswerValidationsList.formLabel',
  },
  inputLabel: {
    defaultMessage: 'Start typing a validator name',
    description:
      'Accessibility label and placeholder for the validator search box in referral answers.',
    id: 'components.ReferralAnswerValidationsList.inputLabel',
  },
  loadingReferralAnswerValidationsList: {
    defaultMessage: 'Loading answer validations...',
    description:
      'Accessible message for the spinner while answer validations are loading',
    id:
      'components.ReferralAnswerValidationsList.loadingReferralAnswerValidationsList',
  },
  noValidationRequests: {
    defaultMessage: 'No validations have been requested yet.',
    description: 'Empty message when there are not validation requests yet.',
    id: 'components.ReferralAnswerValidationsList.noValidationRequests',
  },
  requestButton: {
    defaultMessage: 'Request a validation',
    description:
      'Text for the button to request a validation from a given user in referral answers.',
    id: 'components.ReferralAnswerValidationsList.requestButton',
  },
  thActions: {
    defaultMessage: 'Actions',
    description: 'Title for the column with actions in answer validations.',
    id: 'components.ReferralAnswerValidationsList.thActions',
  },
  thComment: {
    defaultMessage: 'Comment',
    description: 'Title for the column with comments in answer validations.',
    id: 'components.ReferralAnswerValidationsList.thComment',
  },
  thName: {
    defaultMessage: 'Name',
    description:
      'Title for the column with validator names in answer validations.',
    id: 'components.ReferralAnswerValidationsList.thName',
  },
  thStatus: {
    defaultMessage: 'Status',
    description:
      'Title for the column with validation statuses in answer validations.',
    id: 'components.ReferralAnswerValidationsList.thStatus',
  },
  validations: {
    defaultMessage: 'Validations',
    description:
      'Accessible title for the table that shows the list of validations for an answer.',
    id: 'components.ReferralAnswerValidationsList.validations',
  },
});

const addValidatorMachine = Machine<{ validator: Nullable<types.UserLite> }>({
  context: {
    validator: null,
  },
  id: 'addValidatorMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        PICK_VALIDATOR: {
          actions: ['setValidator'],
        },
        ADD_VALIDATOR: [
          { cond: 'hasValidator', target: 'loading' },
          'idleFailure',
        ],
      },
    },
    idleFailure: {
      on: {
        PICK_VALIDATOR: {
          actions: ['setValidator'],
        },
        ADD_VALIDATOR: [
          { cond: 'hasValidator', target: 'loading' },
          'idleFailure',
        ],
      },
    },
    loading: {
      invoke: {
        id: 'addValidator',
        onDone: {
          target: 'idle',
          actions: [
            'clearInputValue',
            'clearValidator',
            'invalidateRelatedQueries',
          ],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'addValidator',
      },
    },
    failure: {
      on: {
        PICK_VALIDATOR: {
          actions: ['setValidator'],
        },
        ADD_VALIDATOR: [
          { cond: 'hasValidator', target: 'loading' },
          'idleFailure',
        ],
      },
    },
  },
});

interface ReferralAnswerValidationsListProps {
  answerId: string;
  referral: types.Referral;
}

export const ReferralAnswerValidationsList: React.FC<ReferralAnswerValidationsListProps> = ({
  answerId,
  referral,
}) => {
  const intl = useIntl();
  const queryCache = useQueryCache();
  const seed = useUIDSeed();

  const { currentUser } = useCurrentUser();
  const { status, data } = useReferralAnswerValidationRequests(answerId);

  const [state, send] = useMachine(addValidatorMachine, {
    actions: {
      clearInputValue: () => {
        setValue('');
      },
      clearValidator: assign({
        validator: () => null as Nullable<types.UserLite>,
      }),
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryCache.invalidateQueries([
          'referralanswervalidationrequests',
          { answer: answerId },
        ]);
        queryCache.invalidateQueries([
          'referralactivities',
          { referral: referral.id },
        ]);
      },
      setValidator: assign({
        validator: (_, event) => event.data,
      }),
    },
    guards: {
      hasValidator: (ctx) => !!ctx.validator,
    },
    services: {
      addValidator: async (ctx) => {
        const response = await fetch(
          `/api/referrals/${referral.id}/request_answer_validation/`,
          {
            body: JSON.stringify({
              answer: answerId,
              validator: ctx.validator!.id,
            }),
            headers: {
              Authorization: `Token ${appData.token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to request a validation in <ReferralAnswerValidationsList />.`,
          );
        }
        return await response.json();
      },
    },
  });

  const [suggestions, setSuggestions] = useState<types.UserLite[]>([]);
  const [value, setValue] = useState<string>('');

  const getUsers: Autosuggest.SuggestionsFetchRequested = async ({ value }) => {
    const users: types.APIList<types.UserLite> = await queryCache.fetchQuery(
      ['users', { query: value }],
      fetchList,
    );
    let newSuggestions = users.results;
    if (status === QueryStatus.Success) {
      newSuggestions = newSuggestions.filter(
        (userLite) =>
          !data!.results
            .map((validation) => validation.validator.id)
            .includes(userLite.id),
      );
    }
    setSuggestions(newSuggestions);
  };

  switch (status) {
    case QueryStatus.Loading:
    case QueryStatus.Idle:
      return (
        <Spinner size="large">
          <FormattedMessage
            {...messages.loadingReferralAnswerValidationsList}
          />
        </Spinner>
      );

    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Success:
      // If the referral is in a state where validations cannot be requested and there is no existing
      // validation (nor request for the current user), we do not need to display anything.
      const currentUserValidation = data!.results.find(
        (validationRequest) =>
          validationRequest.validator.id === currentUser!.id &&
          !validationRequest.response,
      );
      if (
        !currentUserValidation &&
        data!.count === 0 &&
        referral.state !== types.ReferralState.ASSIGNED
      ) {
        return null;
      }

      return (
        <div className="space-y-2">
          <div className="w-full border-2 border-gray-200 rounded-sm inline-block">
            <table
              className="min-w-full relative"
              style={{ zIndex: 1 }}
              aria-label={intl.formatMessage(messages.validations)}
            >
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.thName} />
                  </th>
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.thComment} />
                  </th>
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.thStatus} />
                  </th>
                  <th scope="col" className="p-3">
                    <FormattedMessage {...messages.thActions} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data!.count === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <FormattedMessage {...messages.noValidationRequests} />
                    </td>
                  </tr>
                ) : (
                  data!.results.map((validationRequest, index) => (
                    <tr
                      key={validationRequest.id}
                      className={`stretched-link-container relative ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                      }`}
                      // Each row should have a higher z-index than the following one so the dropdown
                      // can freely overflow onto the row below it.
                      style={{ zIndex: 9999 - index }}
                    >
                      <th scope="row" className="font-normal">
                        <div>
                          {getUserFullname(validationRequest.validator)}
                        </div>
                        <div className="text-gray-600">
                          {validationRequest.validator.unit_name}
                        </div>
                      </th>

                      <td>
                        {validationRequest.response &&
                        !!validationRequest.response.comment
                          ? validationRequest.response.comment
                          : null}
                      </td>

                      <td>
                        <ReferralAnswerValidationStatusBadge
                          validationRequest={validationRequest}
                        />
                      </td>

                      <td>
                        {validationRequest.validator.id === currentUser!.id &&
                        !validationRequest.response &&
                        referral.state === types.ReferralState.ASSIGNED ? (
                          <AnswerValidationRequestBtn
                            validationRequest={validationRequest}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {referral.state === types.ReferralState.ASSIGNED ? (
              <form
                aria-labelledby={seed('add-validator-form-label')}
                className="flex flex-row justify-end p-4 border-t-2 border-gray-200"
                onSubmit={(e) => {
                  e.preventDefault();
                  send('ADD_VALIDATOR');
                }}
              >
                <label
                  className="sr-only"
                  id={seed('add-validator-form-label')}
                >
                  <FormattedMessage {...messages.formLabel} />
                </label>
                <div className="flex items-center space-x-4">
                  <div
                    className="relative"
                    style={{
                      width: '20rem',
                    }}
                  >
                    <label
                      className="sr-only"
                      htmlFor={seed('add-validator-form-input')}
                    >
                      <FormattedMessage {...messages.inputLabel} />
                    </label>
                    <Autosuggest
                      suggestions={suggestions}
                      onSuggestionsFetchRequested={getUsers}
                      onSuggestionsClearRequested={() => setSuggestions([])}
                      onSuggestionSelected={(_, { suggestion }) =>
                        send({ type: 'PICK_VALIDATOR', data: suggestion })
                      }
                      getSuggestionValue={(userLite) =>
                        getUserFullname(userLite)
                      }
                      renderSuggestion={(userLite) => getUserFullname(userLite)}
                      inputProps={{
                        id: seed('add-validator-form-input'),
                        placeholder: intl.formatMessage(messages.inputLabel),
                        onBlur: (_, event) => {
                          // If a given suggestion was highlighted, pick it as the validator
                          if (event?.highlightedSuggestion) {
                            send({
                              type: 'PICK_VALIDATOR',
                              data: event!.highlightedSuggestion,
                            });
                          }
                        },
                        onChange: (_, { newValue }) => {
                          setValue(newValue);
                          // Whenever there is a change in the value, if the new value matches one of our
                          // suggestions (the way the user sees it), pick it as the validator.
                          const suggestion = suggestions.find(
                            (userLite) =>
                              getUserFullname(userLite) === newValue,
                          );
                          if (suggestion) {
                            send({
                              type: 'PICK_VALIDATOR',
                              data: suggestion,
                            });
                          }
                        },
                        value,
                      }}
                    />
                  </div>
                  <button
                    className={`relative btn btn-primary ${
                      state.matches({ revise: 'loading' }) ? 'cursor-wait' : ''
                    }`}
                    aria-busy={state.matches('loading')}
                    aria-disabled={
                      !state.context.validator || state.matches('loading')
                    }
                  >
                    {state.matches('loading') ? (
                      <span aria-hidden="true">
                        <span className="opacity-0">
                          <FormattedMessage {...messages.requestButton} />
                        </span>
                        <Spinner
                          size="small"
                          color="white"
                          className="absolute inset-0"
                        >
                          {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                        </Spinner>
                      </span>
                    ) : (
                      <FormattedMessage {...messages.requestButton} />
                    )}
                  </button>
                </div>
                {state.matches('idleFailure') ? (
                  <div className="text-danger-600" role="alert">
                    <FormattedMessage {...messages.errorMissingValidator} />
                  </div>
                ) : null}
                {state.matches('failure') ? (
                  <div className="text-danger-600" role="alert">
                    <FormattedMessage {...messages.errorRequest} />
                  </div>
                ) : null}
              </form>
            ) : null}
          </div>
        </div>
      );
  }
};
