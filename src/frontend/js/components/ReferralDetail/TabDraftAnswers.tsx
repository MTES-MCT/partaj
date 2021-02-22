import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

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
  const { path, url } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/:answerId`}>
        <ReferralDraftAnswer />
        <Crumb
          key="referral-detail-draft-answers-detail"
          title={<FormattedMessage {...messages.answer} />}
        />
      </Route>

      <Route path={path}>
        <ReferralDraftAnswersList
          referralId={referral.id}
          getAnswerUrl={(answerId: string) => `${url}/${answerId}`}
        />
      </Route>
    </Switch>
  );
};
