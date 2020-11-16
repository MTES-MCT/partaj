import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { QueryStatus, useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { assign, Machine } from 'xstate';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useReferralAnswerValidationRequests } from 'data';
import { fetchList } from 'data/fetchList';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { getUserFullname } from 'utils/user';
import { ValidateAnswerForm } from './ValidateAnswerForm';

const messages = defineMessages({
  errorMissingValidator: {
    defaultMessage:
      'Select a validator using the search box before attempting to request a validation.',
    description:
      'Error message to warn users when they try to request a validation without picking a validator.',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.errorMissingValidator',
  },
  errorRequest: {
    defaultMessage:
      'Something went wrong, the validation could not be requested.',
    description:
      'Error message to warn users when the request to add a validator to an answer failed.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerValidations.errorRequest',
  },
  formLabel: {
    defaultMessage: 'Add validations for this answer',
    description:
      'Accessibility label for the validator search box & button in referral answers.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerValidations.formLabel',
  },
  inputLabel: {
    defaultMessage: 'Start typing a validator name',
    description:
      'Accessibility label and placeholder for the validator search box in referral answers.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerValidations.inputLabel',
  },
  loadingAnswerValidations: {
    defaultMessage: 'Loading answer validations...',
    description:
      'Accessible message for the spinner while answer validations are loading',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.loadingAnswerValidations',
  },
  noValidationRequests: {
    defaultMessage: 'No validations have been requested yet.',
    description: 'Empty message when there are not validation requests yet.',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.noValidationRequests',
  },
  requestButton: {
    defaultMessage: 'Request a validation',
    description:
      'Text for the button to request a validation from a given user in referral answers.',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.requestButton',
  },
  validationMessageNotValidated: {
    defaultMessage: '{ validator } requested changes to this answer',
    description:
      'Accessibility message for when the validator requested changes to an answer',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.validationMessageNotValidated',
  },
  validationMessagePending: {
    defaultMessage: '{ validator } has not validated this answer yet',
    description:
      'Accessibility message for when the validator has not performed their validation yet',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.validationMessagePending',
  },
  validationMessageValidated: {
    defaultMessage: '{ validator } validated this answer',
    description:
      'Accessibility message for when the validator approved an answer',
    id:
      'components.ReferralDetailAnswerDisplay.AnswerValidations.validationMessageValidated',
  },
  validations: {
    defaultMessage: 'Validations',
    description:
      'Button to open the validation interface on a referral answer.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerValidations.validations',
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

interface AnswerValidationsProps {
  answerId: string;
  referral: types.Referral;
}

export const AnswerValidations: React.FC<
  AnswerValidationsProps & ContextProps
> = ({ answerId, context, referral }) => {
  const intl = useIntl();
  const queryCache = useQueryCache();
  const seed = useUIDSeed();

  const { currentUser } = useCurrentUser();
  const { status, data } = useReferralAnswerValidationRequests(
    context,
    answerId,
  );

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
              Authorization: `Token ${context.token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to request a validation in <AnswerValidations />.`,
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
      fetchList(context),
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
    case QueryStatus.Success:
      const currentUserValidation = data!.results.find(
        (validationRequest) =>
          validationRequest.validator.id === currentUser!.id &&
          !validationRequest.response,
      );

      // If the referral is in a state where validations cannot be requested and there is no existing
      // validation (nor request for the current user), we do not need to display anything.
      if (
        !currentUserValidation &&
        data!.count === 0 &&
        referral.state !== types.ReferralState.ASSIGNED
      ) {
        return null;
      }

      return (
        <div className="bg-gray-300 -mx-10 px-10 py-6 shadow-inner space-y-6">
          <div className="space-y-2">
            <h5
              className="text-lg text-gray-700"
              id={seed('existing-validations-list')}
            >
              <FormattedMessage {...messages.validations} />
            </h5>

            {data!.count > 0 ? (
              <ul
                className="list-group"
                aria-labelledby={seed('existing-validations-list')}
              >
                {data!.results.map((validationRequest) => (
                  <li
                    className="list-group-item bg-white hover:bg-white flex flex-row items-start space-x-4"
                    key={validationRequest.id}
                  >
                    <div
                      className="flex-grow-0 w-6 h-6 border-2 border-gray-500 rounded"
                      aria-hidden="true"
                    >
                      {validationRequest.response ? (
                        validationRequest.response.state ===
                        types.ReferralAnswerValidationResponseState
                          .VALIDATED ? (
                          <svg
                            role="img"
                            className="w-5 h-5 fill-current text-green-600"
                          >
                            <use
                              xlinkHref={`${context.assets.icons}#icon-tick`}
                            />
                          </svg>
                        ) : (
                          <svg
                            role="img"
                            className="w-5 h-5 fill-current text-red-600"
                          >
                            <use
                              xlinkHref={`${context.assets.icons}#icon-cross`}
                            />
                          </svg>
                        )
                      ) : null}
                    </div>
                    <div className="flex-grow flex flex-col">
                      <div className="sr-only">
                        <FormattedMessage
                          {...(validationRequest.response
                            ? validationRequest.response.state ===
                              types.ReferralAnswerValidationResponseState
                                .VALIDATED
                              ? messages.validationMessageValidated
                              : messages.validationMessageNotValidated
                            : messages.validationMessagePending)}
                          values={{
                            validator: getUserFullname(
                              validationRequest.validator,
                            ),
                          }}
                        />
                      </div>
                      <div aria-hidden="true">
                        {getUserFullname(validationRequest.validator)}
                      </div>
                      {validationRequest.response &&
                      !!validationRequest.response.comment ? (
                        <div className="text-gray-600">
                          {validationRequest.response.comment}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                <FormattedMessage {...messages.noValidationRequests} />
              </div>
            )}

            {referral.state === types.ReferralState.ASSIGNED ? (
              <form
                aria-labelledby={seed('add-validator-form-label')}
                className="space-y-2"
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
                    className={`relative btn btn-teal ${
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
                  <div className="text-red-500" role="alert">
                    <FormattedMessage {...messages.errorMissingValidator} />
                  </div>
                ) : null}
                {state.matches('failure') ? (
                  <div className="text-red-500" role="alert">
                    <FormattedMessage {...messages.errorRequest} />
                  </div>
                ) : null}
              </form>
            ) : null}
          </div>
          {currentUserValidation &&
          referral.state === types.ReferralState.ASSIGNED ? (
            <ValidateAnswerForm
              {...{
                answerId,
                context,
                referral,
                validationRequestId: currentUserValidation.id,
              }}
            />
          ) : null}
        </div>
      );

    case QueryStatus.Loading:
      return (
        <Spinner size={'large'}>
          <FormattedMessage {...messages.loadingAnswerValidations} />
        </Spinner>
      );

    case QueryStatus.Error:
    default:
      return <GenericErrorMessage />;
  }
};
