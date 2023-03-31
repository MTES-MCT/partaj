import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { useDropdownMenu } from 'components/DropdownMenu';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { TabV2 } from 'components/Tabs';
import { useUnits } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, ReferralState, UnitMember } from 'types';
import { Nullable } from 'types/utils';
import { isUserUnitOrganizer } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { ReferralMemberAssignmentButton } from './ReferralMemberAssignmentButton';
import { ReferralUnitAssignmentButton } from './ReferralUnitAssignmentButton';
import { AssignmentDropdownButton } from '../DropdownMenu/AssignmentDropdownMenu';

const messages = defineMessages({
  addAnAssignee: {
    defaultMessage: 'Add an assignee',
    description:
      'Title for the list of buttons to add an assignee to a referral',
    id: 'components.ReferralDetailAssignment.addAnAssignee',
  },
  assigned: {
    defaultMessage: 'Assigned',
    description:
      'Text for the referral assignment dropdown button when there is at least 1 assignee.',
    id: 'components.ReferralDetailAssignment.assigned',
  },
  loadingUnits: {
    defaultMessage: 'Loading units...',
    description:
      'Accessible message for spinner while loading list of units in referral detail assignment.',
    id: 'components.ReferralDetailAssignment.loadingUnits',
  },
  manageAssignments: {
    defaultMessage: 'Manage assignments',
    description:
      'Accessible title for the referral assignments dropdown button.',
    id: 'components.ReferralDetailAssignment.manageAssignments',
  },
  managePersonAssignments: {
    defaultMessage: 'Manage person assignments',
    description:
      'Accessible title for the UI in the dropdown that manages assignees on a referral.',
    id: 'components.ReferralDetailAssignment.managePersonAssignments',
  },
  manageUnitAssignments: {
    defaultMessage: 'Manage unit assignments',
    description:
      'Accessible title for the UI in the dropdown that manages units linked to a referral.',
    id: 'components.ReferralDetailAssignment.manageUnitAssignments',
  },
  notAssignedForRequester: {
    defaultMessage: 'Assignments',
    description:
      'Text for the referral assignment dropdown button when there is no assignee (shown to requester).',
    id: 'components.ReferralDetailAssignment.notAssignedForRequester',
  },
  notAssignedForUnitMembers: {
    defaultMessage: 'Not assigned',
    description:
      'Text for the referral assignment dropdown button when there is no assignee (shown to unit members).',
    id: 'components.ReferralDetailAssignment.notAssignedForUnitMembers',
  },
  readOnlyNoAssignedMembers: {
    defaultMessage: 'There is no assigned member yet.',
    description:
      'Text for the read-only assignment dropdown, when there are no assigned members.',
    id: 'components.ReferralDetailAssignment.readOnlyNoAssignedMembers',
  },
  removeAnAssignee: {
    defaultMessage: 'Remove an assignee',
    description:
      'Title for the list of buttons to remove an assignee from a referral',
    id: 'components.ReferralDetailAssignment.removeAnAssignee',
  },
  showAssignments: {
    defaultMessage: 'Show assignments',
    description:
      'Accessible title for the referral assignments dropdown button when in readonly.',
    id: 'components.ReferralDetailAssignment.showAssignments',
  },
  tabTitlePersons: {
    defaultMessage: 'Persons',
    description:
      'Title for the members assignments tab in the assignments dropdown menu.',
    id: 'components.ReferralDetailAssignment.tabTitlePersons',
  },
  tabTitleUnits: {
    defaultMessage: 'Units',
    description:
      'Title for the units assignments tab in the assignments dropdown menu.',
    id: 'components.ReferralDetailAssignment.tabTitleUnits',
  },
});

interface ReferralDetailAssignmentUnitsTabProps {
  referral: Referral;
  setIsKeepDropdownMenu: (isOpen: boolean) => void;
}

const ReferralDetailAssignmentUnitsTab = ({
  referral,
  setIsKeepDropdownMenu,
}: ReferralDetailAssignmentUnitsTabProps) => {
  const { data, status } = useUnits();

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingUnits} />
        </Spinner>
      );

    case 'success':
      return (
        <fieldset className="w-full">
          <legend className="sr-only">
            <FormattedMessage {...messages.manageUnitAssignments} />
          </legend>
          {referral.units.map((unit) => (
            <ReferralUnitAssignmentButton
              isAssigned={true}
              key={unit.id}
              referral={referral}
              unit={unit}
              setIsKeepDropdownMenu={setIsKeepDropdownMenu}
            />
          ))}
          {data!.results
            .filter(
              (unit) =>
                !referral.units
                  .map((referralUnit) => referralUnit.id)
                  .includes(unit.id),
            )
            .map((unit) => (
              <ReferralUnitAssignmentButton
                isAssigned={false}
                key={unit.id}
                referral={referral}
                unit={unit}
                setIsKeepDropdownMenu={setIsKeepDropdownMenu}
              />
            ))}
        </fieldset>
      );
  }
};

interface ReferralDetailAssignmentMembersTabProps {
  referral: Referral;
}

