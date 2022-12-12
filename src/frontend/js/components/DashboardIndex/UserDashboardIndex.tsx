import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { UserReferralTable } from '../ReferralTable/UserReferralTable';
import { UseReferralLitesParams } from '../../data';
import { NavLink } from 'react-router-dom';
import { ReferralState } from '../../types';
import { useCurrentUser } from '../../data/useCurrentUser';

const messages = defineMessages({
  emptyDashboard: {
    defaultMessage: 'There is no referral for your unit yet',
    description:
      'Message to display in lieu of the table when there are no referrals for the unit.',
    id: 'components.UserDashboardIndex.emptyDashboard',
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
  const { currentUser } = useCurrentUser();

  return (
    <>
      <div className="dashboard-tab-group">
        <NavLink
          className="dashboard-tab space-x-2"
          to="/my-dashboard?task=my_referrals"
          aria-current="true"
          isActive={(match, location) => {
            if (!match) {
              return false;
            }
            const task_param = new URLSearchParams(location.search).get('task');
            return task_param === 'my_referrals' || task_param === null;
          }}
        >
          <span>
            <FormattedMessage {...messages.myReferrals} />
          </span>
        </NavLink>
        <NavLink
          className="dashboard-tab space-x-2"
          to="/my-dashboard?task=my_drafts"
          aria-current="true"
          isActive={(match, location) => {
            if (!match) {
              return false;
            }
            const task_param = new URLSearchParams(location.search).get('task');
            return task_param === 'my_drafts';
          }}
        >
          <span>
            <FormattedMessage {...messages.myDrafts} />
          </span>
        </NavLink>
        {currentUser && currentUser.memberships.length === 0 && (
          <NavLink
            className="dashboard-tab space-x-2"
            to="/my-dashboard?task=my_unit"
            aria-current="true"
            isActive={(match, location) => {
              if (!match) {
                return false;
              }
              const task_param = new URLSearchParams(location.search).get(
                'task',
              );
              return task_param === 'my_unit';
            }}
          >
            <span>
              <FormattedMessage {...messages.myUnit} />
            </span>
          </NavLink>
        )}
      </div>

      <div className="mt-4 flex-grow">
        <UserReferralTable
          defaultParams={{ task: task } as UseReferralLitesParams}
          emptyState={
            <div
              className="flex flex-col items-center py-24 space-y-6"
              style={{ maxWidth: '60rem' }}
            >
              <div>
                <FormattedMessage {...messages.emptyDashboard} />
              </div>
            </div>
          }
          getReferralUrl={(referral) => {
            return referral.state === ReferralState.DRAFT
              ? `/draft-referrals/referral-form/${referral.id}`
              : `/my-dashboard/referral-detail/${referral.id}`;
          }}
        />
      </div>
    </>
  );
};
