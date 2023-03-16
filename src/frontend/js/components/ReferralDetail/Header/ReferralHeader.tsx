import React, { useContext, useState, useEffect } from 'react';
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
import {
  isUserUnitOrganizer,
  isUserUnitMember,
  isUserReferralUnitsMember,
} from 'utils/unit';

import { userIsRequester } from '../../../utils/referral';
import { ProgressBar } from './ProgressBar';
import { Referral, ReferralStatus } from 'types';
import { Nullable } from '../../../types/utils';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { CloseReferralModal } from './CloseReferralModal';
import { ChangeUrgencyLevelModal } from './ChangeUrgencyLevelModal';
import { TopicField } from './TopicField';
import { useReferralAction } from 'data';

import { ModuleFilenameHelpers } from 'webpack';
import { useClickOutside } from '../../../utils/useClickOutside';
import { CheckIcon } from '../../Icons';

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
  editButtonTitle: {
    defaultMessage: 'Edit topic',
    description: 'Title of edit topic button tooltips.',
    id: 'components.ReferralHeader.editButton',
  },

  tracking: {
    defaultMessage: 'Tracking',
    description:
      'Link & breadcrumb title for the tab link to the referral tracking.',
    id: 'components.ReferralHeader.tracking',
  },
  topic: {
    defaultMessage: 'Topic: ',
    description: 'Topic libelle',
    id: 'components.ReferralHeader.topic',
  },
  status: {
    defaultMessage: 'Status: ',
    description: 'status',
    id: 'components.ReferralHeader.status',
  },
  statusTitle: {
    defaultMessage:
      'By checking, you indicate to the sub-management that this referral is sensitive: ',
    description: 'status title',
    id: 'components.ReferralHeader.statusTitle',
  },
});

