import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  useIntl,
} from 'react-intl';
import {
  ReferralDetailAssignmentMembers,
  ReferralDetailAssignmentUnits,
} from 'components/ReferralDetailAssignment';
import { ReferralStatusBadge } from 'components/ReferralStatusBadge';
import { useCurrentUser } from 'data/useCurrentUser';
import * as types from 'types';
import { Referral } from 'types';
import { isUserReferralUnitsMember, isUserUnitOrganizer } from 'utils/unit';

import { userIsRequester } from '../../../utils/referral';
import { ProgressBar } from './ProgressBar';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { CloseReferralModal } from './CloseReferralModal';
import { ChangeTitleModal } from './ChangeTitleModal';
import { useReferralAction } from 'data';
import { useClickOutside } from '../../../utils/useClickOutside';
import {
  CalendarIcon,
  CheckIcon,
  CrossIcon,
  DeskIcon,
  EditIcon,
  GpsIcon,
  HashtagIcon,
  IconColor,
  PantoneIcon,
  SortAscIcon,
  UserFillIcon,
} from '../../Icons';
import { Spinner } from '../../Spinner';
import { RoleModalProvider } from '../../../data/providers/RoleModalProvider';
import { PriorityHeaderField } from './PriorityHeaderField';
import { ChangeUrgencyLevelModal } from './ChangeUrgencyLevelModal';
import { TopicSelect } from '../../select/TopicSelect';
import { ReferralHeaderField } from './ReferralHeaderField';

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
  dueDateTitle: {
    defaultMessage: 'Due date',
    description: 'Due date text for the referral in the referral detail view.',
    id: 'components.ReferralHeader.dueDateTitle',
  },
  sensitiveTitle: {
    defaultMessage: 'Sensitiveness',
    description: 'Sensitive text for the referral in the referral detail view.',
    id: 'components.ReferralHeader.sensitiveTitle',
  },
  assignmentTitle: {
    defaultMessage: 'Assignment',
    description:
      'Assignment text for the referral in the referral detail view.',
    id: 'components.ReferralHeader.assignmentTitle',
  },
  unitsTitle: {
    defaultMessage: 'Desks',
    description: 'Units text for the referral in the referral detail view.',
    id: 'components.ReferralHeader.unitsTitle',
  },
  statusTitle: {
    defaultMessage: 'Status',
    description: 'Status text for the referral in the referral detail view.',
    id: 'components.ReferralHeader.statusTitle',
  },
  titleNoObject: {
    defaultMessage: 'Referral #{ id }',
    description:
      'Title of a referral detail view for referrals without an object.',
    id: 'components.ReferralHeader.titleNoObject',
  },
  editTitleButtonText: {
    defaultMessage: 'Edit title',
    description: 'Title of edit title button tooltips.',
    id: 'components.ReferralHeader.editTitleButton',
  },
  topic: {
    defaultMessage: 'Topic: ',
    description: 'Topic libelle',
    id: 'components.ReferralHeader.topic',
  },
  titleTooltip: {
    defaultMessage: 'Update title for DAJ only',
    description: 'topic tooltip text',
    id: 'components.ReferralHeader.titleTooltip',
  },
  duedateTooltip: {
    defaultMessage: 'Change referral due date',
    description: 'topic tooltip text',
    id: 'components.ReferralHeader.duedateTooltip',
  },
  closeReferralTooltip: {
    defaultMessage: 'Close referral with comment',
    description: 'close referral tooltip text',
    id: 'components.ReferralHeader.closeReferralTooltip',
  },
});

