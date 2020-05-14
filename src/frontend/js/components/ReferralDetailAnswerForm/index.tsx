import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUID, useUIDSeed } from 'react-uid';

import { Referral } from 'types';
import { handle } from 'utils/errors';
import { ContextProps } from 'types/context';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswer.answer',
  },
  contentInputLabel: {
    defaultMessage: 'Add an answer for this referral',
    description: 'Label for the content input field for a referral answer',
    id: 'components.ReferralDetailAnswer.contentInputLabel',
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

interface ReferralDetailAnswerFormProps {
  referral: Referral;
  setReferral: (referral: Referral) => void;
}

export const ReferralDetailAnswerForm = ({
  context,
  referral,
  setReferral,
}: ReferralDetailAnswerFormProps & ContextProps) => {
  const uid = useUIDSeed();
  const [answerContent, setAnswerContent] = useState('');
  const isAnswerContentValid = answerContent.length > 5;

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isAnswerContentValid) {
          answerReferral();
        }
      }}
      aria-labelledby={uid('form-label')}
    >
      <h4 id={uid('form-label')}>
        <FormattedMessage {...messages.answer} />
      </h4>

      <div className="form-group">
        <label htmlFor={uid('content-input-label')}>
          <FormattedMessage {...messages.contentInputLabel} />
        </label>
        <textarea
          className="form-control"
          cols={40}
          rows={8}
          id={uid('content-input-label')}
          value={answerContent}
          onChange={(e) => setAnswerContent(e.target.value)}
        ></textarea>
        <div className="d-flex mt-3 align-items-center">
          <button
            type="submit"
            className={`btn btn-info d-flex ${
              isAnswerContentValid ? '' : 'disabled'
            }`}
          >
            <FormattedMessage {...messages.submitAnswer} />
          </button>
          {isAnswerContentValid ? null : (
            <div className="d-flex ml-3 text-muted">
              <FormattedMessage {...messages.startWriting} />
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
