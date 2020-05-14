import { Unit, User } from 'types';
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
