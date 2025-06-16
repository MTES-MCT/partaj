import { MinReferral, Referral, User } from '../types';
import { isUserReferralUnitsMember } from './unit';
import { userIsApplicant } from './referral';

/**
 * Return right url for a referral based on the user role.
 */
export const getReferralUrlForUser = (
  user: User,
  referral: Referral | MinReferral,
) => {
  if (isUserReferralUnitsMember(user, referral)) {
    return `/dashboard/referral-detail/${referral.id}/content/`;
  }
  if (userIsApplicant(user, referral)) {
    return `/my-dashboard/referral-detail/${referral.id}/content/`;
  }
};
