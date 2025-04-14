import React, { useContext } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState } from '../../../types';
import { nestedUrls } from '../../../const';
import { userIsUnitMember } from '../../../utils/referral';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { Nullable } from '../../../types/utils';
import { ReferralContext } from '../../../data/providers/ReferralProvider';

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
  draftAnswers: {
    defaultMessage: 'Draft answers',
    description:
      'Link & breadcrumb title for the tab link to the draft answers for the referral.',
    id: 'components.ReferralTabs.draftAnswers',
  },
});

export const ReferralTabs = () => {
  const { url } = useRouteMatch();
  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );
  const { currentUser }: any = useCurrentUser();

  return (
    <>
      {referral && (
        <div className="tab-group">
          <NavLink
            className="tab space-x-2"
            to={`${url}/${nestedUrls.content}`}
            aria-current="true"
          >
            <FormattedMessage {...messages.linkToContent} />
          </NavLink>
          <NavLink
            className="tab space-x-2"
            to={`${url}/${nestedUrls.tracking}`}
            aria-current="true"
          >
            <FormattedMessage {...messages.tracking} />
          </NavLink>

          <NavLink
            className="tab space-x-2"
            to={`${url}/${nestedUrls.users}`}
            aria-current="true"
          >
            <FormattedMessage {...messages.requesters} />
          </NavLink>
          <NavLink
            onClick={(e) =>
              referral!.state === ReferralState.SPLITTING && e.preventDefault()
            }
            className={`tab space-x-2 ${
              referral!.state === ReferralState.SPLITTING ? 'disabled' : ''
            }`}
            to={`${url}/${nestedUrls.messages}`}
            aria-current="true"
          >
            <FormattedMessage {...messages.messages} />
          </NavLink>

          {userIsUnitMember(currentUser, referral!) ? (
            <NavLink
              className="tab space-x-2"
              to={`${
                referral!['feature_flag']
                  ? url + '/' + nestedUrls.draftAnswer
                  : url + '/' + nestedUrls.draftAnswers
              }`}
              aria-current="true"
            >
              <FormattedMessage {...messages.draftAnswer} />
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
      )}
    </>
  );
};
