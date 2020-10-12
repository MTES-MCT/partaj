import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryCache } from 'react-query';
import { Machine } from 'xstate';

import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  draftAnswer: {
    defaultMessage: 'Create an answer draft',
    description: 'Button to open the answer pane on the referral detail view.',
    id: 'components.ReferralDetailContent.AnswerButton.draftAnswer',
  },
  failedToCreate: {
    defaultMessage: 'Failed to create a new answer draft',
    description:
      'Error message when referral answer creation failed in the referrail detail view.',
    id: 'components.ReferralDetailContent.AnswerButton.failedToCreate',
  },
});

const draftAnswerMachine = Machine({
  id: 'draftAnswerMachine',
  initial: 'ready',
  states: {
    ready: {
      on: {
        SUBMIT: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'draftAnswer',
        onDone: {
          target: 'success',
          actions: ['invalidateRelatedQueries', 'setShowAnswerForm'],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'draftAnswer',
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        SUBMIT: 'loading',
      },
    },
  },
});

interface AnswerButtonProps {
  referral: Referral;
}

export const AnswerButton: React.FC<AnswerButtonProps & ContextProps> = ({
  context,
  referral,
}) => {
  const queryCache = useQueryCache();

  const { showAnswerForm, setShowAnswerForm } = useContext(
    ShowAnswerFormContext,
  );

  const [state, send] = useMachine(draftAnswerMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      setShowAnswerForm: () => {
        setShowAnswerForm(true);
      },
      invalidateRelatedQueries: () => {
        queryCache.invalidateQueries(['referrals', referral.id]);
        queryCache.invalidateQueries(['referralactivities']);
        queryCache.invalidateQueries(['referralanswers']);
      },
    },
    services: {
      draftAnswer: () => async () => {
        const response = await fetch('/api/referralanswers/', {
          body: JSON.stringify({
            referral: referral.id,
          }),
          headers: {
            Authorization: `Token ${context.token}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(
            'Failed to create a new ReferralAnswer in ReferralDetailContent/AnswerButton.',
          );
        }

        return await response.json();
      },
    },
  });

  return !showAnswerForm &&
    [ReferralState.ASSIGNED, ReferralState.RECEIVED].includes(
      referral.state,
    ) ? (
    <div className="flex justify-end mt-6">
      <button
        className={`btn btn-blue focus:shadow-outline ${
          state.matches('loading') ? 'cursor-wait' : ''
        }`}
        onClick={() => send('SUBMIT')}
        aria-busy={state.matches('loading')}
        aria-disabled={state.matches('loading')}
      >
        {state.matches('loading') ? (
          <span aria-hidden="true">
            <Spinner size="small">
              {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
            </Spinner>
          </span>
        ) : (
          <>
            <FormattedMessage {...messages.draftAnswer} />
            {state.matches('failure') ? (
              <div className="mt-4 text-red-500">
                <FormattedMessage {...messages.failedToCreate} />
              </div>
            ) : null}
          </>
        )}
      </button>
    </div>
  ) : null;
};
