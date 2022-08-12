import { User } from 'types';

/**
 * Get a user's full name by combining name properties, mirrorring what the backend does.
 * See backend for rationale on why we do this.
 */
export const getUserFullname = (user: Pick<User, 'first_name' | 'last_name'>) =>
  `${user.first_name} ${user.last_name}`;

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
