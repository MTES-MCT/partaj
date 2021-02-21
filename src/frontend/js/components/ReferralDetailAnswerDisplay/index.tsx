import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryCache } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';
import { assign, Machine } from 'xstate';

import { appData } from 'appData';
import { AttachmentsList } from 'components/AttachmentsList';
import {
  DropdownButton,
  DropdownOpenButton,
  useDropdownMenu,
} from 'components/DropdownMenu';
import { RichTextView } from 'components/RichText/view';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Nullable } from 'types/utils';
import { isUserUnitMember } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { SendAnswerModal } from './SendAnswerModal';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer the referral',
    description:
      'Button to open the modal that allows a user to send the final answer for a referral.',
    id: 'components.ReferralDetailAnswerDisplay.SendAnswerModal.answer',
  },
  attachments: {
    defaultMessage: 'Attachments',
    description: 'Title for the list of attachments on the referral answer.',
    id: 'components.ReferralDetailAnswer.attachments',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswer.byWhom',
  },
  draftAnswerTitle: {
    defaultMessage: 'Referral answer draft',
    description: 'Title for all the draft answers on the referral detail view.',
    id: 'components.ReferralDetailAnswer.draftAnswerTitle',
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
  publishedAnswerTitle: {
    defaultMessage: 'Referral answer',
    description:
      'Title for the final published answer on the referral detail view.',
    id: 'components.ReferralDetailAnswer.publishedAnswerTitle',
  },
  revise: {
    defaultMessage: 'Revise',
    description:
      'Button to create a new draft answer based on the current one, with modifications.',
    id: 'components.ReferralDetailAnswer.revise',
  },
  reviseError: {
    defaultMessage:
      'An error occurred while trying to create a revision for this answer.',
    description:
      'Error message when the answer revision creation failed in the referral detail answer view.',
    id: 'components.ReferralDetailAnswerDisplay.reviseError',
  },
});

interface AnswerDetailMachineContext {
  createdDraft: Nullable<string>;
}

const answerDetailMachine = Machine<AnswerDetailMachineContext>({
  context: {
    createdDraft: null,
  },
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
          target: 'waiting',
          actions: [
            'invalidateReferralQueries',
            'showRevisionForm',
            assign({
              createdDraft: (_, event) => event.data.id,
            }),
          ],
        },
        onError: { target: 'failure', actions: 'handleError' },
        src: 'reviseAnswer',
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
      type: 'final',
    },
    failure: {
      on: {
        REVISE: 'loading',
      },
    },
  },
});

interface ReferralDetailAnswerDisplayProps {
  answer: types.ReferralAnswer;
  referral: types.Referral;
}

export const ReferralDetailAnswerDisplay = ({
  answer,
  referral,
}: ReferralDetailAnswerDisplayProps) => {
  const seed = useUIDSeed();
  const queryCache = useQueryCache();
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
        queryCache.invalidateQueries(['referrals', referral.id]);
        queryCache.invalidateQueries(['referralactivities']);
      },
      scrollToAnswerForm: (context) => {
        document
          .querySelector(`#answer-${context.createdDraft}-form`)!
          .scrollIntoView?.({ behavior: 'smooth' });
      },
      showRevisionForm: (_, event) => {
        const [__, ...urlParts] = url.split('/').reverse();
        history.push(`${urlParts.reverse().join('/')}/${event.data.id}/form`);
      },
    },
    guards: {
      formIsReady: (context) => {
        return !!document.querySelector(`#answer-${context.createdDraft}-form`);
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
    referral.state === types.ReferralState.ASSIGNED &&
    (currentUser?.is_superuser ||
      referral.units.some((unit) => isUserUnitMember(currentUser, unit)));
  const canReviseAnswer = canPublishAnswer && !current.matches('success');

  const canModifyAnswer =
    answer.state === types.ReferralAnswerState.DRAFT &&
    referral.state === types.ReferralState.ASSIGNED &&
    answer.created_by.id === currentUser?.id;

  return (
    <article
      className={`max-w-sm w-full lg:max-w-full border-gray-500 bg-gray-200 p-10 mt-8 mb-8 rounded-xl border space-y-6 ${
        answer.state === types.ReferralAnswerState.DRAFT ? 'border-dashed' : ''
      } overflow-hidden`}
      aria-labelledby={seed('referral-answer-article')}
      id={`answer-${answer.id}`}
    >
      {canModifyAnswer || canPublishAnswer || canReviseAnswer ? (
        <div className="float-right flex flex-row">
          <div {...dropdown.getContainerProps()}>
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
                    onClick={() => history.push(`${url}/form`)}
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

      <h4
        id={seed('referral-answer-article')}
        className="text-4xl"
        // Make sure the dropdown menu does not create unwanted spacing
        style={{ marginTop: 0 }}
      >
        {answer.state === types.ReferralAnswerState.DRAFT ? (
          <FormattedMessage {...messages.draftAnswerTitle} />
        ) : (
          <FormattedMessage {...messages.publishedAnswerTitle} />
        )}
      </h4>

      <div>
        <div className="font-semibold">
          <FormattedMessage
            {...messages.byWhom}
            values={{
              name: getUserFullname(answer.created_by),
              unit_name: referral.units.filter((unit) =>
                isUserUnitMember(answer.created_by, unit),
              )[0].name,
            }}
          />
        </div>
        <div className="text-gray-500">{answer.created_by.email}</div>
        <div className="text-gray-500">{answer.created_by.phone_number}</div>
      </div>

      <div>
        <RichTextView content={answer.content} />
      </div>

      {answer.attachments.length ? (
        <div>
          <h5
            id={seed('referral-answer-attachments')}
            className="text-lg text-gray-500 mb-2"
          >
            <FormattedMessage {...messages.attachments} />
          </h5>
          <AttachmentsList
            attachments={answer.attachments}
            labelId={seed('referral-answer-attachments')}
          />
        </div>
      ) : null}

      {canReviseAnswer && current.matches('failure') ? (
        <div className="flex flex-col">
          <div className="text-center text-danger-600">
            <FormattedMessage {...messages.reviseError} />
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
    </article>
  );
};
