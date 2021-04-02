import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryClient } from 'react-query';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';
import { assign, Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import * as types from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  buttonApprove: {
    defaultMessage: 'Validate',
    description:
      'Button to submit the validation form. Changes with the status of the validation.',
    id: 'components.ReferralAnswerValidationForm.buttonApprove',
  },
  buttonReject: {
    defaultMessage: 'Request changes',
    description:
      'Button to submit the validation form. Changes with the status of the validation.',
    id: 'components.ReferralAnswerValidationForm.buttonReject',
  },
  explanation: {
    defaultMessage:
      'You were asked to validate this answer. You can approve or reject it, ' +
      'and may leave an additional comment along with your approval or denial.',
    description:
      'Explanatory message for the validator in the form to validate an answer.',
    id: 'components.ReferralAnswerValidationForm.explanation',
  },
  formFailure: {
    defaultMessage:
      'Something went wrong. Failed to send your validation review.',
    description:
      'Error message displayed when the validate answer form fails to submit.',
    id: 'components.ReferralAnswerValidationForm.formFailure',
  },
  inputLabel: {
    defaultMessage: 'Validation comment (optional)',
    description:
      'Label for the form field that allows a validator to add a comment to their validation.',
    id: 'components.ReferralAnswerValidationForm.inputLabel',
  },
  radioDescriptionApprove: {
    defaultMessage:
      'This answer can be accepted and sent to the requester ({ requester }).',
    description:
      'Description for the radio button that allows the validator to approve an answer.',
    id: 'components.ReferralAnswerValidationForm.radioDescriptionApprove',
  },
  radioDescriptionReject: {
    defaultMessage:
      'This answer is not ready and needs to be revised before it can be sent.',
    description:
      'Description for the radio button that allows the validator to reject an answer.',
    id: 'components.ReferralAnswerValidationForm.radioDescriptionReject',
  },
  radioLabelApprove: {
    defaultMessage: 'Validate the draft',
    description:
      'Label for the radio button that allows the validator to approve an answer.',
    id: 'components.ReferralAnswerValidationForm.radioLabelApprove',
  },
  radioLabelReject: {
    defaultMessage: 'Request changes',
    description:
      'Label for the radio button that allows the validator to reject an answer.',
    id: 'components.ReferralAnswerValidationForm.radioLabelReject',
  },
  radioLegend: {
    defaultMessage: 'Do you approve this answer?',
    description:
      'Label for the form field that allows a validator to pick "approve" or "deny".',
    id: 'components.ReferralAnswerValidationForm.radioLegend',
  },
  title: {
    defaultMessage: 'Validate this answer',
    description:
      'Title for the form that allows a validator to approve or deny a validation for an answer',
    id: 'components.ReferralAnswerValidationForm.title',
  },
});

const validateAnswerMachine = Machine<{
  comment: string;
  responseState: types.ReferralAnswerValidationResponseState;
}>({
  context: {
    comment: '',
    responseState: types.ReferralAnswerValidationResponseState.VALIDATED,
  },
  id: 'validateAnswerMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        UPDATE_COMMENT: {
          actions: assign({ comment: (_, event) => event.data }),
        },
        UPDATE_STATE: {
          actions: assign({ responseState: (_, event) => event.data }),
        },
        VALIDATE: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'validateAnswer',
        onDone: {
          target: 'success',
          actions: ['invalidateRelatedQueries', 'moveToValidationsList'],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'validateAnswer',
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        UPDATE_COMMENT: {
          actions: assign({ comment: (_, event) => event.data }),
        },
        UPDATE_STATE: {
          actions: assign({ responseState: (_, event) => event.data }),
        },
        VALIDATE: 'loading',
      },
    },
  },
});

interface ReferralAnswerValidationFormProps {
  referral: types.Referral;
}

interface ReferralAnswerValidationFormRouteParams {
  answerId: types.ReferralAnswer['id'];
  validationRequestId: types.ReferralAnswerValidationRequest['id'];
}

