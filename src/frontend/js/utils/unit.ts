import { defineMessages } from 'react-intl';

import {
  Unit,
  UnitMembershipRole,
  User,
  Referral,
  UnitMembership,
} from 'types';
import { Nullable } from 'types/utils';
import { getLastItem } from './string';
import { getUserFullname } from './user';

/**
 * Extract units names from a list of units and put them in a string
 */
export const getUnitsNames = (units: Unit[]): string => {
  const unitsFullNames = units.map((unit) => unit.name);
  const unitsNames = unitsFullNames.map((unit) => getLastItem(unit, '/'));

  return unitsNames.join(', ');
};

/**
 * Get a list of organizers for a unit.
 */
export const getUnitOrganizers = (unit: Unit) =>
  unit.members.filter(
    (member) =>
      member.membership.role === 'superadmin' ||
      member.membership.role === 'admin' ||
      member.membership.role === 'owner',
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

export const isUserReferralUnitsMember = (
  user: Nullable<User>,
  referral: Referral,
) => referral.units.some((unit) => isUserUnitMember(user, unit));

/**
 * Determine if a given user is an organizer for a given unit.
 */
export const isUserUnitOrganizer = (user: Nullable<User>, unit: Unit) =>
  !!user &&
  getUnitOrganizers(unit)
    .map((member) => member.id)
    .includes(user.id);

export const humanMemberRoles = defineMessages({
  [UnitMembershipRole.SUPERADMIN]: {
    defaultMessage: 'Director',
    description: 'Human readable role name for SUPERADMIN.',
    id: 'utils.unit.roles.superadmin',
  },
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

/**
 * Take a list of UnitMembership and returns it ordered first by hierarchy and
 * second alphabetically
 */
export const orderMembershipsAlphabeticallyByHierarchy = (
  unitMemberships: UnitMembership[],
) => {
  const membershipsByRole = unitMemberships.reduce(
    (acc: { [role: string]: UnitMembership[] }, membership) => {
      if (!acc[membership.role]) {
        acc[membership.role] = [];
      }

      acc[membership.role].push(membership);

      return acc;
    },
    {},
  );

  const orderedMembershipsByRole = Object.keys(membershipsByRole).reduce(
    (acc: { [role: string]: UnitMembership[] }, role) => {
      const memberships = membershipsByRole[role];
      acc[role] = memberships.sort((a, b) =>
        getUserFullname(a.user)
          .toLowerCase()
          .localeCompare(getUserFullname(b.user).toLowerCase()),
      );

      return acc;
    },
    {},
  );

  const orderedMemberships = [
    orderedMembershipsByRole[UnitMembershipRole.SUPERADMIN],
    orderedMembershipsByRole[UnitMembershipRole.ADMIN],
    orderedMembershipsByRole[UnitMembershipRole.OWNER],
    orderedMembershipsByRole[UnitMembershipRole.MEMBER],
  ]
    .filter((e) => e !== undefined)
    .flat();

  return orderedMemberships;
};
