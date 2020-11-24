import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryCache } from 'react-query';
import { assign, Machine } from 'xstate';

import { appData } from 'appData';
import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralState } from 'types';
import { Nullable } from 'types/utils';

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

interface DraftAnswerMachineContext {
  createdDraft: Nullable<string>;
}

const draftAnswerMachine = Machine<DraftAnswerMachineContext>({
  id: 'draftAnswerMachine',
  context: {
    createdDraft: null,
  },
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
          target: 'waiting',
          actions: [
            'invalidateRelatedQueries',
            'setShowAnswerForm',
            assign({
              createdDraft: (_, event) => event.data.id,
            }),
          ],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'draftAnswer',
      },
    },
    waiting: {
      after: {
        100: [
          {
            target: 'success',
            cond: 'formIsReady',
            actions: 'scrollToAnswerForm',
          },
          { target: 'waiting' }, // reenter 'waiting' state, in effect doing polling
        ],
      },
    },
    success: {
      on: {
        SUBMIT: 'loading',
      },
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

export const AnswerButton: React.FC<AnswerButtonProps> = ({ referral }) => {
  const queryCache = useQueryCache();

  const { showAnswerForm, setShowAnswerForm } = useContext(
    ShowAnswerFormContext,
  );

  const [state, send] = useMachine(draftAnswerMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryCache.invalidateQueries(['referrals', referral.id]);
        queryCache.invalidateQueries(['referralactivities']);
        queryCache.invalidateQueries(['referralanswers']);
      },
      scrollToAnswerForm: (context) => {
        document
          .querySelector(`#answer-${context.createdDraft}-form`)!
          .scrollIntoView?.({ behavior: 'smooth' });
      },
      setShowAnswerForm: (_, event) => {
        setShowAnswerForm(event.data.id);
      },
    },
    guards: {
      formIsReady: (context) => {
        return !!document.querySelector(`#answer-${context.createdDraft}-form`);
      },
    },
    services: {
      draftAnswer: () => async () => {
        const response = await fetch('/api/referralanswers/', {
          body: JSON.stringify({
            referral: referral.id,
          }),
          headers: {
            Authorization: `Token ${appData.token}`,
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

  return (!showAnswerForm || state.matches('waiting')) &&
    [ReferralState.ASSIGNED, ReferralState.RECEIVED].includes(
      referral.state,
    ) ? (
    <div className="flex justify-end mt-6 items-center">
      {state.matches('failure') ? (
        <div className="text-red-500 mr-4">
          <FormattedMessage {...messages.failedToCreate} />
        </div>
      ) : null}
      <button
        className={`relative btn btn-blue focus:shadow-outline ${
          state.matches('loading') || state.matches('waiting')
            ? 'cursor-wait'
            : ''
        }`}
        onClick={() => send('SUBMIT')}
        aria-busy={state.matches('loading') || state.matches('waiting')}
        aria-disabled={state.matches('loading') || state.matches('waiting')}
      >
        {state.matches('loading') || state.matches('waiting') ? (
          <span aria-hidden="true">
            <span className="opacity-0">
              <FormattedMessage {...messages.draftAnswer} />
            </span>
            <Spinner size="small" color="white" className="absolute inset-0">
              {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
            </Spinner>
          </span>
        ) : (
          <FormattedMessage {...messages.draftAnswer} />
        )}
      </button>
    </div>
  ) : null;
};
