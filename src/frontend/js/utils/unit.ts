import { defineMessages } from 'react-intl';

import { Unit, UnitMembershipRole, User } from 'types';
import { Nullable } from 'types/utils';

/**
 * Get a list of organizers for a unit.
 */
export const getUnitOrganizers = (unit: Unit) =>
  unit.members.filter(
    (member) =>
      member.membership.role === 'admin' || member.membership.role === 'owner',
  );

/**
 * Get a list of owners for a unit.
 */
export const getUnitOwners = (unit: Unit) =>
  unit.members.filter((member) => member.membership.role === 'owner');

/**
 * Determine if a given user is a member of a given unit.
 */
export const isUserUnitMember = (user: Nullable<User>, unit: Unit) =>
  !!user && unit.members.map((member) => member.id).includes(user.id);

/**
 * Determine if a given user is an organizer for a given unit.
 */
export const isUserUnitOrganizer = (user: Nullable<User>, unit: Unit) =>
  !!user &&
  getUnitOrganizers(unit)
    .map((member) => member.id)
    .includes(user.id);

export const humanMemberRoles = defineMessages({
  [UnitMembershipRole.ADMIN]: {
    defaultMessage: 'Supervisor',
    description: 'Human readable role name for ADMIN.',
    id: 'utils.unit.roles.admin',
  },
  [UnitMembershipRole.MEMBER]: {
    defaultMessage: 'Member',
    description: 'Human readable role name for MEMBER.',
    id: 'utils.unit.roles.member',
  },
  [UnitMembershipRole.OWNER]: {
    defaultMessage: 'Manager',
    description: 'Human readable role name for OWNER.',
    id: 'utils.unit.roles.owner',
  },
});
