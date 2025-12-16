import { ReferralReportAppendix, ReferralReportVersion, User } from 'types';
import { Nullable } from 'types/utils';

/**
 * Check if a given user is author of version
 */
export const isAuthor = (
  user: Nullable<User>,
  target: Nullable<ReferralReportVersion | ReferralReportAppendix>,
) => {
  return user && target ? user.id === target.created_by.id : false;
};
