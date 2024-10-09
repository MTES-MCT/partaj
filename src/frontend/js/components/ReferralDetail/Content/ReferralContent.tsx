import { Redirect, Route, Switch } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import React, { useContext, useState } from 'react';
import { Referral, User } from '../../../types';
import { nestedUrls } from '../../../const';
import { Crumb } from '../../BreadCrumbs';
import { TabMessages } from './Tabs/TabMessages';
import { userIsUnitMember } from '../../../utils/referral';
import { TabDraftAnswers } from './Tabs/TabDraftAnswers';
import { TabAnswer } from './Tabs/TabAnswer';
import { TabUsers } from './Tabs/TabUsers';
import { TabTracking } from './Tabs/TabTracking';
import { TabReport } from './Tabs/TabReport';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { Nullable } from '../../../types/utils';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { TabPublishedReport } from './Tabs/TabPublishedReport';
import { TabNewReferral } from './Tabs/TabNewReferral';
import { TabReferral } from './Tabs/TabReferral';
import { useFeatureFlag } from '../../../data';
import { NewReferralForm } from '../../ReferralForm/NewForm';
import { ReferralForm } from '../../ReferralForm';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Link & breadcrumb title for the tab link to the final answer for the referral.',
    id: 'components.ReferralContent.answer',
  },
  draftAnswer: {
    defaultMessage: 'Draft answer',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralContent.draftAnswer',
  },
  messages: {
    defaultMessage: 'Messages',
    description:
      'Link and breadcrumb title for the tab link to the referral messages.',
    id: 'components.ReferralContent.messages',
  },
  requesters: {
    defaultMessage: 'Requesters',
    description: 'Text link to the requesters tab link.',
    id: 'components.ReferralContent.requesters',
  },
  linkToContent: {
    defaultMessage: 'Referral',
    description: 'Link title for the tab link to the referral content.',
    id: 'components.ReferralContent.linkToContent',
  },
  tracking: {
    defaultMessage: 'Tracking',
    description:
      'Link & breadcrumb title for the tab link to the referral tracking.',
    id: 'components.ReferralContent.tracking',
  },
  crumbContent: {
    defaultMessage: 'Content',
    description:
      'Title for the breadcrumb for the referral content in referral detail.',
    id: 'components.ReferralContent.crumbContent',
  },
  draftAnswers: {
    defaultMessage: 'Draft answers',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralContent.draftAnswers',
  },
});

type ReferralContentProps = React.PropsWithChildren<{
  url: string;
  path: string;
}>;

export const ReferralContent = ({ url, path }: ReferralContentProps) => {
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );

  const { currentUser } = useCurrentUser();

  return (
    <>
      {referral && (
        <Switch>
          <Route exact path={`${path}/${nestedUrls.content}`}>
            <TabReferral referral={referral} />

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
          <Route exact path={`${path}/${nestedUrls.answer}`}>
            {referral.feature_flag === 0 && <TabAnswer />}
            {referral.feature_flag === 1 && <TabPublishedReport />}
            <Crumb
              key="referral-detail-answer"
              title={<FormattedMessage {...messages.answer} />}
            />
          </Route>
          <Route path={`${path}/${nestedUrls.users}`}>
            <TabUsers />
            <Crumb
              key="referral-detail-requesters"
              title={<FormattedMessage {...messages.requesters} />}
            />
          </Route>
          <Route path={`${path}/${nestedUrls.tracking}`}>
            <TabTracking referral={referral!} />
            <Crumb
              key="referral-detail-tracking"
              title={<FormattedMessage {...messages.tracking} />}
            />
          </Route>
          {userIsUnitMember(currentUser, referral!) ? (
            <Route path={`${path}/${nestedUrls.draftAnswers}`}>
              <TabDraftAnswers referral={referral!} />
              <Crumb
                key="referral-detail-draft-answers"
                title={<FormattedMessage {...messages.draftAnswers} />}
              />
            </Route>
          ) : null}
          {userIsUnitMember(currentUser, referral!) ? (
            <Route path={`${path}/${nestedUrls.draftAnswer}`}>
              <TabReport referral={referral!} />
              <Crumb
                key="referral-detail-draft-answer"
                title={<FormattedMessage {...messages.draftAnswer} />}
              />
            </Route>
          ) : null}
          <Route path={path}>
            <Redirect to={`${url}/${nestedUrls.content}`} />
          </Route>
        </Switch>
      )}
    </>
  );
};