export const ReferralHeader: any = () => {
  const seed = useUIDSeed();
  const intl = useIntl();

  const { refetch } = useContext(ReferralContext);

  const [showSelect, setShowSelect] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [
    isChangeUrgencyLevelModalOpen,
    setIsChangeUrgencyLevelModalOpen,
  ] = useState(false);

  const [isCloseReferralModalOpen, setIsCloseReferralModalOpen] = useState(
    false,
  );

  const { referral }: { referral: Nullable<Referral> } = useContext(
    ReferralContext,
  );

  const [title, setTitle] = useState<string>('');

  const { ref } = useClickOutside({
    onClick: () => {
      setShowTitle(false);
    },
  });

  const mutation = useReferralAction({
    onSuccess: (data) => {
      refetch();
    },
  });

  useEffect(() => {
    if (referral) {
      setTitle(referral.title ?? referral.object);
    }
  }, [referral]);

  const { currentUser } = useCurrentUser();

  var canChangeUrgencyLevel = false;
  var canCloseReferral = false;
  var canUpdateReferral = false;
  var canAddReferralTitle = false;

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

    canUpdateReferral =
      [
        types.ReferralState.ASSIGNED,
        types.ReferralState.IN_VALIDATION,
        types.ReferralState.PROCESSING,
        types.ReferralState.RECEIVED,
      ].includes(referral.state) &&
      referral.units.some((unit) => isUserUnitMember(currentUser, unit));

    canAddReferralTitle =
      [
        types.ReferralState.ASSIGNED,
        types.ReferralState.IN_VALIDATION,
        types.ReferralState.PROCESSING,
        types.ReferralState.RECEIVED,
      ].includes(referral.state) &&
      isUserReferralUnitsMember(currentUser, referral);
  }

  return (
    <>
      {referral && (
        <div>
          <div className="flex flex-row items-center ">
            {showTitle ? (
              <>
                <div ref={ref} className="flex flex-row items-center w-full">
                  <input
                    className="border border-black w-2/3"
                    type="text"
                    aria-label="auto-userunit"
                    defaultValue={title}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                  />

                  <button
                    type="submit"
                    className={`relative btn  ${
                      mutation.isLoading ? 'cursor-wait' : ''
                    }`}
                    aria-busy={mutation.isLoading}
                    aria-disabled={mutation.isLoading}
                    onClick={() => {
                      mutation.mutate({
                        action: 'update_title',
                        payload: { title: title },
                        referral,
                      });
                      setShowTitle(false);
                    }}
                  >
                    <CheckIcon />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl">
                  {(isUserReferralUnitsMember(currentUser, referral) &&
                    referral.title) ||
                    referral.object || (
                      <FormattedMessage
                        {...messages.titleNoObject}
                        values={{ id: referral.id }}
                      />
                    )}
                </h1>
                {canAddReferralTitle && (
                  <button className="focus:outline-none">
                    <svg
                      role="img"
                      className="fill-current w-5 h-5 inline"
                      onClick={() => setShowTitle(!showTitle)}
                      aria-labelledby={seed('dropdown-button-title')}
                    >
                      <title id={seed('edit-button-title')}>
                        {intl.formatMessage(messages.editButtonTitle)}
                      </title>
                      <use xlinkHref={`${appData.assets.icons}#icon-pen`} />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {canUpdateReferral ? (
            <>
              <div className="flex flex-row space-x-2 ">
                <div className="pr-2 inline">
                  <FormattedMessage {...messages.topic} />
                </div>

                {showSelect ? (
                  <TopicField
                    referral={referral}
                    setShowSelect={setShowSelect}
                  />
                ) : (
                  <>
                    {referral.topic.name}
                    <button
                      className="focus:outline-none"
                      onClick={() => setShowSelect(true)}
                    >
                      <svg
                        role="img"
                        className="fill-current w-5 h-5 inline"
                        onClick={() => setShowSelect(!showSelect)}
                        aria-labelledby={seed('dropdown-button-title')}
                      >
                        <title id={seed('edit-button-title')}>
                          {intl.formatMessage(messages.editButtonTitle)}
                        </title>
                        <use xlinkHref={`${appData.assets.icons}#icon-pen`} />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : null}
          <div className="flex flex-row items-center justify-between space-x-6">
            <div className="flex flex-col">
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
                        setIsCloseReferralModalOpen={
                          setIsCloseReferralModalOpen
                        }
                        isCloseReferralModalOpen={isCloseReferralModalOpen}
                        referral={referral}
                      />
                    </span>
                    <span>•</span>
                  </>
                ) : null}
                <span>#{referral.id}</span>
                {canUpdateReferral ? (
                  <>
                    <span className="space-x-2">
                      <span>
                        <FormattedMessage {...messages.status} />
                      </span>
                      <span>
                        <input
                          type="checkbox"
                          name="status"
                          title={intl.formatMessage(messages.statusTitle)}
                          aria-labelledby={seed(
                            'referral-status-checkbox-label',
                          )}
                          aria-describedby={seed('referral-status-checkbox')}
                          checked={referral.status == ReferralStatus.SENSITIVE}
                          onChange={(e) => {
                            mutation.mutate({
                              action: 'update_status',
                              payload: {
                                status: e.target.checked
                                  ? ReferralStatus.SENSITIVE
                                  : ReferralStatus.NORMAL,
                              },
                              referral,
                            });
                          }}
                        />
                      </span>
                    </span>
                  </>
                ) : referral.status == ReferralStatus.SENSITIVE ? (
                  <>
                    <span className="space-x-2">
                      <span>
                        <FormattedMessage {...messages.status} />
                      </span>
                      <span>
                        <input
                          type="checkbox"
                          name="status"
                          disabled={true}
                          title={intl.formatMessage(messages.statusTitle)}
                          aria-labelledby={seed(
                            'referral-status-checkbox-label',
                          )}
                          aria-describedby={seed('referral-status-checkbox')}
                          checked={true}
                        />
                      </span>
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="px-4">
              <ReferralStatusBadge status={referral.state} />
            </div>
            <ReferralDetailAssignment referral={referral} />
          </div>
        </div>
      )}
      {referral && userIsRequester(currentUser, referral) ? (
        <ProgressBar status={referral?.state} />
      ) : null}
    </>
  );
};
