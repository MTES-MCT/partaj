import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Crumb } from 'components/BreadCrumbs';
import { ReferralDraftAnswer } from 'components/ReferralDraftAnswer';
import { ReferralDraftAnswersList } from 'components/ReferralDraftAnswersList';
import { Referral } from 'types';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Title for the breadcrumb for the answer in <ReferralDetail />',
    id: 'components.ReferralDetail.TabDraftAnswers.answer',
  },
});

interface TabDraftAnswersProps {
  referral: Referral;
}

export const TabDraftAnswers: React.FC<TabDraftAnswersProps> = ({
  referral,
}) => {
  const location = useLocation();
  const baseUrl = location.pathname.replace(/\/$/, '');

  return (
    <Routes>
      <Route
        path=":answerId/*"
        element={
          <>
            <ReferralDraftAnswer />
            <Crumb
              key="referral-detail-draft-answers-detail"
              title={<FormattedMessage {...messages.answer} />}
            />
          </>
        }
      />

      <Route
        index
        element={
          <ReferralDraftAnswersList
            referralId={String(referral.id)}
            getAnswerUrl={(answerId: string) => `${baseUrl}/${answerId}`}
          />
        }
      />
    </Routes>
  );
};
