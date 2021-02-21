import React from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralAnswerValidationForm } from 'components/ReferralAnswerValidationForm';
import { ReferralAnswerValidationsList } from 'components/ReferralAnswerValidationsList';
import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailAnswerForm } from 'components/ReferralDetailAnswerForm';
import { Spinner } from 'components/Spinner';
import { useReferral, useReferralAnswer } from 'data';

const messages = defineMessages({
  loadingAnswer: {
    defaultMessage: 'Loading referral answer...',
    description: 'Accessible message for spinner in <ReferralDraftAnswer />.',
    id: 'components.ReferralDraftAnswer.loadingAnswer',
  },
});

interface ReferralDraftAnswerRouteParams {
  answerId: string;
  referralId: string;
}

export const ReferralDraftAnswer: React.FC = () => {
  const { path } = useRouteMatch();
  const { answerId, referralId } = useParams<ReferralDraftAnswerRouteParams>();

  const { data: referral, status: referralStatus } = useReferral(referralId);
  const { data: answer, status: answerStatus } = useReferralAnswer(answerId);

  const statuses = [referralStatus, answerStatus];

  if (statuses.includes(QueryStatus.Error)) {
    return <GenericErrorMessage />;
  }

  if (
    statuses.includes(QueryStatus.Idle) ||
    statuses.includes(QueryStatus.Loading)
  ) {
    return (
      <Spinner>
        <FormattedMessage {...messages.loadingAnswer} />
      </Spinner>
    );
  }

  return (
    <Switch>
      <Route path={`${path}/validation/:validationRequestId`}>
        <ReferralAnswerValidationForm referral={referral!} />
        <ReferralDetailAnswerDisplay answer={answer!} referral={referral!} />
      </Route>

      <Route path={`${path}/form`}>
        <ReferralDetailAnswerForm answerId={answerId} referral={referral!} />
      </Route>

      <Route path={path}>
        <ReferralAnswerValidationsList
          referral={referral!}
          answerId={answerId}
        />
        <ReferralDetailAnswerDisplay answer={answer!} referral={referral!} />
      </Route>
    </Switch>
  );
};
