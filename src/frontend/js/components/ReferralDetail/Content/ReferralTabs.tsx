import React, { useContext } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Referral, ReferralState } from '../../../types';
import { nestedUrls } from '../../../const';
import { isSplittingState, userIsUnitMember } from '../../../utils/referral';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { Nullable } from '../../../types/utils';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { useIntl } from 'react-intl';
import { useReferralReport } from '../../../data';
import { GroupIcon, LockerIcon, ScalesIcon } from '../../Icons';

const messages = defineMessages({
  answer: {
    defaultMessage: 'Answer',
    description:
      'Link & breadcrumb title for the tab link to the final answer for the referral.',
    id: 'components.ReferralTabs.answer',
  },
  appendices: {
    defaultMessage: 'Appendices',
    description:
      'Link & breadcrumb title for the tab link to the referral appendices.',
    id: 'components.ReferralTabs.appendices',
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
  unavailableRequesterTab: {
    defaultMessage: 'Adding requesters is not avaiblable in a splitting mode',
    description: 'Unavailable requester tab text',
    id: 'components.ReferralTabs.unavailableRequesterTab',
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
  const intl = useIntl();

  return (
    <>
      {referral && (
        <div className="w-full flex justify-between items-center">
          <div className="flex flex-col">
            <div className="items-center border-b-2 border-b-dsfr-primary-500 text-dsfr-primary-500">
              <div className="flex items-center space-x-2">
                <GroupIcon classname="fill-dsfr-primary-500 w-4 h-4" />
                <span className="text-sm">Espace commun</span>
              </div>
            </div>
            <div className="tab-group">
              <NavLink
                className="tab space-x-2"
                to={`${url}/${nestedUrls.content}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.linkToContent} />
              </NavLink>
              <NavLink
                className="tab tab-all space-x-2"
                to={`${url}/${nestedUrls.tracking}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.tracking} />
              </NavLink>

              {!isSplittingState(referral) ? (
                <NavLink
                  className="tab tab-all space-x-2"
                  to={`${url}/${nestedUrls.users}`}
                  aria-current="true"
                >
                  <FormattedMessage {...messages.requesters} />
                </NavLink>
              ) : (
                <a
                  className="tab tab-all space-x-2 disabled tooltip tooltip-info"
                  data-tooltip={intl.formatMessage(
                    messages.unavailableRequesterTab,
                  )}
                >
                  <FormattedMessage {...messages.requesters} />
                </a>
              )}
              <NavLink
                onClick={(e) =>
                  referral!.state === ReferralState.SPLITTING &&
                  e.preventDefault()
                }
                className={`tab tab-all space-x-2 ${
                  referral!.state === ReferralState.SPLITTING ? 'disabled' : ''
                }`}
                to={`${url}/${nestedUrls.messages}`}
                aria-current="true"
              >
                <FormattedMessage {...messages.messages} />
              </NavLink>

              {referral!.state === ReferralState.ANSWERED ||
              referral!.report!.publishments.length > 0 ? (
                <NavLink
                  className="tab tab-all space-x-2"
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
          </div>

          {userIsUnitMember(currentUser, referral!) ? (
            <div className="flex flex-col">
              <div className="min-w-60 items-center border-b-2 border-b-dsfr-expert-500 text-dsfr-expert-500">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <ScalesIcon classname=" fill-dsfr-expert-500 w-4 h-4" />
                    <span className="text-sm">Espace DAJ</span>
                  </div>
                  <LockerIcon className="fill-dsfr-expert-500" />
                </div>
              </div>
              <div className="tab-group">
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
                <NavLink
                  className="tab space-x-2"
                  to={`${url + '/' + nestedUrls.appendices}`}
                  aria-current="true"
                >
                  <FormattedMessage {...messages.appendices} />
                </NavLink>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
