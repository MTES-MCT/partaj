import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import ReactModal from 'react-modal';
import { useQueryClient } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Machine } from 'xstate';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { Referral, ReferralAnswer } from 'types';
import { getUserFullname } from 'utils/user';
import {nestedUrls} from "../../const";

const messages = defineMessages({
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
      'You are about to send the answer to ' +
      '{referralUsersCount, plural, one { {name} } other { {restNames} and {lastName} } }' +
      ', definitely marking this referral as answered.',
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
            'moveToPublishedAnswer',
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
  isPublishModalOpen: boolean;
  referral: Referral;
  setIsPublishModalOpen: (isOpen: boolean) => void;
}

export const SendAnswerModal: React.FC<SendAnswerModalProps> = ({
  answerId,
  isPublishModalOpen,
  referral,
  setIsPublishModalOpen,
}) => {
  const history = useHistory();
  const { url } = useRouteMatch();
  const queryClient = useQueryClient();

  const [state, send] = useMachine(sendAnswerMachine, {
    actions: {
      closeModal: () => {
        setIsPublishModalOpen(false);
      },
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateReferralQueries: () => {
        queryClient.invalidateQueries(['referrals', referral.id]);
        queryClient.invalidateQueries(['referralactivities']);
      },
      moveToPublishedAnswer: () => {
        const [_, ...urlParts] = url.split('/').reverse();
        history.push(
          [...urlParts.reverse(), '/', nestedUrls.tracking].join('/'),
        );
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
    <ReactModal
      ariaHideApp={!isTestEnv}
      isOpen={isPublishModalOpen}
      onRequestClose={() => setIsPublishModalOpen(false)}
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
            values={{
              lastName: getUserFullname(
                referral.users[referral.users.length - 1],
              ),
              name: getUserFullname(referral.users[0]),
              restNames: referral.users
                .slice(0, -1)
                .map((user) => getUserFullname(user))
                .join(', '),
              referralUsersCount: referral.users.length,
            }}
          />
        </p>
        <p>
          <FormattedMessage {...messages.modalWarning2} />
        </p>
      </div>
      <div className="flex justify-end bg-gray-300 p-8 space-x-4">
        <button
          className="btn btn-outline"
          onClick={() => setIsPublishModalOpen(false)}
        >
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
              <Spinner size="small" color="white" className="absolute inset-0">
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
  );
};
