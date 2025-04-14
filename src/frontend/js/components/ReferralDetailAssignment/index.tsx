import React, { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useDropdownMenu } from 'components/DropdownMenu';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Spinner } from 'components/Spinner';
import { useUnits } from 'data';
import { useCurrentUser } from 'data/useCurrentUser';
import { Referral, UnitMember } from 'types';
import { isUserUnitOrganizer } from 'utils/unit';
import { getUserFullname } from 'utils/user';
import { getLastItem } from 'utils/string';
import { ReferralMemberAssignmentButton } from './ReferralMemberAssignmentButton';
import { ReferralUnitAssignmentButton } from './ReferralUnitAssignmentButton';
import { AssignmentDropdownButton } from '../DropdownMenu/AssignmentDropdownMenu';
import { appData } from 'appData';
import { canPerformAssignments, isFieldEmphasized } from '../../utils/referral';

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
  unitAssigmentButtonLabel: {
    defaultMessage: 'Update unit assignment',
    description: 'Unit assignment label text',
    id: 'components.ReferralDetailAssignment.unitAssigmentButtonLabel',
  },
  userAssigmentButtonLabel: {
    defaultMessage: 'Update user assignment',
    description: 'User assignment tooltip text',
    id: 'components.ReferralDetailAssignment.userAssigmentButtonLabel',
  },
});

interface ReferralDetailAssignmentMembersTabProps {
  referral: Referral;
}

const ReferralDetailAssignmentMembersTab = ({
  referral,
}: ReferralDetailAssignmentMembersTabProps) => {
  const { currentUser } = useCurrentUser();
  const nonAssignedMembers = referral.units
    .filter((unit) => isUserUnitOrganizer(currentUser, unit))
    .reduce((list, unit) => {
      // Filter members to remove duplicates when a single user is in multiple units
      const members = unit.members.filter(
        (unitMember) => !list.find((member) => member.id === unitMember.id),
      );
      return [...list, ...members];
    }, [] as UnitMember[])
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

interface ReferralDetailAssignmentMembersProps {
  referral: Referral;
}

export const ReferralDetailAssignmentMembers: React.FC<ReferralDetailAssignmentMembersProps> = ({
  referral,
}) => {
  const { currentUser } = useCurrentUser();
  const intl = useIntl();
  const shouldEmphasizedField = () =>
    !!(
      (referral.assignees.length === 0 || isFieldEmphasized(referral)) &&
      canPerformAssignments
    );
  const dropdown = useDropdownMenu(false);

  return (
    <div
      className={`assignments-container relative flex flex-row ${
        referral.assignees.length > 0
          ? 'items-start'
          : 'items-center rounded-sm'
      }`}
    >
      {canPerformAssignments(referral, currentUser) ? (
        <div {...dropdown.getContainerProps({ className: 'w-full' })}>
          <AssignmentDropdownButton
            {...dropdown.getDropdownButtonProps()}
            showWarning={shouldEmphasizedField()}
            label={intl.formatMessage(messages.userAssigmentButtonLabel)}
          >
            <span
              className="flex items-center space-x-2 w-full text-black truncate"
              style={{ width: 'calc(100% - 1.25rem)' }}
            >
              {referral.assignees.length > 0 ? (
                <>
                  {referral.assignees.map((assignee, index) => (
                    <React.Fragment key={assignee.id}>
                      {index > 0 && ', '}
                      {getUserFullname(assignee)}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <FormattedMessage {...messages.notAssignedForUnitMembers} />
              )}
            </span>
          </AssignmentDropdownButton>
          {dropdown.getDropdownContainer(
            <div data-testid="dropdown-inside-container">
              <div
                className="flex flex-col py-2 overflow-auto"
                style={{ minHeight: '8rem', maxHeight: '28rem' }}
              >
                <div className="flex flex-row items-center justify-center pb-2 border-b">
                  <svg className="fill-current w-4 h-4 mr-2" aria-hidden={true}>
                    <use
                      xlinkHref={`${appData.assets.icons}#icon-person-outline`}
                    />
                  </svg>
                  <span>
                    <FormattedMessage {...messages.tabTitlePersons} />
                  </span>
                </div>
                <ReferralDetailAssignmentMembersTab referral={referral} />
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

interface ReferralDetailAssignmentUnitsProps {
  referral: Referral;
}

export const ReferralDetailAssignmentUnits: React.FC<ReferralDetailAssignmentUnitsProps> = ({
  referral,
}) => {
  const { currentUser } = useCurrentUser();
  const intl = useIntl();
  const [isKeepDropdownMenu, setIsKeepDropdownMenu] = useState(false);

  const dropdown = useDropdownMenu(isKeepDropdownMenu);

  return (
    <div
      className={`assignments-container relative flex flex-row ${
        referral.units.length > 0 ? 'items-start' : 'items-center rounded-sm'
      }`}
    >
      {canPerformAssignments(referral, currentUser) ? (
        <div {...dropdown.getContainerProps({ className: 'w-full' })}>
          <AssignmentDropdownButton
            {...dropdown.getDropdownButtonProps()}
            showWarning={!!isFieldEmphasized(referral)}
            label={intl.formatMessage(messages.unitAssigmentButtonLabel)}
          >
            <span
              className="flex items-center space-x-2 w-full text-black truncate"
              style={{ width: 'calc(100% - 1.25rem)' }}
            >
              {referral.units.length > 0 ? (
                <>
                  {referral.units.map((unit, index) => (
                    <React.Fragment key={unit.id}>
                      {index > 0 && ', '}
                      {getLastItem(unit.name, '/')}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <FormattedMessage {...messages.notAssignedForUnitMembers} />
              )}
            </span>
          </AssignmentDropdownButton>
          {dropdown.getDropdownContainer(
            <div data-testid="dropdown-inside-container">
              <div
                className="flex flex-col py-2 overflow-auto"
                style={{ minHeight: '8rem', maxHeight: '28rem' }}
              >
                <div className="flex flex-row items-center justify-center pb-2 border-b">
                  <svg className="fill-current w-4 h-4 mr-2" aria-hidden={true}>
                    <use xlinkHref={`${appData.assets.icons}#icon-cluster`} />
                  </svg>
                  <span>
                    <FormattedMessage {...messages.tabTitleUnits} />
                  </span>
                </div>
                <ReferralDetailAssignmentUnitsTab
                  referral={referral}
                  setIsKeepDropdownMenu={setIsKeepDropdownMenu}
                />
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
            referral.units.length > 0 ? 'tooltip tooltip-info' : ''
          }`}
          data-tooltip={referral.units
            .map((unit, index) => {
              const separator = index > 0 ? ' ' : '';
              return `${separator + unit.name}`;
            })
            .toString()}
        >
          {referral.units.length > 0 ? (
            <>
              <span className="text-black truncate">
                {referral.units.map((unit, index) => (
                  <React.Fragment key={unit.id}>
                    {index > 0 && ', '}
                    {getLastItem(unit.name, '/')}
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
