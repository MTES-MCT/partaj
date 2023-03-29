import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { DropdownOpenButton, useDropdownMenu } from 'components/DropdownMenu';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { Tab } from 'components/Tabs';
import { useUnits } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, ReferralState, UnitMember } from 'types';
import { Nullable } from 'types/utils';
import { isUserUnitMember, isUserUnitOrganizer } from 'utils/unit';
import { getUserFullname, getUserInitials } from 'utils/user';
import { ReferralMemberAssignmentButton } from './ReferralMemberAssignmentButton';
import { ReferralUnitAssignmentButton } from './ReferralUnitAssignmentButton';

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

interface ReferralDetailAssignmentReadonlyProps {
  referral: Referral;
}

const ReferralDetailAssignmentReadonly = ({
  referral,
}: ReferralDetailAssignmentReadonlyProps) => {
  const seed = useUIDSeed();

  return (
    <div className="flex flex-col">
      <h3
        id={seed('readonly-units-list')}
        className="flex flex-row items-center justify-center space-x-2 p-4 border-b-4 border-primary-500 text-primary-500"
      >
        <svg className="fill-current w-4 h-4" aria-hidden={true}>
          <use xlinkHref={`${appData.assets.icons}#icon-cluster`} />
        </svg>
        <span>
          <FormattedMessage {...messages.tabTitleUnits} />
        </span>
      </h3>
      <ul aria-labelledby={seed('readonly-units-list')}>
        {referral.units.map((unit, index) => (
          <li
            key={unit.id}
            className={`p-4 ${
              // Make sure the last item always has a gray background
              (referral.units.length + index) % 2 === 0 ? '' : 'bg-gray-100'
            }`}
          >
            {unit.name}
          </li>
        ))}
      </ul>
      <h3
        id={seed('readonly-users-list')}
        className="flex flex-row items-center justify-center space-x-2 p-4 border-b-4  border-primary-500 text-primary-500"
      >
        <svg className="fill-current w-4 h-4" aria-hidden={true}>
          <use xlinkHref={`${appData.assets.icons}#icon-person-outline`} />
        </svg>
        <span>
          <FormattedMessage {...messages.tabTitlePersons} />
        </span>
      </h3>
      {referral.assignees.length > 0 ? (
        <ul aria-labelledby={seed('readonly-users-list')}>
          {referral.assignees.map((assignee, index) => (
            <li
              key={assignee.id}
              className={`p-4 ${index % 2 === 0 ? '' : 'bg-gray-100'}`}
            >
              {getUserFullname(assignee)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-8 text-center">
          <FormattedMessage {...messages.readOnlyNoAssignedMembers} />
        </div>
      )}
    </div>
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
      className={`relative float-right flex flex-row ${
        referral.assignees.length > 1 ? 'items-start' : 'items-center'
      }`}
      style={{ zIndex: 20 }}
    >
      <div {...dropdown.getContainerProps({ className: 'ml-3' })}>
        <DropdownOpenButton
          {...dropdown.getDropdownButtonProps()}
          aria-labelledby={uid('dropdown-button-title')}
        >
          {/* Visible text on the button does not enable us to make an accessible button.
                Make it aria-hidden to use a proper button label. */}
          <div className="sr-only">
            {canPerformAssignments ? (
              <FormattedMessage {...messages.manageAssignments} />
            ) : (
              <FormattedMessage {...messages.showAssignments} />
            )}
          </div>
          <div
            className="h-8 flex flex-row items-center space-x-2"
            aria-hidden={true}
          >
            {referral.assignees.length > 0 ? (
              <>
                <ul className="flex flew-row items-center">
                  {referral.assignees.map((assignee, index) => (
                    <li
                      className={`relative w-8 h-8 flex items-center justify-center bg-gray-300 rounded-full
                          border-2 box-content text-gray-700 ${
                            index > 0 ? '-ml-2' : ''
                          } ${
                        dropdown.showDropdown
                          ? 'border-primary-500'
                          : 'border-white'
                      }`}
                      style={{ zIndex: 10 - index }}
                      key={assignee.id}
                    >
                      {getUserInitials(assignee)}
                    </li>
                  ))}
                </ul>
                <div className="whitespace-no-wrap font-semibold">
                  <FormattedMessage {...messages.assigned} />
                </div>
              </>
            ) : (
              <div className="whitespace-no-wrap font-semibold">
                {referral.units.some((unit) =>
                  isUserUnitMember(currentUser, unit),
                ) ? (
                  <FormattedMessage {...messages.notAssignedForUnitMembers} />
                ) : (
                  <FormattedMessage {...messages.notAssignedForRequester} />
                )}
              </div>
            )}
            <svg className="fill-current h-4 w-4">
              <use xlinkHref={`${appData.assets.icons}#icon-caret-down`} />
            </svg>
          </div>
        </DropdownOpenButton>
        {dropdown.getDropdownContainer(
          <>
            {canPerformAssignments ? (
              <div>
                <div className="tab-group">
                  <Tab
                    className="flex-1 items-center justify-center"
                    state={assignmentDropdownTabState}
                    name="members"
                  >
                    <svg className="fill-current w-4 h-4" aria-hidden={true}>
                      <use
                        xlinkHref={`${appData.assets.icons}#icon-person-outline`}
                      />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.tabTitlePersons} />
                    </span>
                  </Tab>
                  <Tab
                    className="flex-1 items-center justify-center"
                    state={assignmentDropdownTabState}
                    name="units"
                  >
                    <svg className="fill-current w-4 h-4" aria-hidden={true}>
                      <use xlinkHref={`${appData.assets.icons}#icon-cluster`} />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.tabTitleUnits} />
                    </span>
                  </Tab>
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
              </div>
            ) : (
              <ReferralDetailAssignmentReadonly referral={referral} />
            )}
          </>,
          { className: 'border', style: { width: '20rem' } },
        )}
      </div>
    </div>
  );
};
