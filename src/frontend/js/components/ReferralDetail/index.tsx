import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';
import {
  Link,
  NavLink,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from 'react-router-dom';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralDetailAnswerDisplay } from 'components/ReferralDetailAnswerDisplay';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { ReferralDetailContent } from 'components/ReferralDetailContent';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { ReferralAnswerState, ReferralState } from 'types';
import { TabDraftAnswers } from './TabDraftAnswers';
import { TabTracking } from './TabTracking';

const messages = defineMessages({
  dueDate: {
    defaultMessage: 'Due date: {date}',
    description: 'Due date for the referral in the referral detail view.',
    id: 'components.ReferralDetail.dueDate',
  },
  linkToAnswer: {
    defaultMessage: 'Answer',
    description:
      'Link title for the tab link to the final answer for the referral.',
    id: 'components.ReferralDetail.linkToAnswer',
  },
  linkToContent: {
    defaultMessage: 'Referral',
    description: 'Link title for the tab link to the referral content.',
    id: 'components.ReferralDetail.linkToContent',
  },
  linkToDraftAnswers: {
    defaultMessage: 'Draft answers',
    description:
      'Link title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralDetail.linkToDraftAnswers',
  },
  linkToTracking: {
    defaultMessage: 'Tracking',
    description: 'Link title for the tab link to the referral tracking.',
    id: 'components.ReferralDetail.linkToTracking',
  },
  loadingReferral: {
    defaultMessage: 'Loading referral #{ referralId }...',
    description:
      'Accessibility message for the spinner while loading the refeerral in referral detail view.',
    id: 'components.ReferralDetail.loadingReferral',
  },
  request: {
    defaultMessage: 'Request: {requester}',
    description: 'Requested for the referral in the referral detail view.',
    id: 'components.ReferralDetail.request',
  },
});

export const nestedUrls = {
  // No URL for tracking as it's the default tab
  answer: 'answer',
  content: 'content',
  draftAnswers: 'draft-answers',
};

interface ReferralDetailRouteParams {
  referralId: string;
}

export const ReferralDetail: React.FC = () => {
  const { path, url } = useRouteMatch();
  const { referralId } = useParams<ReferralDetailRouteParams>();

  // We have to compute whether the "Tracking" nav link is active manually as it is both
  // one of the views in Referral Detail and the default view (without additional url parts)
  const isOnTracking = useRouteMatch({ path, exact: true });

  const { status, data: referral } = useReferral(referralId);

  switch (status) {
    case QueryStatus.Idle:
    case QueryStatus.Loading:
      return (
        <Spinner size={'large'}>
          <FormattedMessage
            {...messages.loadingReferral}
            values={{ referralId }}
          />
        </Spinner>
      );

    case QueryStatus.Error:
      return <GenericErrorMessage />;

    case QueryStatus.Success:
      return (
        <section className="max-w-4xl container mx-auto flex-grow flex flex-col space-y-8 pb-8">
          <div className="flex flex-row items-center justify-between space-x-6">
            <div className="flex flex-col">
              <h1 className="text-4xl">{referral!.object}</h1>
              <div className="flex flex-row space-x-2">
                <span>
                  <FormattedMessage
                    {...messages.dueDate}
                    values={{
                      date: (
                        <FormattedDate
                          year="numeric"
                          month="long"
                          day="numeric"
                          value={referral!.due_date}
                        />
                      ),
                    }}
                  />
                </span>
                <span>•</span>
                <span>
                  <FormattedMessage
                    {...messages.request}
                    values={{ requester: referral!.requester }}
                  />
                </span>
                <span>•</span>
                <span>#{referral!.id}</span>
              </div>
            </div>
            <div className="px-4">
              <ReferralStatusBadge status={referral!.state} />
            </div>
            <ReferralDetailAssignment referral={referral!} />
          </div>

          <div className="tab-group">
            <Link
              className={`tab space-x-2 ${isOnTracking ? 'active' : ''}`}
              to={url}
              aria-current={isOnTracking ? 'true' : 'false'}
            >
              <FormattedMessage {...messages.linkToTracking} />
            </Link>
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.content}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.linkToContent} />
            </NavLink>
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.draftAnswers}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.linkToDraftAnswers} />
            </NavLink>
            {referral!.state === ReferralState.ANSWERED ? (
              <NavLink
                className="tab space-x-2"
                to={`${url}/${nestedUrls.answer}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.linkToAnswer} />
              </NavLink>
            ) : (
              <a className="tab space-x-2 disabled">
                <FormattedMessage {...messages.linkToAnswer} />
              </a>
            )}
          </div>

          <Switch>
            <Route exact path={`${path}/${nestedUrls.content}`}>
              <ReferralDetailContent referral={referral!} />
            </Route>

            <Route path={`${path}/${nestedUrls.draftAnswers}`}>
              <TabDraftAnswers referral={referral!} />
            </Route>

            <Route exact path={`${path}/${nestedUrls.answer}`}>
              <ReferralDetailAnswerDisplay
                referral={referral!}
                answer={
                  referral?.answers.find(
                    (answer) => answer.state === ReferralAnswerState.PUBLISHED,
                  )!
                }
              />
            </Route>

            <Route path={path}>
              <TabTracking referralId={referralId} />
            </Route>
          </Switch>
        </section>
      );
  }
};
