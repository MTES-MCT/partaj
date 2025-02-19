import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { UserReferralTable } from '../ReferralTable/UserReferralTable';
import { UseReferralLitesParams } from '../../data';
import { NavLink } from 'react-router-dom';
import { ReferralState, TaskParams } from '../../types';
import { useCurrentUser } from '../../data/useCurrentUser';
import { SubscribeModalProvider } from '../../data/providers/SubscribeModalProvider';
import { useTitle } from 'utils/useTitle';

const messages = defineMessages({
  emptyDashboardMyUnit: {
    defaultMessage: 'There is no referral for your unit yet',
    description:
      'Message to display in lieu of the table when there are no referrals in the unit table.',
    id: 'components.UserDashboardIndex.emptyDashboardMyUnit',
  },
  emptyDashboardMyDrafts: {
    defaultMessage: 'There is no draft referral yet',
    description:
      'Message to display in lieu of the table when there are no draft referrals for the user.',
    id: 'components.UserDashboardIndex.emptyDashboardMyDrafts',
  },
  emptyDashboardMyReferrals: {
    defaultMessage: 'You are not requester for a referral yet',
    description:
      'Message to display in lieu of the table when there are no user referrals.',
    id: 'components.UserDashboardIndex.emptyDashboardMyReferrals',
  },
  myReferrals: {
    defaultMessage: 'My referrals',
    description: 'my referrals tabs title',
    id: 'components.UserDashboardIndex.myReferrals',
  },
  myUnit: {
    defaultMessage: 'My unit',
    description: 'My unit tabs title',
    id: 'components.UserDashboardIndex.myUnit',
  },
  myDrafts: {
    defaultMessage: 'My drafts',
    description: 'My draft tabs title',
    id: 'components.UserDashboardIndex.myDrafts',
  },
});

export const UserDashboardIndex = ({ task }: { task: string | null }) => {
  // Task is never equal to MY_UNIT since the new dashboard, hence this works
  const pageTitle =
    task === TaskParams.MY_DRAFTS ? 'draftReferralList' : 'sentReferralList';
  useTitle(pageTitle);
  const { currentUser } = useCurrentUser();

  return (
    <>
      <div className="dashboard-tab-group">
        <NavLink
          className="dashboard-tab space-x-2"
          to={`/my-dashboard?task=${TaskParams.MY_REFERRALS}`}
          aria-current="true"
          isActive={(match, location) => {
            if (!match) {
              return false;
            }
            return task === TaskParams.MY_REFERRALS;
          }}
        >
          <div>
            <span>
              <FormattedMessage {...messages.myReferrals} />
            </span>
          </div>
        </NavLink>
        <NavLink
          className="dashboard-tab space-x-2"
          to={`/my-dashboard?task=${TaskParams.MY_DRAFTS}`}
          aria-current="true"
          isActive={(match, location) => {
            if (!match) {
              return false;
            }
            return task === TaskParams.MY_DRAFTS;
          }}
        >
          <div>
            <span>
              <FormattedMessage {...messages.myDrafts} />
            </span>
          </div>
        </NavLink>
        {currentUser && currentUser.memberships.length === 0 && (
          <NavLink
            className="dashboard-tab space-x-2"
            to={`/my-dashboard?task=${TaskParams.MY_UNIT}`}
            aria-current="true"
            isActive={(match, location) => {
              if (!match) {
                return false;
              }
              return task === TaskParams.MY_UNIT;
            }}
          >
            <div>
              <span>
                <FormattedMessage {...messages.myUnit} />
              </span>
            </div>
          </NavLink>
        )}
      </div>
      <div className="mt-4 flex-grow">
        <SubscribeModalProvider>
          <UserReferralTable
            defaultParams={{ task: task } as UseReferralLitesParams}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <div>
                  {task === TaskParams.MY_UNIT && (
                    <FormattedMessage {...messages.emptyDashboardMyUnit} />
                  )}
                  {task === TaskParams.MY_DRAFTS && (
                    <FormattedMessage {...messages.emptyDashboardMyDrafts} />
                  )}
                  {task === TaskParams.MY_REFERRALS && (
                    <FormattedMessage {...messages.emptyDashboardMyReferrals} />
                  )}
                </div>
              </div>
            }
            getReferralUrl={(referral) => {
              return referral.state === ReferralState.DRAFT
                ? `/draft-referrals/referral-form/${referral.id}`
                : `/my-dashboard/referral-detail/${referral.id}`;
            }}
          />
        </SubscribeModalProvider>
      </div>
    </>
  );
};
