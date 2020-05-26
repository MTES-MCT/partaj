import React, { useState, useContext } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { Referral } from 'types';
import { handle } from 'utils/errors';
import { ContextProps } from 'types/context';
import { ReferralActivityIndicatorLook } from 'components/ReferralActivityDisplay/ReferralActivityIndicatorLook';
import { useCurrentUser } from 'data/useCurrentUser';
import { getUserFullname } from 'utils/user';
import { ShowAnswerFormContext } from 'components/ReferralDetail';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Referral answer',
    description: 'Title for the answer part of the referral detail view',
    id: 'components.ReferralDetailAnswerForm.answer',
  },
  byWhom: {
    defaultMessage: 'By {name}, {unit_name}',
    description: 'Author of the referral answer',
    id: 'components.ReferralDetailAnswerForm.byWhom',
  },
  contentInputLabel: {
    defaultMessage: 'Add an answer for this referral',
    description: 'Label for the content input field for a referral answer',
    id: 'components.ReferralDetailAnswerForm.contentInputLabel',
  },
  indicatorIsWritingAnAnswer: {
    defaultMessage: '{ authorName } is writing an answer',
    description:
      'Timeline indicator text for the user currently writing a referral answer',
    id: 'components.ReferralDetailAnswerForm.indicatorIsWritingAnAnswer',
  },
  indicatorRightNow: {
    defaultMessage: 'Right now...',
    description:
      'Timeline indicator timing information for the user currently writing a referral answer',
    id: 'components.ReferralDetailAnswerForm.indicatorRightNow',
  },
  indicatorSomeone: {
    defaultMessage: 'Someone',
    description:
      "Replace the current user's name if it is missing in the timeline element",
    id: 'components.ReferralDetailAnswerForm.indicatorSomeone',
  },
  startWriting: {
    defaultMessage: 'You need to start writing an answer to send it.',
    description:
      'Explanation next to the disabled submit button when writing a referral answer.',
    id: 'components.ReferralDetailAnswerForm.startWriting',
  },
  submitAnswer: {
    defaultMessage: 'Answer the referral',
    description: 'Button to submit the answer to a referral',
    id: 'components.ReferralDetailAnswerForm.submitAnswer',
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
  const intl = useIntl();
  const uid = useUIDSeed();

  const { currentUser } = useCurrentUser();
  const { setShowAnswerForm } = useContext(ShowAnswerFormContext);

  const [answerContent, setAnswerContent] = useState('');
  const isAnswerContentValid = answerContent.length > 5;

  const answerReferral = async () => {
    const response = await fetch(`/api/referrals/${referral!.id}/answer/`, {
      body: JSON.stringify({ content: answerContent }),
      headers: {
        Authorization: `Token ${context.token}`,
        'Content-Type': 'application/json',
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
    setShowAnswerForm(false);
  };

  return (
    <>
      <ReferralActivityIndicatorLook
        context={context}
        topLine={
          <FormattedMessage
            {...messages.indicatorIsWritingAnAnswer}
            values={{
              authorName: currentUser
                ? getUserFullname(currentUser)
                : intl.formatMessage(messages.indicatorSomeone),
            }}
          />
        }
        bottomLine={<FormattedMessage {...messages.indicatorRightNow} />}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isAnswerContentValid) {
            answerReferral();
          }
        }}
        aria-labelledby={uid('form-label')}
        className="max-w-sm w-full lg:max-w-full border-gray-600 p-10 mt-8 mb-8 rounded-xl border"
      >
        <h4 id={uid('form-label')} className="text-4xl mb-6">
          <FormattedMessage {...messages.answer} />
        </h4>

        <section className="mb-6">
          <div className="font-semibold">
            <FormattedMessage
              {...messages.byWhom}
              values={{
                name: getUserFullname(currentUser!),
                unit_name: referral.topic.unit.name,
              }}
            />
          </div>
          <div className="text-gray-600">{currentUser?.email}</div>
          <div className="text-gray-600">{currentUser?.phone_number}</div>
        </section>

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
        <div className="flex mt-4 items-center">
          <button
            type="submit"
            className={`btn btn-teal d-flex ${
              isAnswerContentValid ? '' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <FormattedMessage {...messages.submitAnswer} />
          </button>
          {isAnswerContentValid ? null : (
            <div className="flex ml-4 text-gray-600">
              <FormattedMessage {...messages.startWriting} />
            </div>
          )}
        </div>
      </form>
    </>
  );
};
