import { Unit, User } from 'types';

/**
 * Get a list of organizers for a unit.
 */
export const getUnitOrganizers = (unit: Unit) =>
  unit.members.filter(
    (member) =>
      member.membership.role === 'admin' || member.membership.role === 'owner',
  );

/**
 * Determine if a given user is an organizer for a given unit.
 */
export const isUserUnitOrganizer = (user: User, unit: Unit) =>
  getUnitOrganizers(unit)
    .map((member) => member.id)
    .includes(user.id);
