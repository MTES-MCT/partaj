import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { QueryStatus } from 'react-query';

import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { Tab } from 'components/Tabs';
import { useReferralLites } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Nullable } from 'types/utils';

const messages = defineMessages({
  loadingTasks: {
    defaultMessage: 'Loading dashboard information...',
    description: 'Spinner accessibility message for the Dashboard.',
    id: 'components.DashboardIndex.loadingTasks',
  },
  toAnswerSoonEmpty: {
    defaultMessage: 'You have no more referrals to answer soon.',
    description:
      'Message to display in lieu of the table when there are no referrals to answer soon.',
    id: 'components.DashboardIndex.toAnswerSoonEmpty',
  },
  toAnswerSoonLoading: {
    defaultMessage: 'Loading referrals to answer soon...',
    description:
      'Accessibility message for the big spinner while loading referrals to answer soon.',
    id: 'components.DashboardIndex.toAnswerSoonLoading',
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
  toAssignLoading: {
    defaultMessage: 'Loading referrals to assign...',
    description:
      'Accessibility message for the big spinner while loading referrals to assign.',
    id: 'components.DashboardIndex.toAssignLoading',
  },
  toAssignTitle: {
    defaultMessage: 'To assign',
    description: 'Title for the dashboard tab showing referrals to assign.',
    id: 'components.DashboardIndex.toAssign',
  },
  toProcessEmpty: {
    defaultMessage: 'You have no more referrals to process.',
    description:
      'Message to display in lieu of the table when there are no referrals to process.',
    id: 'components.DashboardIndex.toProcessEmpty',
  },
  toProcessLoading: {
    defaultMessage: 'Loading referrals to process...',
    description:
      'Accessibility message for the big spinner while loading referrals to process.',
    id: 'components.DashboardIndex.toProcessLoading',
  },
  toProcessTitle: {
    defaultMessage: 'To process',
    description: 'Title for the dashboard tab showing referrals to process.',
    id: 'components.DashboardIndex.toProcess',
  },
  toValidateEmpty: {
    defaultMessage: 'You have no more referrals to validate.',
    description:
      'Message to display in lieu of the table when there are no referrals to validte.',
    id: 'components.DashboardIndex.toValidateEmpty',
  },
  toValidateLoading: {
    defaultMessage: 'Loading referrals to validate...',
    description:
      'Accessibility message for the big spinner while loading referrals to validate.',
    id: 'components.DashboardIndex.toValidateLoading',
  },
  toValidateTitle: {
    defaultMessage: 'To validate',
    description: 'Title for the dashboard tab showing referrals to validate.',
    id: 'components.DashboardIndex.toValidate',
  },
});

export const DashboardIndex: React.FC = () => {
  const tabState = useState<Nullable<string>>('toAnswerSoon');

  const { currentUser } = useCurrentUser();
  const membershipRoles = currentUser
    ? currentUser.memberships.map((membership) => membership.role)
    : [];

  const toAnswerSoon = useReferralLites({ type: 'to_answer_soon' });
  const toAssign = useReferralLites({ type: 'to_assign' });
  const toProcess = useReferralLites({ type: 'to_process' });
  const toValidate = useReferralLites({ type: 'to_validate' });

  return (
    <>
      <div className="tab-group">
        {
          /* Referrals to answer soon */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toAnswerSoon.status === QueryStatus.Success &&
            toAnswerSoon.data!.count > 0) ? (
            <Tab name="toAnswerSoon" state={tabState}>
              <span>
                <FormattedMessage {...messages.toAnswerSoonTitle} />
                {toAnswerSoon.status === QueryStatus.Success
                  ? ` (${toAnswerSoon.data!.count})`
                  : ''}
              </span>
              {[QueryStatus.Idle, QueryStatus.Loading].includes(
                toAnswerSoon.status,
              ) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to assign */
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toAssign.status === QueryStatus.Success &&
            toAssign.data!.count > 0) ? (
            <Tab name="toAssign" state={tabState}>
              <span>
                <FormattedMessage {...messages.toAssignTitle} />
                {toAssign.status === QueryStatus.Success
                  ? ` (${toAssign.data!.count})`
                  : ''}
              </span>
              {[QueryStatus.Idle, QueryStatus.Loading].includes(
                toAssign.status,
              ) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to process */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toProcess.status === QueryStatus.Success &&
            toProcess.data!.count > 0) ? (
            <Tab name="toProcess" state={tabState}>
              <span>
                <FormattedMessage {...messages.toProcessTitle} />
                {toProcess.status === QueryStatus.Success
                  ? ` (${toProcess.data!.count})`
                  : ''}
              </span>
              {[QueryStatus.Idle, QueryStatus.Loading].includes(
                toProcess.status,
              ) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }

        {
          /* Referrals to validate */
          membershipRoles.includes(types.UnitMembershipRole.ADMIN) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (toValidate.status === QueryStatus.Success &&
            toValidate.data!.count > 0) ? (
            <Tab name="toValidate" state={tabState}>
              <span>
                <FormattedMessage {...messages.toValidateTitle} />
                {toValidate.status === QueryStatus.Success
                  ? ` (${toValidate.data!.count})`
                  : ''}
              </span>
              {[QueryStatus.Idle, QueryStatus.Loading].includes(
                toValidate.status,
              ) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }
      </div>

      <div className="mt-4 flex-grow">
        {tabState[0] === 'toAnswerSoon' ? (
          <>
            {toAnswerSoon.status === QueryStatus.Error ? (
              <GenericErrorMessage />
            ) : null}
            {[QueryStatus.Idle, QueryStatus.Loading].includes(
              toAnswerSoon.status,
            ) ? (
              <Spinner size="large">
                <FormattedMessage {...messages.toAnswerSoonLoading} />
              </Spinner>
            ) : null}
            {toAnswerSoon.status === QueryStatus.Success ? (
              toAnswerSoon.data!.count > 0 ? (
                <ReferralTable
                  getReferralUrl={(referral) =>
                    `/referral-detail/${referral.id}`
                  }
                  referrals={toAnswerSoon.data!.results}
                />
              ) : (
                <div
                  className="flex flex-col items-center py-24 space-y-6"
                  style={{ maxWidth: '60rem' }}
                >
                  <img src="/static/core/img/check-circle.png" alt="" />
                  <div>
                    <FormattedMessage {...messages.toAnswerSoonEmpty} />
                  </div>
                </div>
              )
            ) : null}
          </>
        ) : null}

        {tabState[0] === 'toAssign' ? (
          <>
            {toAssign.status === QueryStatus.Error ? (
              <GenericErrorMessage />
            ) : null}
            {[QueryStatus.Idle, QueryStatus.Loading].includes(
              toAssign.status,
            ) ? (
              <Spinner size="large">
                <FormattedMessage {...messages.toAssignLoading} />
              </Spinner>
            ) : null}
            {toAssign.status === QueryStatus.Success ? (
              toAssign.data!.count > 0 ? (
                <ReferralTable
                  getReferralUrl={(referral) =>
                    `/referral-detail/${referral.id}`
                  }
                  referrals={toAssign.data!.results}
                />
              ) : (
                <div
                  className="flex flex-col items-center py-24 space-y-6"
                  style={{ maxWidth: '60rem' }}
                >
                  <img src="/static/core/img/check-circle.png" alt="" />
                  <div>
                    <FormattedMessage {...messages.toAssignEmpty} />
                  </div>
                </div>
              )
            ) : null}
          </>
        ) : null}

        {tabState[0] === 'toProcess' ? (
          <>
            {toProcess.status === QueryStatus.Error ? (
              <GenericErrorMessage />
            ) : null}
            {[QueryStatus.Idle, QueryStatus.Loading].includes(
              toProcess.status,
            ) ? (
              <Spinner size="large">
                <FormattedMessage {...messages.toProcessLoading} />
              </Spinner>
            ) : null}
            {toProcess.status === QueryStatus.Success ? (
              toProcess.data!.count > 0 ? (
                <ReferralTable
                  getReferralUrl={(referral) =>
                    `/referral-detail/${referral.id}`
                  }
                  referrals={toProcess.data!.results}
                />
              ) : (
                <div
                  className="flex flex-col items-center py-24 space-y-6"
                  style={{ maxWidth: '60rem' }}
                >
                  <img src="/static/core/img/check-circle.png" alt="" />
                  <div>
                    <FormattedMessage {...messages.toProcessEmpty} />
                  </div>
                </div>
              )
            ) : null}
          </>
        ) : null}

        {tabState[0] === 'toValidate' ? (
          <>
            {toValidate.status === QueryStatus.Error ? (
              <GenericErrorMessage />
            ) : null}
            {[QueryStatus.Idle, QueryStatus.Loading].includes(
              toValidate.status,
            ) ? (
              <Spinner size="large">
                <FormattedMessage {...messages.toValidateLoading} />
              </Spinner>
            ) : null}
            {toValidate.status === QueryStatus.Success ? (
              toValidate.data!.count > 0 ? (
                <ReferralTable
                  getReferralUrl={(referral) =>
                    `/referral-detail/${referral.id}`
                  }
                  referrals={toValidate.data!.results}
                />
              ) : (
                <div
                  className="flex flex-col items-center py-24 space-y-6"
                  style={{ maxWidth: '60rem' }}
                >
                  <img src="/static/core/img/check-circle.png" alt="" />
                  <div>
                    <FormattedMessage {...messages.toValidateEmpty} />
                  </div>
                </div>
              )
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
};
