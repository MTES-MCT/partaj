import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import {
  NavLink,
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Crumb } from 'components/BreadCrumbs';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { ReferralDetailContent } from 'components/ReferralDetailContent';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferral } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { ReferralState } from 'types';
import { TabAnswer } from './TabAnswer';
import { TabDraftAnswers } from './TabDraftAnswers';
import { TabMessages } from './TabMessages';
import { TabTracking } from './TabTracking';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Link & breadcrumb title for the tab link to the final answer for the referral.',
    id: 'components.ReferralDetail.answer',
  },
  crumbContent: {
    defaultMessage: 'Content',
    description:
      'Title for the breadcrumb for the referral content in referral detail.',
    id: 'components.ReferralDetail.crumbContent',
  },
  currentProgressItem: {
    defaultMessage: 'Current status:',
    description:
      'Accessible helper to mark out the current progress bar status in a non-visual way.',
    id: 'components.referralDetail.currentProgressItem',
  },
  draftAnswers: {
    defaultMessage: 'Draft answers',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralDetail.draftAnswers',
  },
  dueDate: {
    defaultMessage: 'Due date: {date}',
    description: 'Due date for the referral in the referral detail view.',
    id: 'components.ReferralDetail.dueDate',
  },
  linkToContent: {
    defaultMessage: 'Referral',
    description: 'Link title for the tab link to the referral content.',
    id: 'components.ReferralDetail.linkToContent',
  },
  loadingReferral: {
    defaultMessage: 'Loading referral #{ referralId }...',
    description:
      'Accessibility message for the spinner while loading the refeerral in referral detail view.',
    id: 'components.ReferralDetail.loadingReferral',
  },
  messages: {
    defaultMessage: 'Additional information',
    description:
      'Link and breadcrumb title for the tab link to the referral messages.',
    id: 'components.ReferralDetail.messages',
  },
  progressStep1: {
    defaultMessage: 'Referral sent',
    description:
      'Text for the first step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep1',
  },
  progressStep2: {
    defaultMessage: 'Unit assigned',
    description:
      'Text for the second step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep2',
  },
  progressStep3: {
    defaultMessage: 'Member assigned',
    description:
      'Text for the third step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep3',
  },
  progressStep4: {
    defaultMessage: 'Currently processing',
    description:
      'Text for the fourth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep4',
  },
  progressStep5: {
    defaultMessage: 'Undergoing validation',
    description:
      'Text for the fifth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep5',
  },
  progressStep6: {
    defaultMessage: 'Answer sent',
    description:
      'Text for the sixth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep6',
  },
  request: {
    defaultMessage: 'Request: {requester}',
    description: 'Requested for the referral in the referral detail view.',
    id: 'components.ReferralDetail.request',
  },
  titleNoObject: {
    defaultMessage: 'Referral #{ id }',
    description:
      'Title of a referral detail view for referrals without an object.',
    id: 'components.ReferralDetail.titleNoObject',
  },
  tracking: {
    defaultMessage: 'Tracking',
    description:
      'Link & breadcrumb title for the tab link to the referral tracking.',
    id: 'components.ReferralDetail.tracking',
  },
});

export const nestedUrls = {
  answer: 'answer',
  content: 'content',
  draftAnswers: 'draft-answers',
  messages: 'messages',
  tracking: 'tracking',
};

type ProgressBarElementProps = React.PropsWithChildren<{
  position: number;
  referralStatusAsNumber: number;
}>;

const ProgressBarElement = ({
  children,
  position,
  referralStatusAsNumber,
}: ProgressBarElementProps) => {
  const seed = useUIDSeed();

  return (
    <li
      className={`progressbar-element ${
        referralStatusAsNumber === position
          ? 'active'
          : referralStatusAsNumber > position
          ? 'done'
          : ''
      }`}
    >
      <div className="progressbar-circle">
        {referralStatusAsNumber === position ? (
          <svg
            role="img"
            className="w-3 h-3 fill-current"
            aria-labelledby={seed('current-progress-item')}
          >
            <title id={seed('current-progress-item')}>
              <FormattedMessage {...messages.currentProgressItem} />
            </title>
            <use xlinkHref={`${appData.assets.icons}#icon-tick`} />
          </svg>
        ) : null}
      </div>
      {children}
      {position > 1 ? <div className="progressbar-link" /> : null}
    </li>
  );
};

