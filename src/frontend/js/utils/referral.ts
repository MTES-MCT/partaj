import { Referral, ReferralState, User } from 'types';
import { Nullable } from 'types/utils';

/**
 * Check if a given user is a referral requester
 */
export const userIsRequester = (user: Nullable<User>, referral: Referral) =>
  user && referral.users.map((user) => user.id).includes(user.id);

/**
 * Check if a given user is from referral affected unit
 */
export const userIsUnitMember = (user: Nullable<User>, referral: Referral) =>
  user &&
  user.memberships.some((membership: { unit: string }) =>
    referral!.units.map((unit) => unit.id).includes(membership.unit),
  );

/**
 * Check if a the referral is already published
 */
export const referralIsPublished = (referral: Nullable<Referral>) =>
  referral && referral.state === ReferralState.ANSWERED;
