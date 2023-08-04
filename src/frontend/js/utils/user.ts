import { defineMessages, useIntl } from 'react-intl';

import { Referral, ReferralLite, UnitMembershipRole, User } from 'types';
import { Nullable } from '../types/utils';
import { getFirstItem } from './string';

/**
 * The list of the different directions in the central administration, taken
 * from the intra-ministry directory
 */
const centralAdminDirections = [
  'CBCM',
  'CF-EAU-IGN',
  'CGDD',
  'DGAC',
  'DGALN',
  'DGAMPA',
  'DGCL',
  'DGEC',
  'DGITM',
  'DGPR',
  'DIHAL',
  'DPMA',
  'SG',
  'OH',
  'DGAMPA',
];

const messages = defineMessages({
  invitationPending: {
    defaultMessage: 'Invitation pending',
    description: 'Pending message when a referral user is invited',
    id: 'utils.user.invitationPending',
  },
  deletedUser: {
    defaultMessage: 'Deleted user',
    description: `deleted user text`,
    id: 'components.EventMessage.deletedUser',
  },
});

/**
 * Get a user's full name by combining name properties, mirroring what the backend does.
 * See backend for rationale on why we do this.
 */
export const getUserFullname = (
  user: Pick<User, 'first_name' | 'last_name'>,
) => {
  return `${user.first_name} ${user.last_name}`;
};

/**
 * Get a user's full name or email depending on user data
 * See backend for rationale on why we do this.
 */
export const getUserFullnameOrEmail = (
  user: Pick<User, 'first_name' | 'last_name' | 'email'>,
) => {
  return !user.first_name ? user.email : getUserFullname(user);
};

/**
 * Get a user's unit name or pending message depending on user data
 */
export const getUnitNameOrPendingMessage = (user: Pick<User, 'unit_name'>) => {
  const intl = useIntl();
  return user.unit_name
    ? user.unit_name
    : intl.formatMessage(messages.invitationPending);
};

/**
 * Get a user's full name by combining name properties, mirrorring what the backend does.
 * See backend for rationale on why we do this.
 */
export const getUserShortname = (
  user: Pick<User, 'first_name' | 'last_name'>,
) => `${user.first_name.charAt(0).toUpperCase()}. ${user.last_name}`;

/**
 * Get displayed user notification name
 */
export const getNotificationName = (
  user: Pick<User, 'first_name' | 'last_name'>,
) =>
  `@${user.first_name.charAt(0).toLowerCase()}.${user.last_name.toLowerCase()}`;

/**
 * Get a user's initials for cases where we want a compressed view of a user.
 */
export const getUserInitials = (user: Pick<User, 'first_name' | 'last_name'>) =>
  user.first_name[0] + user.last_name[0];

/**
 * Check if user has an ADMIN role into his units
 */
export const isAdmin = (user: Nullable<User>) => {
  return (
    user &&
    user.memberships.some(
      (membership) => membership.role === UnitMembershipRole.ADMIN,
    )
  );
};

/**
 * Check if user has an ADMIN role into his units
 */
export const isGranted = (
  user: Nullable<User>,
  referral: Nullable<Referral>,
) => {
  const grantedMemberships = user!.memberships.filter((membership) => {
    return [UnitMembershipRole.ADMIN, UnitMembershipRole.OWNER].includes(
      membership.role,
    );
  });

  const referralUnitIds = referral!.units.map((unit) => unit.id);

  return grantedMemberships.some((membership) =>
    referralUnitIds.includes(membership.unit),
  );
};

/**
 * Check if user has a membership, useful to detect the requester account
 */
export const hasMembership = (user: Nullable<User>) => {
  return user && user.memberships.length > 0;
};

/**
 * Check if user is from a unit located in the central administration
 * or a decentralized unit
 */
export const isFromCentralUnit = (user: Nullable<User>) => {
  if (!user) return false;

  const userDirection = getFirstItem(user.unit_name, '/') ?? '';

  return centralAdminDirections.includes(userDirection);
};
