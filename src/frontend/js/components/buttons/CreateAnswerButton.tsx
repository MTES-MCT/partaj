import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralState } from 'types';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  draftAnswer: {
    defaultMessage: 'Create a draft answer',
    description: 'Button to open the answer pane on the referral detail view.',
    id: 'components.CreateAnswerButton.draftAnswer',
  },
  failedToCreate: {
    defaultMessage: 'Failed to create a new answer draft',
    description:
      'Error message when referral answer creation failed in the referrail detail view.',
    id: 'components.CreateAnswerButton.failedToCreate',
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
          actions: [
            'invalidateRelatedQueries',
            'refetchReferral',
            'showAnswerForm',
          ],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'draftAnswer',
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

interface CreateAnswerButtonProps {
  getAnswerUrl: (answerId: string) => string;
  referral: Referral;
}

export const CreateAnswerButton: React.FC<CreateAnswerButtonProps> = ({
  getAnswerUrl,
  referral,
}) => {
  const queryClient = useQueryClient();
  const history = useHistory();
  const { refetch } = useContext(ReferralContext);
  const [state, send] = useMachine(draftAnswerMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateRelatedQueries: () => {
        queryClient.invalidateQueries(['referrals', referral.id]);
        queryClient.invalidateQueries(['referralactivities']);
        queryClient.invalidateQueries(['referralanswers']);
      },
      showAnswerForm: (_, event) => {
        history.push(getAnswerUrl(event.data.id));
      },
      refetchReferral: () => {
        refetch();
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
            'Failed to create a new ReferralAnswer in CreateAnswerButton.',
          );
        }

        return await response.json();
      },
    },
  });

  return [
    ReferralState.ASSIGNED,
    ReferralState.IN_VALIDATION,
    ReferralState.PROCESSING,
    ReferralState.RECEIVED,
  ].includes(referral.state) ? (
    <button
      className={`relative btn btn-primary focus:ring ${
        state.matches('loading') ? 'cursor-wait' : ''
      }`}
      onClick={() => send('SUBMIT')}
      aria-busy={state.matches('loading')}
      aria-disabled={state.matches('loading')}
    >
      {state.matches('loading') ? (
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
  ) : null;
};
