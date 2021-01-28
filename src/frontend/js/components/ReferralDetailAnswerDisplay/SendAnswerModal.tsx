import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { useQueryCache } from 'react-query';
import { Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralAnswer, ReferralAnswerState } from 'types';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer the referral',
    description:
      'Button to open the modal that allows a user to send the final answer for a referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.answer',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description:
      'Button to cancel sending a referral answer and close the modal.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.cancel',
  },
  modalTitle: {
    defaultMessage: 'Referral #{ id }',
    description: 'Title for the modal to confirm sending a referral answer.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.modalTitle',
  },
  modalWarning1: {
    defaultMessage:
      'You are about to send the answer to { requester }, definitely marking this referral ' +
      'as answered.',
    description:
      'Paragraph warning the user of what will happen after their answer a referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.modalWarning1',
  },
  modalWarning2: {
    defaultMessage:
      'It will not be possible to change the answer or create new draft answers afterwards.',
    description:
      'Paragraph warning the user of what will happen after their answer a referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.modalWarning2',
  },
  send: {
    defaultMessage: 'Send the answer',
    description:
      'Button to publish an answer, allowing the requester to see it, and closing the referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.send',
  },
  sendError: {
    defaultMessage:
      'An error occurred while trying to send the answer to the requester.',
    description:
      'Error message when the answer publication failed in the referral detail answer view.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.sendError',
  },
});

// The `setAppElement` needs to happen in proper code but breaks our testing environment.
// This workaround is not satisfactory but it allows us to both test <SendAnswerModal />
// and avoid compromising accessibility in real-world use.
const isTestEnv = typeof jest !== 'undefined';
if (!isTestEnv) {
  ReactModal.setAppElement('#app-root');
}

const sendAnswerMachine = Machine({
  id: 'sendAnswerMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        PUBLISH: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'publishAnswer',
        onDone: {
          target: 'success',
          actions: [
            'invalidateReferralQueries',
            'closeModal',
            'scrollToPublishedAnswer',
          ],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'publishAnswer',
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        PUBLISH: 'loading',
      },
    },
  },
});

interface SendAnswerModalProps {
  answerId: ReferralAnswer['id'];
  referral: Referral;
}

export const SendAnswerModal: React.FC<SendAnswerModalProps> = ({
  answerId,
  referral,
}) => {
  const queryCache = useQueryCache();
  const [isOpen, setIsOpen] = useState(false);

  const [state, send] = useMachine(sendAnswerMachine, {
    actions: {
      closeModal: () => {
        setIsOpen(false);
      },
      scrollToPublishedAnswer: (_, event) => {
        setTimeout(() => {
          const referral: Referral = event.data;
          const answer = referral.answers.find(
            (answer) => answer.state === ReferralAnswerState.PUBLISHED,
          );
          document
            .querySelector(`#answer-${answer?.id}`)
            ?.scrollIntoView({ behavior: 'smooth' });
        }, 1600);
      },
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateReferralQueries: () => {
        queryCache.invalidateQueries(['referrals', referral.id]);
        queryCache.invalidateQueries(['referralactivities']);
      },
    },
    services: {
      publishAnswer: async () => {
        const response = await fetch(
          `/api/referrals/${referral.id}/publish_answer/`,
          {
            body: JSON.stringify({ answer: answerId }),
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
    <>
      <button className="btn btn-outline" onClick={() => setIsOpen(true)}>
        <FormattedMessage {...messages.answer} />
      </button>
      <ReactModal
        ariaHideApp={!isTestEnv}
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        style={{
          content: {
            maxWidth: '32rem',
            padding: '0',
            position: 'static',
          },
          overlay: {
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          },
        }}
      >
        <div className="p-8 space-y-4">
          <h2 className="text-xl">
            <FormattedMessage
              {...messages.modalTitle}
              values={{ id: referral.id }}
            />
          </h2>
          <p>
            <FormattedMessage
              {...messages.modalWarning1}
              values={{ requester: getUserFullname(referral.user) }}
            />
          </p>
          <p>
            <FormattedMessage {...messages.modalWarning2} />
          </p>
        </div>
        <div className="flex justify-end bg-gray-300 p-8 space-x-4">
          <button className="btn btn-outline" onClick={() => setIsOpen(false)}>
            <FormattedMessage {...messages.cancel} />
          </button>
          <button
            className={`relative btn btn-primary ${
              state.matches('loading') ? 'cursor-wait' : ''
            }`}
            onClick={() => send('PUBLISH')}
            aria-busy={state.matches('loading')}
            aria-disabled={state.matches('loading')}
          >
            {state.matches('loading') ? (
              <span aria-hidden="true">
                <span className="opacity-0">
                  <FormattedMessage {...messages.send} />
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
              <FormattedMessage {...messages.send} />
            )}
          </button>
          {state.matches('failure') ? (
            <div className="text-center text-danger-600">
              <FormattedMessage {...messages.sendError} />
            </div>
          ) : null}
        </div>
      </ReactModal>
    </>
  );
};
