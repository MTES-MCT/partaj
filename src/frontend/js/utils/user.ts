import { User } from 'types';

/**
 * Get a user's full name by combining name properties, mirrorring what the backend does.
 * See backend for rationale on why we do this.
 */
export const getUserFullname = (user: Pick<User, 'first_name' | 'last_name'>) =>
  `${user.first_name} ${user.last_name}`;
