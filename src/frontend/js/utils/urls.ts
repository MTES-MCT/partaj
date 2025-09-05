import { SubReferral, Referral, User } from '../types';
import { isUserReferralUnitsMember } from './unit';
import { userIsApplicant } from './referral';

/**
 * Return the right url for a referral based on the user role.
 */
export const getReferralUrlForUser = (
  user: User,
  referral: Referral | SubReferral,
) => {
  if (isUserReferralUnitsMember(user, referral)) {
    return `/dashboard/referral-detail/${referral.id}/content/`;
  }
  if (userIsApplicant(user, referral)) {
    return `/my-dashboard/referral-detail/${referral.id}/content/`;
  }
};

export const getHash = (defaultValue: string) =>
  location.hash.slice(1).trim().length > 0
    ? location.hash.slice(1)
    : defaultValue;
