import {
  NavLink,
  Redirect,
  Route,
  Switch,
  useRouteMatch,
} from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import * as types from '../../types';
import React from 'react';
import { ReferralDetailContent } from '../ReferralDetailContent';
import { Crumb } from '../BreadCrumbs';
import { TabMessages } from './TabMessages';
import { TabDraftAnswers } from './TabDraftAnswers';
import { TabAnswer } from './TabAnswer';
import { TabTracking } from './TabTracking';
import { TabRequesters } from './TabRequesters';
import { Referral, User } from '../../types';
import { nestedUrls } from '../../const';
import { userIsUnitMember } from '../../utils/referral';
import { Nullable } from '../../types/utils';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Link & breadcrumb title for the tab link to the final answer for the referral.',
    id: 'components.ReferralTabs.answer',
  },
  draftAnswer: {
    defaultMessage: 'Draft answer',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralTabs.draftAnswer',
  },
  messages: {
    defaultMessage: 'Messages',
    description:
      'Link and breadcrumb title for the tab link to the referral messages.',
    id: 'components.ReferralTabs.messages',
  },
  requesters: {
    defaultMessage: 'Requesters',
    description: 'Text link to the requesters tab link.',
    id: 'components.ReferralTabs.requesters',
  },
  linkToContent: {
    defaultMessage: 'Referral',
    description: 'Link title for the tab link to the referral content.',
    id: 'components.ReferralTabs.linkToContent',
  },
  tracking: {
    defaultMessage: 'Tracking',
    description:
      'Link & breadcrumb title for the tab link to the referral tracking.',
    id: 'components.ReferralTabs.tracking',
  },
  crumbContent: {
    defaultMessage: 'Content',
    description:
      'Title for the breadcrumb for the referral content in referral detail.',
    id: 'components.ReferralTabs.crumbContent',
  },
  draftAnswers: {
    defaultMessage: 'Draft answers',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralTabs.draftAnswers',
  },
});

type ReferralTabsProps = React.PropsWithChildren<{
  referral?: Referral;
  currentUser: Nullable<User>;
}>;

export const ReferralTabs = ({ referral, currentUser }: ReferralTabsProps) => {
  const { path, url } = useRouteMatch();

  return (
    <>
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
          to={`${url}/${nestedUrls.users}`}
          aria-current="true"
        >
          <FormattedMessage {...messages.requesters} />
        </NavLink>
        <NavLink
          className="tab space-x-2"
          to={`${url}/${nestedUrls.messages}`}
          aria-current="true"
        >
          <FormattedMessage {...messages.messages} />
        </NavLink>

        {userIsUnitMember(currentUser, referral!) ? (
          referral!['feature_flag'] ? (
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.draftAnswer}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.draftAnswer} />
            </NavLink>
          ) : (
            <NavLink
              className="tab space-x-2"
              to={`${url}/${nestedUrls.draftAnswers}`}
              aria-current="true"
            >
              <FormattedMessage {...messages.draftAnswers} />
            </NavLink>
          )
        ) : null}

        {referral!.state === types.ReferralState.ANSWERED ? (
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

        {userIsUnitMember(currentUser, referral!) ? (
          <>
            <Route path={`${path}/${nestedUrls.draftAnswers}`}>
              <TabDraftAnswers referral={referral!} />
              <Crumb
                key="referral-detail-draft-answers"
                title={<FormattedMessage {...messages.draftAnswers} />}
              />
            </Route>
            <Route path={`${path}/${nestedUrls.draftAnswer}`}>
              <span> COUCOU </span>
              <Crumb
                key="referral-detail-draft-answer"
                title={<FormattedMessage {...messages.draftAnswer} />}
              />
            </Route>
          </>
        ) : null}

        <Route exact path={`${path}/${nestedUrls.answer}`}>
          <TabAnswer referralId={referral!.id} />
          <Crumb
            key="referral-detail-answer"
            title={<FormattedMessage {...messages.answer} />}
          />
        </Route>

        <Route path={`${path}/${nestedUrls.tracking}`}>
          <TabTracking referralId={referral!.id} />
          <Crumb
            key="referral-detail-tracking"
            title={<FormattedMessage {...messages.tracking} />}
          />
        </Route>

        <Route path={`${path}/${nestedUrls.users}`}>
          <TabRequesters referral={referral!} />
          <Crumb
            key="referral-detail-requesters"
            title={<FormattedMessage {...messages.requesters} />}
          />
        </Route>

        <Route path={path}>
          <Redirect to={`${url}/${nestedUrls.tracking}`} />
        </Route>
      </Switch>
    </>
  );
};
