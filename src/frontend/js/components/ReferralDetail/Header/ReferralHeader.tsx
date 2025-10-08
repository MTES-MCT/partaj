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
import { Referral, ReferralState } from 'types';
import { isUserReferralUnitsMember } from 'utils/unit';

import {
  canChangeUrgencyLevel,
  canCloseReferral,
  canUpdateReferral,
  hasActiveSibling,
  isFieldEmphasized,
  isSplittingState,
  referralIsCompleted,
  userIsApplicant,
  userIsUnitMember,
} from '../../../utils/referral';
import { ProgressBar } from './ProgressBar';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { CloseReferralModal } from './CloseReferralModal';
import { ChangeTitleModal } from './ChangeTitleModal';
import { useFeatureFlag, useReferralAction } from 'data';
import { useClickOutside } from '../../../utils/useClickOutside';
import {
  CalendarIcon,
  CheckIcon,
  CrossIcon,
  DeskIcon,
  EditIcon,
  GpsIcon,
  HashtagIcon,
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
import { getEmphasisStyle } from '../../../utils/styles';
import { SubReferralProvider } from '../../../data/providers/SubReferralProvider';
import { SubReferralFooter } from './SubReferral/SubReferralFooter';
import { SubTitleField } from './SubTitleField';
import { SubQuestionField } from './SubQuestionField';
import { SubReferralLink } from './SubReferral/SubReferralLink';
import { ReopenReferralButton } from '../../buttons/ReopenReferralButton';
import { RelatedReferralsField } from './RelatedReferralsField';
import { UpdateKnowledgeBaseStateModal } from './UpdateKnowledgeBaseStateModal';

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
  saveTitle: {
    defaultMessage: 'Save',
    description: 'Save title button text',
    id: 'components.ReferralHeader.saveTitle',
  },
  closeReferralTooltip: {
    defaultMessage: 'Close referral with comment',
    description: 'close referral tooltip text',
    id: 'components.ReferralHeader.closeReferralTooltip',
  },
  banner: {
    defaultMessage:
      'This referral is still invisible to applicants. You can freely modify the fields as needed. Each action will have the same impact as for a standard referral (notification to the DAJ, granting access to the newly assigned desk, etc.).',
    description: 'Banner text',
    id: 'components.ReferralHeader.banner',
  },
  associatedReferrals: {
    defaultMessage: 'Associated sub-referrals:',
    description: 'Associated referrals',
    id: 'components.ReferralHeader.associatedReferrals',
  },
  knowledgeBaseCheckbox: {
    defaultMessage: 'Sent to knowledge base',
    description: 'Label for the knowledge base checkbox',
    id: 'components.ReferralHeader.knowledgeBaseCheckbox',
  },
  knowledgeBaseCheckboxTooltip: {
    defaultMessage: 'Referral sent to the knowledge base',
    description: 'Tooltip on hover over the knowledge base checkbox',
    id: 'components.ReferralHeader.knowledgeBaseCheckboxTooltip',
  },
});

