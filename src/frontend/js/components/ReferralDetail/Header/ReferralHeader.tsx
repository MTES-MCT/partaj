import React, { useContext, useState } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  useIntl,
} from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { ReferralDetailAssignment } from 'components/ReferralDetailAssignment';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { isUserUnitOrganizer } from 'utils/unit';

import { userIsRequester } from '../../../utils/referral';
import { ProgressBar } from './ProgressBar';
import { Referral } from 'types';
import { Nullable } from '../../../types/utils';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { CloseReferralModal } from './CloseReferralModal';
import { ChangeUrgencyLevelModal } from './ChangeUrgencyLevelModal';

const messages = defineMessages({
  changeUrgencyLevel: {
    defaultMessage: 'Change the expected answer date for this referral.',
    description:
      'Accessible text for the pen button to change the expected answer date for a referral.',
    id: 'components.ReferralHeader.ChangeUrgencyLevel',
  },
  closeReferral: {
    defaultMessage: 'Close referral',
    description: 'Accessible text for the close button to close this referral.',
    id: 'components.ReferralHeader.closeReferral',
  },

  dueDate: {
    defaultMessage: 'Due date: {date}',
    description: 'Due date for the referral in the referral detail view.',
    id: 'components.ReferralHeader.dueDate',
  },
  linkToContent: {
    defaultMessage: 'Referral',
    description: 'Link title for the tab link to the referral content.',
    id: 'components.ReferralHeader.linkToContent',
  },
  loadingReferral: {
    defaultMessage: 'Loading referral #{ referralId }...',
    description:
      'Accessibility message for the spinner while loading the refeerral in referral detail view.',
    id: 'components.ReferralHeader.loadingReferral',
  },
  messages: {
    defaultMessage: 'Messages',
    description:
      'Link and breadcrumb title for the tab link to the referral messages.',
    id: 'components.ReferralDetail.messages',
  },
  requesters: {
    defaultMessage: 'Requesters',
    description: 'Text link to the requesters tab link.',
    id: 'components.ReferralHeader.requesters',
  },
  titleNoObject: {
    defaultMessage: 'Referral #{ id }',
    description:
      'Title of a referral detail view for referrals without an object.',
    id: 'components.ReferralHeader.titleNoObject',
  },
  tracking: {
    defaultMessage: 'Tracking',
    description:
      'Link & breadcrumb title for the tab link to the referral tracking.',
    id: 'components.ReferralHeader.tracking',
  },
});

export const ReferralHeader: any = () => {
  const seed = useUIDSeed();
  const intl = useIntl();

  const [isChangeUrgencyLevelModalOpen, setIsChangeUrgencyLevelModalOpen] =
    useState(false);

  const [isCloseReferralModalOpen, setIsCloseReferralModalOpen] =
    useState(false);

  const { referral }: { referral: Nullable<Referral> } =
    useContext(ReferralContext);

  const { currentUser } = useCurrentUser();

  var canChangeUrgencyLevel = false;
  var canCloseReferral = false;

  if (referral) {
    canChangeUrgencyLevel =
      [
        types.ReferralState.ASSIGNED,
        types.ReferralState.IN_VALIDATION,
        types.ReferralState.PROCESSING,
        types.ReferralState.RECEIVED,
      ].includes(referral.state) &&
      referral.units.some((unit: types.Unit) =>
        isUserUnitOrganizer(currentUser, unit),
      );

    canCloseReferral =
      [
        types.ReferralState.ASSIGNED,
        types.ReferralState.IN_VALIDATION,
        types.ReferralState.PROCESSING,
        types.ReferralState.RECEIVED,
      ].includes(referral.state) &&
      (referral?.users
        .map((user: { id: any }) => user.id)
        .includes(currentUser?.id || '$' /* impossible id */) ||
        referral.units.some((unit: types.Unit) =>
          isUserUnitOrganizer(currentUser, unit),
        ));
  }
  return (
    <>
      {referral && (
        <div className="flex flex-row items-center justify-between space-x-6">
          <div className="flex flex-col">
            <h1 className="text-4xl">
              {referral.object || (
                <FormattedMessage
                  {...messages.titleNoObject}
                  values={{ id: referral.id }}
                />
              )}
            </h1>
            <div className="space-x-2 inline-block ">
              <span>
                <FormattedMessage
                  {...messages.dueDate}
                  values={{
                    date: (
                      <FormattedDate
                        year="numeric"
                        month="long"
                        day="numeric"
                        value={referral.due_date}
                      />
                    ),
                  }}
                />
              </span>
              {canChangeUrgencyLevel ? (
                <>
                  <span>
                    <button className="focus:outline-none">
                      <svg
                        role="img"
                        className="fill-current w-5 h-5 inline"
                        onClick={() => setIsChangeUrgencyLevelModalOpen(true)}
                        aria-labelledby={seed('dropdown-button-title')}
                      >
                        <title id={seed('dropdown-button-title')}>
                          {intl.formatMessage(messages.changeUrgencyLevel)}
                        </title>
                        <use xlinkHref={`${appData.assets.icons}#icon-pen`} />
                      </svg>
                    </button>
                    <ChangeUrgencyLevelModal
                      setIsChangeUrgencyLevelModalOpen={
                        setIsChangeUrgencyLevelModalOpen
                      }
                      isChangeUrgencyLevelModalOpen={
                        isChangeUrgencyLevelModalOpen
                      }
                      referral={referral}
                    />
                  </span>
                  <span>•</span>
                </>
              ) : null}
              {canCloseReferral ? (
                <>
                  <span>
                    <button
                      className="focus:outline-none"
                      onClick={() => setIsCloseReferralModalOpen(true)}
                    >
                      <FormattedMessage {...messages.closeReferral} />
                    </button>
                    <CloseReferralModal
                      setIsCloseReferralModalOpen={setIsCloseReferralModalOpen}
                      isCloseReferralModalOpen={isCloseReferralModalOpen}
                      referral={referral}
                    />
                  </span>
                  <span>•</span>
                </>
              ) : null}
              <span>#{referral.id}</span>
            </div>
          </div>
          <div className="px-4">
            <ReferralStatusBadge status={referral.state} />
          </div>
          <ReferralDetailAssignment referral={referral} />
        </div>
      )}
      {referral && userIsRequester(currentUser, referral) ? (
        <ProgressBar status={referral?.state} />
      ) : null}
    </>
  );
};
