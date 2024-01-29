import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ReferralTable } from 'components/ReferralTable';
import { Spinner } from 'components/Spinner';
import { Tab } from 'components/Tabs';
import { useReferralLites } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Nullable } from 'types/utils';

const messages = defineMessages({
  alreadyProcessedEmpty: {
    defaultMessage: 'You have not processed any referrals yet.',
    description:
      'Message to display in lieu of the table when there are no already processed referrals.',
    id: 'components.DashboardIndex.alreadyProcessedEmpty',
  },
  toChangeEmpty: {
    defaultMessage: 'You have no more referrals report version to change.',
    description:
      'Message to display in lieu of the table when there are no referrals version to change.',
    id: 'components.DashboardIndex.toChangeEmpty',
  },
  inValidationEmpty: {
    defaultMessage:
      'You have no more referrals report version waiting for validation',
    description:
      'Message to display in lieu of the table when there are no referrals version in validation.',
    id: 'components.DashboardIndex.inValidationEmpty',
  },
  alreadyProcessedTitle: {
    defaultMessage: 'Finished',
    description:
      'Title for the dashboard tab showing referrals already processed.',
    id: 'components.DashboardIndex.alreadyProcessedTitle',
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
  toChangeTitle: {
    defaultMessage: 'To change',
    description: 'Title for the dashboard tab showing referrals to change.',
    id: 'components.DashboardIndex.toChangeTitle',
  },
  inValidationTitle: {
    defaultMessage: 'Waiting for validation',
    description:
      'Title for the dashboard tab showing referrals wainting for validation.',
    id: 'components.DashboardIndex.inValidationTitle',
  },
  toValidateEmpty: {
    defaultMessage: 'You have no more referrals to validate.',
    description:
      'Message to display in lieu of the table when there are no referrals to validate.',
    id: 'components.DashboardIndex.toValidateEmpty',
  },
  toValidateTitle: {
    defaultMessage: 'To validate',
    description: 'Title for the dashboard tab showing referrals to validate.',
    id: 'components.DashboardIndex.toValidateTitle',
  },
  toProcessTableCaption: {
    defaultMessage: 'Referral list to process',
    description: 'Caption for the table showing referrals to process.',
    id: 'components.DashboardIndex.toProcessTableCaption',
  },
  toAssignTableCaption: {
    defaultMessage: 'Referral list to assign',
    description: 'Caption for the table showing referrals to assign.',
    id: 'components.DashboardIndex.toAssignTableCaption',
  },
  inValidationTableCaption: {
    defaultMessage: 'Referral list to waiting for validation',
    description:
      'Caption for the table showing referrals waiting for validation.',
    id: 'components.DashboardIndex.inValidationTableCaption',
  },
  toChangeTableCaption: {
    defaultMessage: 'Referral list to change',
    description: 'Caption for the table showing referrals to change.',
    id: 'components.DashboardIndex.toChangeTableCaption',
  },
  toValidateTableCaption: {
    defaultMessage: 'Referral list to validate',
    description: 'Caption for the table showing referrals to validate.',
    id: 'components.DashboardIndex.toValidateTableCaption',
  },
  alreadyProcessedTableCaption: {
    defaultMessage: 'Referral list already processed',
    description: 'Caption for the table showing referrals already processed.',
    id: 'components.DashboardIndex.alreadyProcessedTableCaption',
  },
});

export const DashboardIndex: React.FC = () => {
  const tabState = useState<Nullable<string>>('toProcess');
  const intl = useIntl();
  const { currentUser } = useCurrentUser();
  const membershipRoles = currentUser
    ? currentUser.memberships.map((membership) => membership.role)
    : [];

  const toAssign = useReferralLites({ task: 'assign' });
  const toChange = useReferralLites({ task: 'change' });
  const inValidation = useReferralLites({ task: 'in_validation' });

  const toProcess = useReferralLites({
    task: 'process',
    state: [
      types.ReferralState.ASSIGNED,
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
      types.ReferralState.RECEIVED,
    ],
  });
  const toValidate = useReferralLites({ task: 'validate' });
  const alreadyProcessed = useReferralLites({
    task: 'done',
    state: [types.ReferralState.ANSWERED, types.ReferralState.CLOSED],
  });

  return (
    <>
      <div className="tab-group">
        {
          /* Referrals to process, shown to everyone with different list contents */
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
          /* Referrals to validate */
          membershipRoles.includes(types.UnitMembershipRole.ADMIN) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          membershipRoles.includes(types.UnitMembershipRole.SUPERADMIN) ||
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
        {
          /* Referrals in validation */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.ADMIN) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          (inValidation.status === 'success' &&
            inValidation.data!.count > 0) ? (
            <Tab name="inValidation" state={tabState}>
              <span>
                <FormattedMessage {...messages.inValidationTitle} />
                {inValidation.status === 'success'
                  ? ` (${inValidation.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(inValidation.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }
        {
          /* Referrals to change */
          membershipRoles.includes(types.UnitMembershipRole.MEMBER) ||
          membershipRoles.includes(types.UnitMembershipRole.OWNER) ||
          membershipRoles.includes(types.UnitMembershipRole.ADMIN) ||
          membershipRoles.includes(types.UnitMembershipRole.SUPERADMIN) ||
          (toChange.status === 'success' && toChange.data!.count > 0) ? (
            <Tab name="toChange" state={tabState}>
              <span>
                <FormattedMessage {...messages.toChangeTitle} />
                {toChange.status === 'success'
                  ? ` (${toChange.data!.count})`
                  : ''}
              </span>
              {['idle', 'loading'].includes(toChange.status) ? (
                <Spinner size="small" />
              ) : null}
            </Tab>
          ) : null
        }
        {
          /* Same as the toProcess query but for referrals that have already been processed */
          <Tab name="alreadyProcessed" state={tabState}>
            <span>
              <FormattedMessage {...messages.alreadyProcessedTitle} />
              {alreadyProcessed.status === 'success'
                ? ` (${alreadyProcessed.data!.count})`
                : ''}
            </span>
            {['idle', 'loading'].includes(alreadyProcessed.status) ? (
              <Spinner size="small" />
            ) : null}
          </Tab>
        }
      </div>

      <div className="mt-4 flex-grow">
        {tabState[0] === 'toProcess' ? (
          <ReferralTable
            caption={intl.formatMessage(messages.toProcessTableCaption)}
            defaultParams={{
              task: 'process',
              state: [
                types.ReferralState.ASSIGNED,
                types.ReferralState.IN_VALIDATION,
                types.ReferralState.PROCESSING,
                types.ReferralState.RECEIVED,
              ],
            }}
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

        {tabState[0] === 'alreadyProcessed' ? (
          <ReferralTable
            caption={intl.formatMessage(messages.alreadyProcessedTableCaption)}
            defaultParams={{
              task: 'done',
              state: [types.ReferralState.ANSWERED, types.ReferralState.CLOSED],
            }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.alreadyProcessedEmpty} />
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
            caption={intl.formatMessage(messages.toAssignTableCaption)}
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

        {tabState[0] === 'toChange' ? (
          <ReferralTable
            caption={intl.formatMessage(messages.toChangeTableCaption)}
            defaultParams={{ task: 'change' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.toChangeEmpty} />
                </div>
              </div>
            }
            getReferralUrl={(referral) =>
              `/dashboard/referral-detail/${referral.id}`
            }
          />
        ) : null}

        {tabState[0] === 'inValidation' ? (
          <ReferralTable
            caption={intl.formatMessage(messages.inValidationTableCaption)}
            defaultParams={{ task: 'in_validation' }}
            emptyState={
              <div
                className="flex flex-col items-center py-24 space-y-6"
                style={{ maxWidth: '60rem' }}
              >
                <img src="/static/core/img/check-circle.png" alt="" />
                <div>
                  <FormattedMessage {...messages.inValidationEmpty} />
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
            caption={intl.formatMessage(messages.toValidateTableCaption)}
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
            hideColumns={['PUBLISHED_DATE']}
          />
        ) : null}
      </div>
    </>
  );
};