export const ReferralHeader: any = () => {
  const intl = useIntl();
  const [inputTitleFocus, setInputTitleFocus] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [
    isChangeUrgencyLevelModalOpen,
    setIsChangeUrgencyLevelModalOpen,
  ] = useState(false);
  const [isCloseReferralModalOpen, setIsCloseReferralModalOpen] = useState(
    false,
  );

  const [
    isCloseChangeTitleModalOpen,
    setIsCloseChangeTitleModalOpen,
  ] = useState(false);

  const [title, setTitle] = useState<string>('');
  const inputTitleRef = useRef(null);

  const { referral, setReferral } = useContext(ReferralContext);
  const { currentUser } = useCurrentUser();

  const { ref } = useClickOutside({
    onClick: () => {
      setShowTitle(false);
      setInputTitleFocus(false);
      if (referral) {
        setTitle(referral.title ?? referral.object);
      }
    },
  });

  useEffect(() => {
    if (inputTitleFocus) {
      (inputTitleRef.current! as HTMLElement).focus();
    }
  }, [inputTitleFocus]);

  useEffect(() => {
    if (referral) {
      setTitle(referral.title ?? referral.object);
    }
  }, [referral]);

  const mutation = useReferralAction();
  const displayTitle = () => {
    setShowTitle(true);
    setInputTitleFocus(true);
  };

  var canChangeUrgencyLevel = false;
  var canCloseReferral = false;
  var canUpdateReferral = false;
  var canUpdateTitle = false;

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
      isUserReferralUnitsMember(currentUser, referral);
  }

  return (
    <>
      {referral && (
        <div data-testid="referral-header" className="flex flex-col space-y-2">
          <div className="flex space-x-2 items-center">
            <div className="flex items-center">
              <HashtagIcon size={5} color={IconColor.BLACK} />
              <span className="text-black text-xl font-medium">
                {referral.id}{' '}
              </span>
            </div>
            <ChangeTitleModal
              setIsCloseChangeTitleModalOpen={setIsCloseChangeTitleModalOpen}
              isCloseChangeTitleModalOpen={isCloseChangeTitleModalOpen}
            />
            {showTitle ? (
              <form
                ref={ref}
                className="relative input-replace-text"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate(
                    {
                      action: 'update_title',
                      payload: { title: title },
                      referral,
                    },
                    {
                      onSuccess: (referral: Referral) => {
                        setReferral(referral);
                        setShowTitle(false);
                        setInputTitleFocus(false);
                        setIsCloseChangeTitleModalOpen(true);
                      },
                    },
                  );
                }}
              >
                <input
                  ref={inputTitleRef}
                  maxLength={60}
                  className="rounded-sm px-2 input-shadow-sm text-xl w-full pr-20"
                  type="text"
                  aria-label="referral-title"
                  defaultValue={title}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                />
                <button
                  type="submit"
                  className={`absolute top-0 right-0 space-x-1 border border-success-transparent-24p button button-white button-fit shadow-sticker ${
                    mutation.isLoading ? 'cursor-wait text-white' : ''
                  }`}
                  aria-busy={mutation.isLoading}
                  aria-disabled={mutation.isLoading}
                >
                  <>
                    <CheckIcon /> <span>Valider</span>
                  </>
                  {mutation.isLoading && (
                    <Spinner justify="supersmall--center" size="supersmall" />
                  )}
                </button>
              </form>
            ) : (
              <div className="w-full flex">
                {canUpdateReferral ? (
                  <button
                    data-tooltip={intl.formatMessage(messages.titleTooltip)}
                    className="tooltip tooltip-action flex button p-0 button-white-grey text-black space-x-2"
                    onClick={() => displayTitle()}
                  >
                    <h1 className="text-xl">
                      {(isUserReferralUnitsMember(currentUser, referral) &&
                        referral.title) ||
                        referral.object || (
                          <FormattedMessage
                            {...messages.titleNoObject}
                            values={{ id: referral.id }}
                          />
                        )}
                    </h1>
                    <EditIcon color={IconColor.GREY_400} />
                  </button>
                ) : (
                  <h1 className="text-xl">
                    {(isUserReferralUnitsMember(currentUser, referral) &&
                      referral.title) ||
                      referral.object || (
                        <FormattedMessage
                          {...messages.titleNoObject}
                          values={{ id: referral.id }}
                        />
                      )}
                  </h1>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex flex-col space-y-2 justify-start w-1/2">
              <div className="flex items-center">
                <ReferralHeaderField
                  title={intl.formatMessage(messages.topic)}
                  icon={<PantoneIcon size={5} />}
                >
                  {canUpdateReferral ? (
                    <TopicSelect />
                  ) : (
                    <div
                      className="tooltip tooltip-info"
                      style={{ width: 'calc(100% - 8rem)' }}
                      data-tooltip={referral.topic.name}
                    >
                      <div className="flex w-full">
                        <span className="truncate"> {referral.topic.name}</span>
                      </div>
                    </div>
                  )}
                </ReferralHeaderField>
              </div>
              <div className="flex items-center">
                <ReferralHeaderField
                  title={intl.formatMessage(messages.dueDateTitle)}
                  icon={<CalendarIcon size={5} />}
                >
                  {canChangeUrgencyLevel ? (
                    <>
                      <button
                        ref={ref}
                        type="button"
                        className="tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-base text-black space-x-2"
                        onClick={() => setIsChangeUrgencyLevelModalOpen(true)}
                        data-tooltip={intl.formatMessage(
                          messages.duedateTooltip,
                        )}
                      >
                        <span>
                          <FormattedDate
                            year="numeric"
                            month="long"
                            day="numeric"
                            value={referral.due_date}
                          />
                        </span>
                        <EditIcon color={IconColor.GREY_400} />
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
                    </>
                  ) : (
                    <span>
                      <FormattedDate
                        year="numeric"
                        month="long"
                        day="numeric"
                        value={referral.due_date}
                      />
                    </span>
                  )}
                </ReferralHeaderField>
              </div>
              {canUpdateReferral && (
                <div className="flex items-center">
                  <ReferralHeaderField
                    title={intl.formatMessage(messages.sensitiveTitle)}
                    icon={<SortAscIcon size={5} />}
                  >
                    <RoleModalProvider>
                      <PriorityHeaderField />
                    </RoleModalProvider>
                  </ReferralHeaderField>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2 justify-start w-1/2">
              <div className="flex">
                <ReferralHeaderField
                  title={intl.formatMessage(messages.statusTitle)}
                  icon={<GpsIcon size={5} />}
                >
                  <div className="flex w-full justify-between">
                    <ReferralStatusBadge status={referral.state} />
                    {canCloseReferral && (
                      <div className="flex justify-end">
                        <button
                          className="tooltip tooltip-action button button-fit button-grey button-grey-hover-red"
                          onClick={() => setIsCloseReferralModalOpen(true)}
                          data-tooltip={intl.formatMessage(
                            messages.closeReferralTooltip,
                          )}
                        >
                          <span>
                            <FormattedMessage {...messages.closeReferral} />
                          </span>
                          <CrossIcon color={IconColor.GREY_400} size={4} />
                        </button>
                        <CloseReferralModal
                          setIsCloseReferralModalOpen={
                            setIsCloseReferralModalOpen
                          }
                          isCloseReferralModalOpen={isCloseReferralModalOpen}
                          referral={referral}
                        />
                      </div>
                    )}
                  </div>
                </ReferralHeaderField>
              </div>
              <div className="flex items-center">
                <ReferralHeaderField
                  title={intl.formatMessage(messages.assignmentTitle)}
                  icon={<UserFillIcon size={5} />}
                >
                  <ReferralDetailAssignmentMembers referral={referral} />
                </ReferralHeaderField>
              </div>
              <div className="flex">
                <ReferralHeaderField
                  title={intl.formatMessage(messages.unitsTitle)}
                  icon={<DeskIcon size={5} />}
                >
                  <ReferralDetailAssignmentUnits referral={referral} />
                </ReferralHeaderField>
              </div>
            </div>
          </div>
        </div>
      )}
      {referral && userIsRequester(currentUser, referral) ? (
        <ProgressBar status={referral?.state} />
      ) : null}
    </>
  );
};
