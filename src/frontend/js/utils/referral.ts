import {
  Referral,
  ReferralLite,
  ReferralState,
  ReferralUserLink,
  User,
  UserLite,
} from 'types';
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
 * Check if the referral is already published
 */
export const referralIsPublished = (referral: Nullable<Referral>) =>
  referral && referral.state === ReferralState.ANSWERED;

/**
 * Get the user role type (observer / requester)
 */
export const getUserRoleType = (
  referral: Nullable<ReferralLite>,
  user: Nullable<UserLite>,
) => {
  const referralUser =
    user &&
    referral &&
    referral.users.find(
      (referralUserLink: ReferralUserLink) => referralUserLink.id === user.id,
    );

  return referralUser ? referralUser.role : null;
};

/**
 * Get user subscriptions on referral
 */
export const getSubscriptionType = (
  referral: Nullable<ReferralLite>,
  user: Nullable<UserLite>,
) => {
  const referralUser =
    user &&
    referral &&
    referral.users.find((userLite: UserLite) => userLite.id === user.id);

  return referralUser ? referralUser.notifications : null;
};
