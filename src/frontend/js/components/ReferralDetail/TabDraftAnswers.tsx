import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { ReferralDraftAnswer } from 'components/ReferralDraftAnswer';
import { ReferralDraftAnswersList } from 'components/ReferralDraftAnswersList';
import { Referral } from 'types';

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
