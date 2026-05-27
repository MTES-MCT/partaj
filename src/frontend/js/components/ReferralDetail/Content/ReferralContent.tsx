import { Navigate, Route, Routes } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import React, { useContext } from 'react';
import { Referral } from '../../../types';
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
import { TabReferral } from './Tabs/TabReferral';
import { TabAppendices } from './Tabs/TabAppendices';
import { TabJournalAndDiscussion } from './Tabs/TabJournalAndDiscussion';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Link & breadcrumb title for the tab link to the final answer for the referral.',
    id: 'components.ReferralContent.answer',
  },
  appendices: {
    defaultMessage: 'Appendices projects',
    description:
      'Link & breadcrumb title for the tab link to the referral appendices.',
    id: 'components.ReferralContent.appendices',
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
  journalAndDiscussion: {
    defaultMessage: 'Journal & Discussion',
    description: 'Journal and Discussion Tab',
    id: 'components.ReferralContent.journalAndDiscussion',
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

export const ReferralContent = () => {
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );

  const { currentUser } = useCurrentUser();

  return (
    <>
      {referral && (
        <Routes>
          <Route
            path={nestedUrls.content}
            element={
              <>
                <TabReferral referral={referral} />
                <Crumb
                  key="referral-detail-content"
                  title={<FormattedMessage {...messages.crumbContent} />}
                />
              </>
            }
          />
          <Route
            path={nestedUrls.messages}
            element={
              <>
                <TabMessages referral={referral!} />
                <Crumb
                  key="referral-detail-messages"
                  title={<FormattedMessage {...messages.messages} />}
                />
              </>
            }
          />
          <Route
            path={nestedUrls.answer}
            element={
              <>
                {referral.feature_flag === 0 && <TabAnswer />}
                {referral.feature_flag === 1 && <TabPublishedReport />}
                <Crumb
                  key="referral-detail-answer"
                  title={<FormattedMessage {...messages.answer} />}
                />
              </>
            }
          />
          <Route
            path={nestedUrls.journalAndDiscussion}
            element={
              <>
                <TabJournalAndDiscussion />
                <Crumb
                  key="referral-detail-journal-discussion"
                  title={
                    <FormattedMessage {...messages.journalAndDiscussion} />
                  }
                />
              </>
            }
          />
          <Route
            path={`${nestedUrls.users}/*`}
            element={
              <>
                <TabUsers />
                <Crumb
                  key="referral-detail-requesters"
                  title={<FormattedMessage {...messages.requesters} />}
                />
              </>
            }
          />
          <Route
            path={`${nestedUrls.tracking}/*`}
            element={
              <>
                <TabTracking referral={referral!} />
                <Crumb
                  key="referral-detail-tracking"
                  title={<FormattedMessage {...messages.tracking} />}
                />
              </>
            }
          />
          {userIsUnitMember(currentUser, referral!) && (
            <Route
              path={`${nestedUrls.draftAnswers}/*`}
              element={
                <>
                  <TabDraftAnswers referral={referral!} />
                  <Crumb
                    key="referral-detail-draft-answers"
                    title={<FormattedMessage {...messages.draftAnswers} />}
                  />
                </>
              }
            />
          )}
          {userIsUnitMember(currentUser, referral!) && (
            <Route
              path={`${nestedUrls.appendices}/*`}
              element={
                <>
                  <TabAppendices referral={referral!} />
                  <Crumb
                    key="referral-detail-appendices"
                    title={<FormattedMessage {...messages.appendices} />}
                  />
                </>
              }
            />
          )}
          {userIsUnitMember(currentUser, referral!) && (
            <Route
              path={`${nestedUrls.draftAnswer}/*`}
              element={
                <>
                  <TabReport referral={referral!} />
                  <Crumb
                    key="referral-detail-draft-answer"
                    title={<FormattedMessage {...messages.draftAnswer} />}
                  />
                </>
              }
            />
          )}
          <Route index element={<Navigate to={nestedUrls.content} replace />} />
        </Routes>
      )}
    </>
  );
};
