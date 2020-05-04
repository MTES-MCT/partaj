import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { uid } from 'react-uid';

import { Spinner } from 'components/Spinner';
import { Referral, ReferralState } from 'types';
import { ContextProps } from 'types/context';
import { Nullable } from 'types/utils';
import { handle } from 'utils/errors';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { getUserFullname } from 'utils/users';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswer.answer',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswer.byWhom',
  },
  contentInputLabel: {
    defaultMessage: 'Add an answer for this referral',
    description: 'Label for the content input field for a referral answer',
    id: 'components.ReferralDetailAnswer.contentInputLabel',
  },
  loadingAnswer: {
    defaultMessage: 'Loading answer...',
    description:
      'Accessible loading message for the answer spinner on the referral detail view',
    id: 'components.ReferralDetailAnswer.loadingAnswer',
  },
  startWriting: {
    defaultMessage: 'You need to start writing an answer to send it.',
    description:
      'Explanation next to the disabled submit button when writing a referral answer.',
    id: 'components.ReferralDetailAnswer.startWriting',
  },
  submitAnswer: {
    defaultMessage: 'Answer the referral',
    description: 'Button to submit the answer to a referral',
    id: 'components.ReferralDetailAnswer.submitAnswer',
  },
});

interface ReferralDetailAnswerProps {
  referralId: number;
}

export const ReferralDetailAnswer = ({
  context,
  referralId,
}: ReferralDetailAnswerProps & ContextProps) => {
  const intl = useIntl();
  const [answerContent, setAnswerContent] = useState('');
  const [referral, setReferral] = useState<Nullable<Referral>>(null);

  useAsyncEffect(async () => {
    const response = await fetch(`/api/referrals/${referralId}/`);
    if (!response.ok) {
      return handle(
        new Error('Failed to get referral in ReferralDetailAnswer.'),
      );
    }
    const newReferral: Referral = await response.json();
    setReferral(newReferral);
  }, []);

  let content: JSX.Element;
  if (referral?.state === ReferralState.ANSWERED) {
    const author = referral.topic.unit.members.find(
      (member) => member.id === referral.answers[0].created_by,
    );
    content = (
      <>
        <FormattedMessage
          {...messages.byWhom}
          values={{
            name: getUserFullname(author!),
            unit_name: referral.topic.unit.name,
          }}
        />
        <p>{referral.answers[0].content}</p>
      </>
    );
  } else if (referral) {
    const answerReferral = async () => {
      const response = await fetch(`/api/referrals/${referral!.id}/answer/`, {
        body: JSON.stringify({ content: answerContent }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': context.csrftoken,
        },
        method: 'POST',
      });
      if (!response.ok) {
        return handle(
          new Error('Failed to answer referral in ReferralDetailAnswer.'),
        );
      }
      const updatedReferral: Referral = await response.json();
      setReferral(updatedReferral);
    };

    const isAnswerContentValid = answerContent.length > 5;
    content = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isAnswerContentValid) {
            answerReferral();
          }
        }}
      >
        <div className="form-group">
          <label htmlFor={uid(referral.id, 1)}>
            <FormattedMessage {...messages.contentInputLabel} />
          </label>
          <textarea
            className="form-control"
            cols={40}
            rows={8}
            id={uid(referral.id, 1)}
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
          ></textarea>
          <div className="d-flex mt-3 align-items-center">
            <input
              type="submit"
              className={`btn btn-info d-flex ${
                isAnswerContentValid ? '' : 'disabled'
              }`}
              value={intl.formatMessage(messages.submitAnswer)}
            />
            {isAnswerContentValid ? null : (
              <div className="d-flex ml-3 text-muted">
                <FormattedMessage {...messages.startWriting} />
              </div>
            )}
          </div>
        </div>
      </form>
    );
  }

  return (
    <>
      <h2>
        <FormattedMessage {...messages.answer} />
      </h2>
      {!referral ? (
        <Spinner>
          <FormattedMessage {...messages.loadingAnswer} />
        </Spinner>
      ) : (
        content!
      )}
    </>
  );
};
