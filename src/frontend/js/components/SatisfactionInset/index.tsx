import React, { useContext } from 'react';
import { SmileyHappyIcon, SmileyNormalIcon, SmileyUnhappyIcon } from '../Icons';
import { ReferralContext } from '../../data/providers/ReferralProvider';
import { CurrentUserContext } from '../../data/useCurrentUser';
import { useSatisfactionAction } from '../../data/referral';
import { SurveyExplanation } from './SurveyExplanation';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  successMessageFirstParagraph: {
    defaultMessage: 'Thank you for your participation!',
    description: 'survey successful message 1st paragraph',
    id: 'components.SatisfactionInset.successMessageFirstParagraph',
  },
  successMessageSecondParagraph: {
    defaultMessage: 'Your opinion has been taken into account',
    description: 'survey successful message 2nd paragraph',
    id: 'components.SatisfactionInset.successMessageSecondParagraph',
  },
});

export const SatisfactionInset = ({
  question,
  url,
}: {
  question: string;
  url: string;
}) => {
  const { referral } = useContext(ReferralContext);
  const { currentUser } = useContext(CurrentUserContext);
  const mutation = useSatisfactionAction(url);

  return (
    <>
      {referral && currentUser && (
        <div
          className={
            'bg-white p-4 max-w-320 relative flex flex-col text-center justify-center items-center rounded-sm border border-gray-300 shadow-sm'
          }
        >
          {mutation.isSuccess && (
            <div className="flex items-center justify-center flex-col bg-white z-20 absolute inset-0">
              <p>
                <FormattedMessage {...messages.successMessageFirstParagraph} />
              </p>
              <p>
                <FormattedMessage {...messages.successMessageSecondParagraph} />
              </p>
            </div>
          )}

          <div>
            <span>{question}</span>
            <div className="space-x-4">
              <button
                className="rounded-sm hover:bg-gray-200"
                disabled={mutation.isLoading}
                onClick={() =>
                  mutation.mutate({ id: String(referral.id), choice: 0 })
                }
              >
                <SmileyUnhappyIcon className="fill-dsfr-danger-500 w-12 h-12"></SmileyUnhappyIcon>
              </button>
              <button
                className="rounded-sm hover:bg-gray-200"
                disabled={mutation.isLoading}
                onClick={() =>
                  mutation.mutate({ id: String(referral.id), choice: 5 })
                }
              >
                <SmileyNormalIcon className="fill-dsfr-warning-500 w-12 h-12"></SmileyNormalIcon>
              </button>
              <button
                className="rounded-sm hover:bg-gray-200"
                disabled={mutation.isLoading}
                onClick={() =>
                  mutation.mutate({ id: String(referral.id), choice: 10 })
                }
              >
                <SmileyHappyIcon className="fill-dsfr-success-500 w-12 h-12"></SmileyHappyIcon>
              </button>
            </div>
            <SurveyExplanation />
          </div>
        </div>
      )}
    </>
  );
};