interface ReferralDetailRouteParams {
  referralId: string;
}

export const ReferralDetail: React.FC = () => {
  const { path, url } = useRouteMatch();
  const { referralId } = useParams<ReferralDetailRouteParams>();

  const { currentUser } = useCurrentUser();
  const { status, data: referral } = useReferral(referralId);

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size={'large'}>
          <FormattedMessage
            {...messages.loadingReferral}
            values={{ referralId }}
          />
        </Spinner>
      );

    case 'success':
      const userIsUnitMember =
        currentUser &&
        currentUser.memberships.some((membership) =>
          referral!.units.map((unit) => unit.id).includes(membership.unit),
        );

      // Convert the text status to a number so we can more easily manage our progress bar.
      const statusToNumber = {
        [ReferralState.RECEIVED]: 2,
        [ReferralState.ASSIGNED]: 3,
        [ReferralState.PROGRESS]: 4,
        [ReferralState.VALIDATION]: 5,
        [ReferralState.ANSWERED]: 6,
        [ReferralState.CLOSED]: 0,
        [ReferralState.INCOMPLETE]: 0,
      };
      const statusAsProgressNumber = referral
        ? statusToNumber[referral.state]
        : 0;

      return (
        <section className="max-w-4xl container mx-auto flex-grow flex flex-col space-y-8 pb-8">
          <div className="flex flex-row items-center justify-between space-x-6">
            <div className="flex flex-col">
              <h1 className="text-4xl">
                {referral!.object || (
                  <FormattedMessage
                    {...messages.titleNoObject}
                    values={{ id: referral!.id }}
                  />
                )}
              </h1>
              <div className="space-x-2">
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

          {referral &&
          statusAsProgressNumber > 0 &&
          referral.user.id === currentUser?.id ? (
            <div className="mx-8">
              <ul className="progressbar">
                {[1, 2, 3, 4, 5, 6].map((position) => (
                  <ProgressBarElement
                    key={position}
                    position={position}
                    referralStatusAsNumber={statusAsProgressNumber}
                  >
                    <FormattedMessage
                      {...messages[
                        `progressStep${position}` as keyof typeof messages
                      ]}
                    />
                  </ProgressBarElement>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="tab-group">
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.tracking}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.tracking} />
            </NavLink>
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.content}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.linkToContent} />
            </NavLink>
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.messages}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.messages} />
            </NavLink>
            {userIsUnitMember ? (
              <NavLink
                className="tab space-x-2"
                to={`${url}/${nestedUrls.draftAnswers}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.draftAnswers} />
              </NavLink>
            ) : null}
            {referral!.state === ReferralState.ANSWERED ? (
              <NavLink
                className="tab space-x-2"
                to={`${url}/${nestedUrls.answer}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.answer} />
              </NavLink>
            ) : (
              <a className="tab space-x-2 disabled">
                <FormattedMessage {...messages.answer} />
              </a>
            )}
          </div>

          <Switch>
            <Route exact path={`${path}/${nestedUrls.content}`}>
              <ReferralDetailContent referral={referral!} />
              <Crumb
                key="referral-detail-content"
                title={<FormattedMessage {...messages.crumbContent} />}
              />
            </Route>

            <Route exact path={`${path}/${nestedUrls.messages}`}>
              <TabMessages referral={referral!} />
              <Crumb
                key="referral-detail-messages"
                title={<FormattedMessage {...messages.messages} />}
              />
            </Route>

            {userIsUnitMember ? (
              <Route path={`${path}/${nestedUrls.draftAnswers}`}>
                <TabDraftAnswers referral={referral!} />
                <Crumb
                  key="referral-detail-draft-answers"
                  title={<FormattedMessage {...messages.draftAnswers} />}
                />
              </Route>
            ) : null}

            <Route exact path={`${path}/${nestedUrls.answer}`}>
              <TabAnswer referralId={referral!.id} />
              <Crumb
                key="referral-detail-answer"
                title={<FormattedMessage {...messages.answer} />}
              />
            </Route>

            <Route path={`${path}/${nestedUrls.tracking}`}>
              <TabTracking referralId={referralId} />
              <Crumb
                key="referral-detail-tracking"
                title={<FormattedMessage {...messages.tracking} />}
              />
            </Route>

            <Route path={path}>
              <Redirect to={`${url}/${nestedUrls.tracking}`} />
            </Route>
          </Switch>
        </section>
      );
  }
};
