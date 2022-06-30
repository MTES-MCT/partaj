import { ReferralReportVersion, User } from 'types';
import { Nullable } from 'types/utils';

/**
 * Check if a given user is author of version
 */
export const isAuthor = (
  user: Nullable<User>,
  version: Nullable<ReferralReportVersion>,
) => {
  return user && version ? user.id === version.created_by.id : false;
};