const ReferralDetailAssignmentMembersTab = ({
  referral,
}: ReferralDetailAssignmentMembersTabProps) => {
  const { currentUser } = useCurrentUser();

  const nonAssignedMembers = referral.units
    .filter((unit) => isUserUnitOrganizer(currentUser, unit))
    .reduce((list, unit) => [...list, ...unit.members], [] as UnitMember[])
    .filter(
      (member) =>
        !referral.assignees.map((assignee) => assignee.id).includes(member.id),
    );

  return (
    <fieldset className="w-full">
      <legend className="sr-only">
        <FormattedMessage {...messages.managePersonAssignments} />
      </legend>
      {referral.assignees.map((assignee) => (
        <ReferralMemberAssignmentButton
          isAssigned={true}
          key={assignee.id}
          member={assignee}
          referral={referral}
        />
      ))}
      {nonAssignedMembers.map((member) => (
        <ReferralMemberAssignmentButton
          isAssigned={false}
          key={member.id}
          member={member}
          referral={referral}
        />
      ))}
    </fieldset>
  );
};

interface ReferralDetailAssignmentProps {
  referral: Referral;
}

export const ReferralDetailAssignment: React.FC<ReferralDetailAssignmentProps> = ({
  referral,
}) => {
  const uid = useUIDSeed();
  const { currentUser } = useCurrentUser();

  const assignmentDropdownTabState = useState<Nullable<string>>('members');
  const [activeTab] = assignmentDropdownTabState;

  const [isKeepDropdownMenu, setIsKeepDropdownMenu] = useState(false);

  const dropdown = useDropdownMenu(isKeepDropdownMenu);

  const canPerformAssignments =
    // Referral is in a state where assignments can be created
    [
      ReferralState.ASSIGNED,
      ReferralState.IN_VALIDATION,
      ReferralState.PROCESSING,
      ReferralState.RECEIVED,
    ].includes(referral.state) &&
    // The current user is allowed to make assignments for this referral
    !!currentUser &&
    referral.units.some((unit) => isUserUnitOrganizer(currentUser, unit));

  return (
    <div
      className={`assignments-container relative flex flex-row ${
        referral.assignees.length > 0
          ? 'items-start'
          : 'items-center rounded-sm border-2 border-warning-500'
      }`}
    >
      {canPerformAssignments ? (
        <div {...dropdown.getContainerProps({ className: 'w-full' })}>
          <AssignmentDropdownButton
            {...dropdown.getDropdownButtonProps()}
            aria-labelledby={uid('dropdown-button-title')}
          >
            <div
              className="flex items-center space-x-2 w-full"
              style={{ width: 'calc(100% - 1.25rem)' }}
            >
              {referral.assignees.length > 0 ? (
                <>
                  <span className="text-black truncate">
                    {referral.assignees.map((assignee, index) => (
                      <React.Fragment key={assignee.id}>
                        {index > 0 && ', '}
                        {getUserFullname(assignee)}
                      </React.Fragment>
                    ))}
                  </span>
                </>
              ) : (
                <FormattedMessage {...messages.notAssignedForUnitMembers} />
              )}
            </div>
          </AssignmentDropdownButton>
          {dropdown.getDropdownContainer(
            <div data-testid="dropdown-inside-container">
              <div className="dashboard-tab-group">
                <TabV2
                  className="flex-1 items-center justify-center"
                  state={assignmentDropdownTabState}
                  name="members"
                >
                  <div>
                    <svg
                      className="fill-current w-4 h-4 mr-2"
                      aria-hidden={true}
                    >
                      <use
                        xlinkHref={`${appData.assets.icons}#icon-person-outline`}
                      />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.tabTitlePersons} />
                    </span>
                  </div>
                </TabV2>
                <TabV2
                  className="flex-1 items-center justify-center"
                  state={assignmentDropdownTabState}
                  name="units"
                >
                  <div>
                    <svg
                      className="fill-current w-4 h-4 mr-2"
                      aria-hidden={true}
                    >
                      <use xlinkHref={`${appData.assets.icons}#icon-cluster`} />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.tabTitleUnits} />
                    </span>
                  </div>
                </TabV2>
              </div>

              <div
                className="flex py-2 overflow-auto"
                style={{ minHeight: '8rem', maxHeight: '28rem' }}
              >
                {activeTab === 'members' ? (
                  <ReferralDetailAssignmentMembersTab referral={referral} />
                ) : null}

                {activeTab === 'units' ? (
                  <ReferralDetailAssignmentUnitsTab
                    referral={referral}
                    setIsKeepDropdownMenu={setIsKeepDropdownMenu}
                  />
                ) : null}
              </div>
            </div>,
            { className: 'border', style: { width: '20rem', zIndex: 20 } },
            'right',
          )}
        </div>
      ) : (
        <div
          data-testid="readonly-assigments"
          className={`flex items-center space-x-2 w-full ${
            referral.assignees.length > 0 ? 'tooltip tooltip-info' : ''
          }`}
          data-tooltip={referral.assignees
            .map((assignee, index) => {
              const separator = index > 0 ? ' ' : '';
              return `${separator + getUserFullname(assignee)}`;
            })
            .toString()}
        >
          {referral.assignees.length > 0 ? (
            <>
              <span className="text-black truncate">
                {referral.assignees.map((assignee, index) => (
                  <React.Fragment key={assignee.id}>
                    {index > 0 && ', '}
                    {getUserFullname(assignee)}
                  </React.Fragment>
                ))}
              </span>
            </>
          ) : (
            <FormattedMessage {...messages.notAssignedForUnitMembers} />
          )}
        </div>
      )}
    </div>
  );
};