export const ReferralAnswerValidationForm: React.FC<ReferralAnswerValidationFormProps> = ({
  referral,
}) => {
  const history = useHistory();
  const { url } = useRouteMatch();
  const { answerId, validationRequestId } = useParams<
    ReferralAnswerValidationFormRouteParams
  >();

  const queryClient = useQueryClient();
  const seed = useUIDSeed();

  const [state, send] = useMachine(validateAnswerMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryClient.invalidateQueries([
          'referralanswervalidationrequests',
          { answer: answerId },
        ]);
        queryClient.invalidateQueries([
          'referralactivities',
          { referral: referral.id },
        ]);
      },
      moveToValidationsList: () => {
        const [_, __, ...urlParts] = url.split('/').reverse();
        history.push(urlParts.reverse().join('/'));
      },
    },
    services: {
      validateAnswer: async (ctx) => {
        const response = await fetch(
          `/api/referrals/${referral.id}/perform_answer_validation/`,
          {
            body: JSON.stringify({
              validation_request: validationRequestId,
              comment: ctx.comment,
              state: ctx.responseState,
            }),
            headers: {
              Authorization: `Token ${appData.token}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        );
        if (!response.ok) {
          throw new Error('Failed to publish answer in ReferralAnswerDisplay.');
        }
        return await response.json();
      },
    },
  });

  return (
    <form
      aria-labelledby={seed('validate-answer-form')}
      className="space-y-2 flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        send({ type: 'VALIDATE' });
      }}
    >
      <h5 className="text-lg text-gray-700" id={seed('validate-answer-form')}>
        <FormattedMessage {...messages.title} />
      </h5>
      <p className="font-bold">
        <FormattedMessage {...messages.explanation} />
      </p>
      <fieldset className="space-y-2">
        <legend>
          <FormattedMessage {...messages.radioLegend} />
        </legend>
        <div className="list-group">
          <label className="list-group-item bg-white space-x-4">
            <input
              type="radio"
              name={seed('validate-answer-radio-group')}
              aria-labelledby={seed('validate-answer-radio-approve-label')}
              aria-describedby={seed(
                'validate-answer-radio-approve-description',
              )}
              value={types.ReferralAnswerValidationResponseState.VALIDATED}
              onChange={() =>
                send({
                  type: 'UPDATE_STATE',
                  data: types.ReferralAnswerValidationResponseState.VALIDATED,
                })
              }
              checked={
                state.context.responseState ===
                types.ReferralAnswerValidationResponseState.VALIDATED
              }
              className="h-6"
            />
            <div className="flex flex-col">
              <div
                id={seed('validate-answer-radio-approve-label')}
                className={`${
                  state.context.responseState ===
                  types.ReferralAnswerValidationResponseState.VALIDATED
                    ? 'text-primary-500'
                    : ''
                }`}
              >
                <FormattedMessage {...messages.radioLabelApprove} />
              </div>
              <div
                className="text-gray-500"
                id={seed('validate-answer-radio-approve-description')}
              >
                <FormattedMessage
                  {...messages.radioDescriptionApprove}
                  values={{ requester: getUserFullname(referral.user) }}
                />
              </div>
            </div>
          </label>
          <label className="list-group-item bg-white space-x-4">
            <input
              type="radio"
              name={seed('validate-answer-radio-group')}
              aria-labelledby={seed('validate-answer-radio-reject-label')}
              aria-describedby={seed(
                'validate-answer-radio-reject-description',
              )}
              value={types.ReferralAnswerValidationResponseState.NOT_VALIDATED}
              onChange={() =>
                send({
                  type: 'UPDATE_STATE',
                  data:
                    types.ReferralAnswerValidationResponseState.NOT_VALIDATED,
                })
              }
              className="h-6"
            />
            <div className="flex flex-col">
              <div
                id={seed('validate-answer-radio-reject-label')}
                className={`${
                  state.context.responseState ===
                  types.ReferralAnswerValidationResponseState.NOT_VALIDATED
                    ? 'text-primary-500'
                    : ''
                }`}
              >
                <FormattedMessage {...messages.radioLabelReject} />
              </div>
              <div
                className="text-gray-500"
                id={seed('validate-answer-radio-reject-description')}
              >
                <FormattedMessage {...messages.radioDescriptionReject} />
              </div>
            </div>
          </label>
        </div>
      </fieldset>
      <label htmlFor={seed('validate-answer-comment')}>
        <FormattedMessage {...messages.inputLabel} />
      </label>
      <textarea
        id={seed('validate-answer-comment')}
        cols={40}
        rows={4}
        className="form-control"
        onChange={(e) =>
          send({
            type: 'UPDATE_COMMENT',
            data: e.target.value,
          })
        }
      />
      <div className="flex flex-row items-center justify-between">
        <button
          type="submit"
          className="btn btn-primary relative"
          aria-busy={state.matches('loading')}
          aria-disabled={state.matches('loading')}
        >
          {state.matches('loading') ? (
            <span aria-hidden="true">
              <span className="opacity-0">
                <FormattedMessage
                  {...(state.context.responseState ===
                  types.ReferralAnswerValidationResponseState.VALIDATED
                    ? messages.buttonApprove
                    : messages.buttonReject)}
                />
              </span>
              <Spinner
                size="small"
                color="white"
                className="absolute inset-0"
              />
            </span>
          ) : (
            <FormattedMessage
              {...(state.context.responseState ===
              types.ReferralAnswerValidationResponseState.VALIDATED
                ? messages.buttonApprove
                : messages.buttonReject)}
            />
          )}
        </button>
        {state.matches('failure') ? (
          <div className="text-danger-600" role="alert">
            <FormattedMessage {...messages.formFailure} />
          </div>
        ) : null}
      </div>
    </form>
  );
};
