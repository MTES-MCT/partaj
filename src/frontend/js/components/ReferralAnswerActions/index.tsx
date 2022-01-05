import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryClient } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';
import { Machine } from 'xstate';

import { appData } from 'appData';
import {
  DropdownButton,
  DropdownOpenButton,
  useDropdownMenu,
} from 'components/DropdownMenu';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { isUserUnitMember } from 'utils/unit';
import { SendAnswerModal } from './SendAnswerModal';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer the referral',
    description:
      'Button to open the modal that allows a user to send the final answer for a referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.answer',
  },
  dropdownButton: {
    defaultMessage: 'More options',
    description:
      'Accessible message for the button to open the dropdown options menu.',
    id: 'components.ReferralDetailAnswerDisplay.AnswerOptions.dropdownButton',
  },
  modify: {
    defaultMessage: 'Modify',
    description:
      'Text for the button on a referral answer that opens the modification form (for the author only).',
    id: 'components.ReferralDetailAnswer.modify',
  },
  revise: {
    defaultMessage: 'Revise',
    description:
      'Button to create a new draft answer based on the current one, with modifications.',
    id: 'components.ReferralDetailAnswer.revise',
  },
});

const answerDetailMachine = Machine({
  id: 'answerDetailMachine',
  initial: 'idle',
  states: {
    idle: {
      on: {
        REVISE: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'reviseAnswer',
        onDone: {
          target: 'success',
          actions: ['invalidateReferralQueries', 'showRevisionForm'],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'reviseAnswer',
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        REVISE: 'loading',
      },
    },
  },
});

interface ReferralAnswerActionsProps {
  answer: types.ReferralAnswer;
  referral: types.Referral;
}

export const ReferralAnswerActions: React.FC<ReferralAnswerActionsProps> = ({
  answer,
  referral,
}) => {
  const seed = useUIDSeed();
  const queryClient = useQueryClient();
  const dropdown = useDropdownMenu();

  const history = useHistory();
  const { url } = useRouteMatch();

  const { currentUser } = useCurrentUser();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const [current, send] = useMachine(answerDetailMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateReferralQueries: () => {
        queryClient.invalidateQueries(['referrals', referral.id]);
        queryClient.invalidateQueries(['referralactivities']);
      },
      showRevisionForm: (_, event) => {
        if (url.includes(answer.id)) {
          const [__, ...urlParts] = url.split('/').reverse();
          history.push(`${urlParts.reverse().join('/')}/${event.data.id}/form`);
        } else {
          history.push(`${url}/${event.data.id}/form`);
        }
      },
    },
    services: {
      publishAnswer: async () => {
        const response = await fetch(
          `/api/referrals/${referral!.id}/publish_answer/`,
          {
            body: JSON.stringify({ answer: answer.id }),
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
      reviseAnswer: async () => {
        const response = await fetch('/api/referralanswers/', {
          body: JSON.stringify({
            attachments: answer.attachments,
            content: answer.content,
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
            'Failed to create answer revision in ReferralAnswerDisplay.',
          );
        }
        return await response.json();
      },
    },
  });

  const canPublishAnswer =
    answer.state === types.ReferralAnswerState.DRAFT &&
    [
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
    ].includes(referral.state) &&
    referral.units.some((unit) => isUserUnitMember(currentUser, unit));

  const canReviseAnswer = canPublishAnswer && !current.matches('success');

  const canModifyAnswer =
    answer.state === types.ReferralAnswerState.DRAFT &&
    [
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
    ].includes(referral.state) &&
    answer.created_by.id === currentUser?.id;

  return (
    <>
      {canModifyAnswer || canPublishAnswer || canReviseAnswer ? (
        <div className="flex flex-row">
          <div {...dropdown.getContainerProps({ className: 'ml-3' })}>
            <DropdownOpenButton
              {...dropdown.getDropdownButtonProps()}
              aria-labelledby={seed('dropdown-button-title')}
            >
              <svg role="img" className="fill-current block w-6 h-6">
                <title id={seed('dropdown-button-title')}>
                  <FormattedMessage {...messages.dropdownButton} />
                </title>
                <use xlinkHref={`${appData.assets.icons}#icon-three-dots`} />
              </svg>
            </DropdownOpenButton>
            {dropdown.getDropdownContainer(
              <>
                {canModifyAnswer ? (
                  <DropdownButton
                    className="hover:bg-gray-100 focus:bg-gray-100"
                    onClick={() =>
                      history.push(
                        url.includes(answer.id)
                          ? `${url}/form`
                          : `${url}/${answer.id}/form`,
                      )
                    }
                  >
                    <FormattedMessage {...messages.modify} />
                  </DropdownButton>
                ) : null}
                {canReviseAnswer ? (
                  <DropdownButton
                    className="hover:bg-gray-100 focus:bg-gray-100"
                    isLoading={
                      current.matches('loading') || current.matches('waiting')
                    }
                    onClick={() => send('REVISE')}
                  >
                    <FormattedMessage {...messages.revise} />
                  </DropdownButton>
                ) : null}
                {canPublishAnswer ? (
                  <div className="flex flex-row justify-end space-x-4">
                    <DropdownButton
                      className="hover:bg-gray-100 focus:bg-gray-100"
                      onClick={() => setIsPublishModalOpen(true)}
                    >
                      <FormattedMessage {...messages.answer} />
                    </DropdownButton>
                  </div>
                ) : null}
              </>,
            )}
          </div>
        </div>
      ) : null}
      {canReviseAnswer ? (
        <SendAnswerModal
          {...{
            answerId: answer.id,
            referral,
            isPublishModalOpen,
            setIsPublishModalOpen,
          }}
        />
      ) : null}
    </>
  );
};
