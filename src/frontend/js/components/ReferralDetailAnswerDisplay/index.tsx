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
import {
  Referral,
  ReferralAnswer,
  ReferralAnswerState,
  ReferralState,
} from 'types';
import { ContextProps } from 'types/context';
import { isUserUnitMember } from 'utils/unit';
import { getUserFullname } from 'utils/user';

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
    defaultMessage: 'Create a revision',
    description:
      'Button to create a new draft answer based on the current one, with modifications.',
    id: 'components.ReferralDetailAnswer.revise',
  },
  send: {
    defaultMessage: 'Send to requester',
    description:
      'Button to publish an answer, allowing the requester to see it, and closing the referral.',
    id: 'components.ReferralDetailAnswer.send',
  },
  sendError: {
    defaultMessage:
      'An error occurred while trying to send the answer to the requester.',
    description:
      'Error message when the answer publication failed in the referral detail answer view.',
    id: 'components.ReferralDetailAnswerDisplay.sendError',
  },
});

const answerDetailMachine = Machine({
  id: 'answerDetailMachine',
  type: 'parallel',
  states: {
    publish: {
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
            onDone: { target: 'success', actions: 'invalidateReferralQueries' },
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
    },
  },
});

interface ReferralDetailAnswerDisplayProps {
  answer: ReferralAnswer;
  referral: Referral;
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
  const canPublishOrRevise =
    answer.state === ReferralAnswerState.DRAFT &&
    referral.state === ReferralState.ASSIGNED &&
    (currentUser?.is_superuser ||
      isUserUnitMember(currentUser, referral.topic.unit));

  const [current, send] = useMachine(answerDetailMachine, {
    actions: {
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
          throw new Error(
            'Failed to get publish answer in ReferralAnswerDisplay.',
          );
        }
        return await response.json();
      },
    },
  });

  return (
    <article
      className={`max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border ${
        answer.state === ReferralAnswerState.DRAFT ? 'border-dashed' : ''
      }`}
      aria-labelledby={seed('referral-answer-article')}
    >
      <h4 id={seed('referral-answer-article')} className="text-4xl mb-6">
        {answer.state === ReferralAnswerState.DRAFT ? (
          <FormattedMessage {...messages.draftAnswerTitle} />
        ) : (
          <FormattedMessage {...messages.publishedAnswerTitle} />
        )}
      </h4>

      <section className="mb-6">
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
      </section>
      <div className="mb-6">
        <RichTextView content={answer.content} />
      </div>
      {answer.attachments.length ? (
        <>
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
        </>
      ) : null}
      {canPublishOrRevise ? (
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex flex-row justify-end space-x-4">
            {answer.created_by.id === currentUser?.id ? (
              <button
                className="btn btn-outline"
                onClick={() => setShowAnswerForm(answer.id)}
              >
                <FormattedMessage {...messages.modify} />
              </button>
            ) : null}
            <button className={`btn btn-outline`}>
              <FormattedMessage {...messages.revise} />
            </button>
            <button
              className={`btn btn-blue ${
                current.matches({ publish: 'loading' }) ? 'cursor-wait' : ''
              }`}
              onClick={() => send('PUBLISH')}
              aria-busy={current.matches({ publish: 'loading' })}
              aria-disabled={current.matches({ publish: 'loading' })}
            >
              {current.matches({ publish: 'loading' }) ? (
                <span aria-hidden="true">
                  <Spinner size="small">
                    {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                  </Spinner>
                </span>
              ) : (
                <FormattedMessage {...messages.send} />
              )}
            </button>
          </div>
          {current.matches({ publish: 'failure' }) ? (
            <div className="text-center text-red-600">
              <FormattedMessage {...messages.sendError} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
