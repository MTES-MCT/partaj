import * as Sentry from '@sentry/react';
import { useMachine } from '@xstate/react';
import React, { useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useQueryCache } from 'react-query';
import { useUIDSeed } from 'react-uid';
import { Machine } from 'xstate';

import { AttachmentsList } from 'components/AttachmentsList';
import { ShowAnswerFormContext } from 'components/ReferralDetail';
import { RichTextView } from 'components/RichText/view';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { ContextProps } from 'types/context';
import { isUserUnitMember } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { AnswerValidations } from './AnswerValidations';
import { SendAnswerModal } from './SendAnswerModal';

const messages = defineMessages({
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

interface ReferralDetailAnswerDisplayProps {
  answer: types.ReferralAnswer;
  referral: types.Referral;
}

export const ReferralDetailAnswerDisplay = ({
  answer,
  context,
  referral,
}: ContextProps & ReferralDetailAnswerDisplayProps) => {
  const seed = useUIDSeed();
  const queryCache = useQueryCache();

  const { setShowAnswerForm } = useContext(ShowAnswerFormContext);

  const { currentUser } = useCurrentUser();
  const canPublishOrReviseAnswer =
    answer.state === types.ReferralAnswerState.DRAFT &&
    referral.state === types.ReferralState.ASSIGNED &&
    (currentUser?.is_superuser ||
      isUserUnitMember(currentUser, referral.topic.unit));

  const canModifyAnswer =
    answer.state === types.ReferralAnswerState.DRAFT &&
    referral.state === types.ReferralState.ASSIGNED &&
    answer.created_by.id === currentUser?.id;

  const [current, send] = useMachine(answerDetailMachine, {
    actions: {
      handleError: (_, event) => {
        Sentry.captureException(event.data);
      },
      invalidateReferralQueries: () => {
        queryCache.invalidateQueries(['referrals', referral.id]);
        queryCache.invalidateQueries(['referralactivities']);
      },
      showRevisionForm: (_, event) => {
        setShowAnswerForm(event.data.id);
      },
    },
    services: {
      publishAnswer: async () => {
        const response = await fetch(
          `/api/referrals/${referral!.id}/publish_answer/`,
          {
            body: JSON.stringify({ answer: answer.id }),
            headers: {
              Authorization: `Token ${context.token}`,
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
            Authorization: `Token ${context.token}`,
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

  return (
    <article
      className={`max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border space-y-6 ${
        answer.state === types.ReferralAnswerState.DRAFT ? 'border-dashed' : ''
      }`}
      aria-labelledby={seed('referral-answer-article')}
      id={`answer-${answer.id}`}
    >
      <h4 id={seed('referral-answer-article')} className="text-4xl">
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
              unit_name: referral.topic.unit.name,
            }}
          />
        </div>
        <div className="text-gray-600">{answer.created_by.email}</div>
        <div className="text-gray-600">{answer.created_by.phone_number}</div>
      </div>

      <div>
        <RichTextView content={answer.content} />
      </div>

      {answer.attachments.length ? (
        <div>
          <h5
            id={seed('referral-answer-attachments')}
            className="text-lg text-gray-600 mb-2"
          >
            <FormattedMessage {...messages.attachments} />
          </h5>
          <AttachmentsList
            attachments={answer.attachments}
            labelId={seed('referral-answer-attachments')}
          />
        </div>
      ) : null}

      {isUserUnitMember(currentUser, referral.topic.unit) ? (
        <AnswerValidations {...{ answerId: answer.id, context, referral }} />
      ) : null}

      {canPublishOrReviseAnswer || canModifyAnswer ? (
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row justify-end space-x-4">
            {canModifyAnswer ? (
              <button
                className="btn btn-outline"
                onClick={() => setShowAnswerForm(answer.id)}
              >
                <FormattedMessage {...messages.modify} />
              </button>
            ) : null}
            {canPublishOrReviseAnswer ? (
              <>
                {current.matches('success') ? null : (
                  <button
                    className={`relative btn btn-outline ${
                      current.matches('loading') ? 'cursor-wait' : ''
                    }`}
                    onClick={() => send('REVISE')}
                    aria-busy={current.matches('loading')}
                    aria-disabled={current.matches('loading')}
                  >
                    {current.matches('loading') ? (
                      <span aria-hidden="true">
                        <span className="opacity-0">
                          <FormattedMessage {...messages.revise} />
                        </span>
                        <Spinner size="small" className="absolute inset-0">
                          {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                        </Spinner>
                      </span>
                    ) : (
                      <FormattedMessage {...messages.revise} />
                    )}
                  </button>
                )}
                <SendAnswerModal
                  {...{ answerId: answer.id, context, referral }}
                />
              </>
            ) : null}
          </div>
          {current.matches('failure') ? (
            <div className="text-center text-red-600">
              <FormattedMessage {...messages.reviseError} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
