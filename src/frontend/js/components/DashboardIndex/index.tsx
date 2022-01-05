import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { Tab } from 'components/Tabs';
import { useReferralLites } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Nullable } from 'types/utils';

const messages = defineMessages({
  toAnswerSoonEmpty: {
    defaultMessage: 'You have no more referrals to answer soon.',
    description:
      'Message to display in lieu of the table when there are no referrals to answer soon.',
    id: 'components.DashboardIndex.toAnswerSoonEmpty',
  },
  toAnswerSoonTitle: {
    defaultMessage: 'To answer in less than 15 days',
    description:
      'Title for the dashboard tab showing referrals to answer soon.',
    id: 'components.DashboardIndex.toAnswerSoonTitle',
  },
  toAssignEmpty: {
    defaultMessage: 'You have no more referrals to assign.',
    description:
      'Message to display in lieu of the table when there are no referrals to assign.',
    id: 'components.DashboardIndex.toAssignEmpty',
  },
  toAssignTitle: {
    defaultMessage: 'To assign',
    description: 'Title for the dashboard tab showing referrals to assign.',
    id: 'components.DashboardIndex.toAssignTitle',
  },
  toProcessEmpty: {
    defaultMessage: 'You have no more referrals to process.',
    description:
      'Message to display in lieu of the table when there are no referrals to process.',
    id: 'components.DashboardIndex.toProcessEmpty',
  },
  toProcessTitle: {
    defaultMessage: 'To process',
    description: 'Title for the dashboard tab showing referrals to process.',
    id: 'components.DashboardIndex.toProcessTitle',
  },
  toValidateEmpty: {
    defaultMessage: 'You have no more referrals to validate.',
    description:
      'Message to display in lieu of the table when there are no referrals to validte.',
    id: 'components.DashboardIndex.toValidateEmpty',
  },
  toValidateTitle: {
    defaultMessage: 'To validate',
    description: 'Title for the dashboard tab showing referrals to validate.',
    id: 'components.DashboardIndex.toValidateTitle',
  },
});

export const DashboardIndex: React.FC = () => {
  const tabState = useState<Nullable<string>>('toAnswerSoon');

  const { currentUser } = useCurrentUser();
  const membershipRoles = currentUser
    ? currentUser.memberships.map((membership) => membership.role)
    : [];

  const toAnswerSoon = useReferralLites({ task: 'answer_soon' });
  const toAssign = useReferralLites({ task: 'assign' });
  const toProcess = useReferralLites({ task: 'process' });
  const toValidate = useReferralLites({ task: 'validate' });

  return (
    <>
      <div className="tab-group">
        {
          /* Referrals to answer soon */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toAnswerSoon.status === 'success' &&
            toAnswerSoon.data!.count > 0) ? (
            <Tab name="toAnswerSoon" state={tabState}>
              <span>
                <FormattedMessage {...messages.toAnswerSoonTitle} />
                {toAnswerSoon.status === 'success'
                  ? ` (${toAnswerSoon.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(toAnswerSoon.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to assign */
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toAssign.status === 'success' && toAssign.data!.count > 0) ? (
            <Tab name="toAssign" state={tabState}>
              <span>
                <FormattedMessage {...messages.toAssignTitle} />
                {toAssign.status === 'success'
                  ? ` (${toAssign.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(toAssign.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to process */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toProcess.status === 'success' && toProcess.data!.count > 0) ? (
            <Tab name="toProcess" state={tabState}>
              <span>
                <FormattedMessage {...messages.toProcessTitle} />
                {toProcess.status === 'success'
                  ? ` (${toProcess.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(toProcess.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to validate */
          membershipRoles.includes(types.UnitMembershipRole.ADMIN) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toValidate.status === 'success' && toValidate.data!.count > 0) ? (
            <Tab name="toValidate" state={tabState}>
              <span>
                <FormattedMessage {...messages.toValidateTitle} />
                {toValidate.status === 'success'
                  ? ` (${toValidate.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(toValidate.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }
      </div>

      <div className="mt-4 flex-grow">
        {tabState[0] === 'toAnswerSoon' ? (
          <ReferralTable
            defaultParams={{ task: 'answer_soon' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.toAnswerSoonEmpty} />
                </div>
              </div>
            }
            getReferralUrl={(referral) =>
              `/dashboard/referral-detail/${referral.id}`
            }
          />
        ) : null}

        {tabState[0] === 'toAssign' ? (
          <ReferralTable
            defaultParams={{ task: 'assign' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.toAssignEmpty} />
                </div>
              </div>
            }
            getReferralUrl={(referral) =>
              `/dashboard/referral-detail/${referral.id}`
            }
          />
        ) : null}

        {tabState[0] === 'toProcess' ? (
          <ReferralTable
            defaultParams={{ task: 'process' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.toProcessEmpty} />
                </div>
              </div>
            }
            getReferralUrl={(referral) =>
              `/dashboard/referral-detail/${referral.id}`
            }
          />
        ) : null}

        {tabState[0] === 'toValidate' ? (
          <ReferralTable
            defaultParams={{ task: 'validate' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.toValidateEmpty} />
                </div>
              </div>
            }
            getReferralUrl={(referral) =>
              `/dashboard/referral-detail/${referral.id}`
            }
          />
        ) : null}
      </div>
    </>
  );
};