export const ReferralHeader: React.FC = () => {
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
  const [
    isUpdateKnowledgeBaseStateModalOpen,
    setIsUpdateKnowledgeBaseStateModalOpen,
  ] = useState(false);

  const [title, setTitle] = useState<string>('');
  const inputTitleRef = useRef(null);
  const { status, data } = useFeatureFlag('reopen_referral');
  const { status: kdbCheckboxStatus, data: kdbCheckboxData } = useFeatureFlag(
    'knowledge_base_checkbox',
  );

  const { referral, setReferral, group } = useContext(ReferralContext);
  const sendToKnowledgeBase =
    referral?.override_send_to_knowledge_base ??
    referral?.default_send_to_knowledge_base ??
    false;

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

  const updateSendToKnowledgeBaseState = () => {
    if (!referral) {
      return;
    }

    if (
      referral.state != ReferralState.ANSWERED &&
      referral.state != ReferralState.CLOSED
    ) {
      mutation.mutate(
        {
          action: 'override_send_to_knowledge_base',
          payload: { send_to_knowledge_base: !sendToKnowledgeBase },
          referral,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
          },
        },
      );
    } else if (referral.state === ReferralState.ANSWERED) {
      mutation.mutate(
        {
          action: 'update_published_referral_from_knowledge_base',
          payload: { send_to_knowledge_base: !sendToKnowledgeBase },
          referral,
        },
        {
          onSuccess: (referral: Referral) => {
            setReferral(referral);
          },
        },
      );
    }
  };

  return (
    <>
      {currentUser && referral && group && (
        <SubReferralProvider referral={referral} group={group}>
          <div
            data-testid="referral-header"
            className={`flex flex-col space-y-4 p-5 ${
              isSplittingState(referral) && 'referral-header-splitting'
            }`}
          >
            {isSplittingState(referral) && (
              <div className="bg-dsfr-orange-200 text-dsfr-orange-1000 px-8 py-2 w-full mb-2.5 text-sm">
                <FormattedMessage {...messages.banner}></FormattedMessage>
              </div>
            )}

            <>
              {group.length > 0 && (
                <>
                  {userIsUnitMember(currentUser, referral) ? (
                    <div className="flex w-full space-x-2 flex-wrap space-y-1">
                      <span className="text-sm uppercase flex-shrink-0 whitespace-nowrap mt-1">
                        <FormattedMessage
                          {...messages.associatedReferrals}
                        ></FormattedMessage>
                      </span>
                      {group?.map((section) => (
                        <SubReferralLink key={section.id} section={section} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {hasActiveSibling(group) && (
                        <div className="flex w-full space-x-2 flex-wrap space-y-1">
                          <span className="text-sm uppercase flex-shrink-0 whitespace-nowrap mt-1">
                            <FormattedMessage
                              {...messages.associatedReferrals}
                            ></FormattedMessage>
                          </span>
                          {group?.map((section) => (
                            <>
                              {![
                                ReferralState.SPLITTING,
                                ReferralState.RECEIVED_SPLITTING,
                              ].includes(section.referral.state) && (
                                <SubReferralLink
                                  key={section.id}
                                  section={section}
                                />
                              )}
                            </>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
            <div className="flex flex-col">
              <div className="flex space-x-2 items-start">
                <div className="flex items-center">
                  <HashtagIcon className="w-5 h-5 fill-black" />
                  <span className="text-black text-xl font-medium">
                    {referral.id}{' '}
                  </span>
                </div>

                <ChangeTitleModal
                  setIsCloseChangeTitleModalOpen={
                    setIsCloseChangeTitleModalOpen
                  }
                  isCloseChangeTitleModalOpen={isCloseChangeTitleModalOpen}
                />
                {showTitle ? (
                  <form
                    ref={ref}
                    className="flex space-x-2 relative input-replace-text"
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
                      maxLength={120}
                      className="rounded-sm px-2 input-shadow-sm text-xl w-full"
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
                      className={`space-x-1 border border-success-600 button button-white button-fit shadow-sticker ${
                        mutation.isLoading ? 'cursor-wait text-white' : ''
                      }`}
                      aria-busy={mutation.isLoading}
                      aria-disabled={mutation.isLoading}
                    >
                      <>
                        <CheckIcon />
                        <span>
                          <FormattedMessage {...messages.saveTitle} />
                        </span>
                      </>
                      {mutation.isLoading && (
                        <Spinner
                          justify="supersmall--center"
                          size="supersmall"
                        />
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="w-full flex">
                    {canUpdateReferral(referral, currentUser) ? (
                      <button
                        data-tooltip={intl.formatMessage(messages.titleTooltip)}
                        className="tooltip tooltip-action flex button p-0 button-white-grey text-black space-x-2 text-left items-start"
                        onClick={() => displayTitle()}
                      >
                        <span className="text-xl">
                          {(isUserReferralUnitsMember(currentUser, referral) &&
                            referral.title) ||
                            referral.object || (
                              <FormattedMessage
                                {...messages.titleNoObject}
                                values={{ id: referral.id }}
                              />
                            )}
                        </span>
                        <div className="h-7 w-7 flex items-center">
                          <EditIcon className="fill-grey400" />
                        </div>
                      </button>
                    ) : (
                      <span className="text-xl text-left">
                        {(isUserReferralUnitsMember(currentUser, referral) &&
                          referral.title) ||
                          referral.object || (
                            <FormattedMessage
                              {...messages.titleNoObject}
                              values={{ id: referral.id }}
                            />
                          )}
                      </span>
                    )}
                  </div>
                )}
                {status === 'success' && (
                  <>
                    {data?.is_active &&
                      referral.feature_flag === 1 &&
                      isUserReferralUnitsMember(currentUser, referral) &&
                      referralIsCompleted(referral) && <ReopenReferralButton />}
                  </>
                )}
              </div>
              <SubTitleField />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between">
                <div className="flex flex-col space-y-2 justify-start w-1/2">
                  <div className="flex items-center">
                    <ReferralHeaderField
                      title={intl.formatMessage(messages.topic)}
                      icon={<PantoneIcon className="w-5 h-5" />}
                    >
                      {canUpdateReferral(referral, currentUser) ? (
                        <TopicSelect />
                      ) : (
                        <div
                          className="tooltip tooltip-info"
                          style={{ width: 'calc(100% - 8rem)' }}
                          data-tooltip={referral.topic.name}
                        >
                          <div className="flex w-full">
                            <span className="truncate">
                              {referral.topic.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </ReferralHeaderField>
                  </div>
                  <div className="flex items-center">
                    <ReferralHeaderField
                      title={intl.formatMessage(messages.dueDateTitle)}
                      icon={<CalendarIcon className="w-5 h-5" />}
                    >
                      {canChangeUrgencyLevel(referral, currentUser) ? (
                        <>
                          <button
                            ref={ref}
                            type="button"
                            className={`tooltip tooltip-action button whitespace-nowrap button-white-grey button-superfit text-base text-black space-x-2 ${
                              isFieldEmphasized(referral) && getEmphasisStyle()
                            }`}
                            onClick={() =>
                              setIsChangeUrgencyLevelModalOpen(true)
                            }
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
                            <EditIcon className="fill-grey400" />
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
                  {canUpdateReferral(referral, currentUser) && (
                    <div className="flex items-center">
                      <ReferralHeaderField
                        title={intl.formatMessage(messages.sensitiveTitle)}
                        icon={<SortAscIcon className="w-5 h-5" />}
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
                      icon={<GpsIcon className="w-5 h-5" />}
                    >
                      <div className="flex w-full justify-between">
                        <ReferralStatusBadge status={referral.state} />
                        {!isSplittingState(referral) &&
                          canCloseReferral(referral, currentUser) && (
                            <div className="flex justify-end">
                              <button
                                className="tooltip tooltip-action button button-fit button-grey button-grey-hover-red"
                                onClick={() =>
                                  setIsCloseReferralModalOpen(true)
                                }
                                data-tooltip={intl.formatMessage(
                                  messages.closeReferralTooltip,
                                )}
                              >
                                <span>
                                  <FormattedMessage
                                    {...messages.closeReferral}
                                  />
                                </span>
                                <CrossIcon className="fill-grey400" />
                              </button>
                              <CloseReferralModal
                                setIsCloseReferralModalOpen={
                                  setIsCloseReferralModalOpen
                                }
                                isCloseReferralModalOpen={
                                  isCloseReferralModalOpen
                                }
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
                      icon={<UserFillIcon className="w-5 h-5" />}
                    >
                      <ReferralDetailAssignmentMembers referral={referral} />
                    </ReferralHeaderField>
                  </div>
                  <div className="flex items-center">
                    <RelatedReferralsField />
                  </div>
                  <div className="flex">
                    <ReferralHeaderField
                      title={intl.formatMessage(messages.unitsTitle)}
                      icon={<DeskIcon className="w-5 h-5" />}
                    >
                      <ReferralDetailAssignmentUnits referral={referral} />
                    </ReferralHeaderField>
                  </div>
                </div>
              </div>
              <SubQuestionField />
              {kdbCheckboxStatus === 'success' && kdbCheckboxData?.is_active && (
                <>
                  {referral.state === ReferralState.ANSWERED &&
                    isUserReferralUnitsMember(currentUser, referral) && (
                      <div className="flex flex-row items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsUpdateKnowledgeBaseStateModalOpen(true);
                          }}
                          className="tooltip tooltip-action button button-white-grey button-superfit px-2 -ml-[0.4rem] text-gray-450 text-base"
                          data-tooltip={intl.formatMessage(
                            messages.knowledgeBaseCheckboxTooltip,
                          )}
                        >
                          <div
                            role="checkbox"
                            aria-checked={sendToKnowledgeBase}
                            className={`checkbox`}
                          >
                            <CheckIcon />
                          </div>
                          <span className="ml-[0.65rem]">
                            <FormattedMessage
                              {...messages.knowledgeBaseCheckbox}
                            />
                          </span>
                        </button>
                        <UpdateKnowledgeBaseStateModal
                          isOpen={isUpdateKnowledgeBaseStateModalOpen}
                          setOpen={setIsUpdateKnowledgeBaseStateModalOpen}
                          updateSendToKnowledgeBaseState={
                            updateSendToKnowledgeBaseState
                          }
                          referral={referral}
                        />
                      </div>
                    )}
                  {referral.state !== ReferralState.ANSWERED &&
                    canUpdateReferral(referral, currentUser) && (
                      <div className="flex flex-row items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSendToKnowledgeBaseState();
                          }}
                          className="tooltip tooltip-action button button-white-grey button-superfit px-2 -ml-[0.4rem] text-gray-450 text-base"
                          data-tooltip={intl.formatMessage(
                            messages.knowledgeBaseCheckboxTooltip,
                          )}
                        >
                          <div
                            role="checkbox"
                            aria-checked={sendToKnowledgeBase}
                            className={`checkbox`}
                          >
                            <CheckIcon />
                          </div>
                          <span className="ml-[0.65rem]">
                            <FormattedMessage
                              {...messages.knowledgeBaseCheckbox}
                            />
                          </span>
                        </button>
                      </div>
                    )}
                </>
              )}
            </div>
            {isSplittingState(referral) && (
              <SubReferralFooter referral={referral} />
            )}
          </div>
        </SubReferralProvider>
      )}
      {referral && userIsApplicant(currentUser, referral) ? (
        <ProgressBar status={referral?.state} />
      ) : null}
    </>
  );
};
