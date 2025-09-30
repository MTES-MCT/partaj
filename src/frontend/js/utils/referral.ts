import {
  Referral,
  ReferralLite,
  ReferralSection,
  ReferralState,
  ReferralType,
  ReferralUserLink,
  SubReferral,
  User,
  UserLite,
} from 'types';
import { Nullable } from 'types/utils';
import * as types from '../types';
import {
  isUserReferralUnitsMember,
  isUserUnitMember,
  isUserUnitOrganizer,
} from './unit';

/**
 * Check if a given user is a referral applicant (i.e. requester or observer)
 */
export const userIsApplicant = (
  user: Nullable<User>,
  referral: Referral | SubReferral,
) => user && referral.users.map((user) => user.id).includes(user.id);

/**
 * Check if a given user is a referral requester
 */
export const userIsRequester = (user: Nullable<User>, referral: Referral) =>
  user && referral.requesters.map((user) => user.id).includes(user.id);

/**
 * Check if a given user is from referral affected unit
 */
export const userIsUnitMember = (user: Nullable<User>, referral: Referral) =>
  user &&
  user.memberships.some((membership: { unit: string }) =>
    referral!.units.map((unit) => unit.id).includes(membership.unit),
  );

/**
 * Check if a user has access to a referral
 */
export const userHasAccess = (
  user: Nullable<User>,
  referral: Referral | SubReferral,
) => {
  return (
    isUserReferralUnitsMember(user, referral) || userIsApplicant(user, referral)
  );
};

/**
 * Return if field should be emphasized
 */
export const isFieldEmphasized = (referral: Nullable<Referral>) =>
  referral && isSplittingState(referral);

/**
 * Check if the referral is already published
 */
export const referralIsPublished = (referral: Nullable<Referral>) =>
  referral && referral.state === ReferralState.ANSWERED;

/**
 * Check if the referral is completed
 */
export const referralIsCompleted = (referral: Nullable<Referral>) =>
  referral && (referralIsPublished(referral) || referralIsClosed(referral));

/**
 * Check if the referral is not a subsection
 */
export const referralIsMain = (referral: Nullable<Referral>) =>
  referral && referral.type === ReferralType.MAIN;

/**
 * Check if the referral is closed
 */
export const referralIsClosed = (referral: Nullable<Referral>) =>
  referral && referral.state === ReferralState.CLOSED;

/**
 * Check if the referral is open
 */
export const referralIsOpen = (referral: Nullable<Referral>) =>
  referral && !referralIsClosed(referral) && !referralIsPublished(referral);

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

/**
 * Referral permissions
 */
export const canChangeUrgencyLevel = (
  referral: Referral,
  user: Nullable<User>,
) => {
  return (
    [
      types.ReferralState.ASSIGNED,
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
      types.ReferralState.RECEIVED,
      types.ReferralState.SPLITTING,
      types.ReferralState.RECEIVED_SPLITTING,
      types.ReferralState.RECEIVED_VISIBLE,
    ].includes(referral.state) &&
    referral.units.some((unit: types.Unit) => isUserUnitMember(user, unit))
  );
};

export const canUpdateReferral = (referral: Referral, user: Nullable<User>) => {
  return (
    [
      types.ReferralState.ASSIGNED,
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
      types.ReferralState.RECEIVED,
      types.ReferralState.SPLITTING,
      types.ReferralState.RECEIVED_SPLITTING,
      types.ReferralState.RECEIVED_VISIBLE,
    ].includes(referral.state) && isUserReferralUnitsMember(user, referral)
  );
};

export const canCloseReferral = (referral: Referral, user: Nullable<User>) => {
  return (
    [
      types.ReferralState.ASSIGNED,
      types.ReferralState.IN_VALIDATION,
      types.ReferralState.PROCESSING,
      types.ReferralState.RECEIVED,
      types.ReferralState.RECEIVED_VISIBLE,
    ].includes(referral.state) &&
    (referral?.users
      .map((user: { id: any }) => user.id)
      .includes(user?.id || '$' /* impossible id */) ||
      referral.units.some((unit: types.Unit) =>
        isUserUnitOrganizer(user, unit),
      ))
  );
};

export const canPerformAssignments = (
  referral: Referral,
  user: Nullable<User>,
) => {
  return (
    [
      ReferralState.ASSIGNED,
      ReferralState.IN_VALIDATION,
      ReferralState.PROCESSING,
      ReferralState.RECEIVED,
      ReferralState.SPLITTING,
      ReferralState.RECEIVED_SPLITTING,
      ReferralState.RECEIVED_VISIBLE,
    ].includes(referral.state) &&
    // The current user is allowed to make assignments for this referral
    !!user &&
    referral.units.some((unit) => isUserUnitOrganizer(user, unit))
  );
};

export const isSplittingState = (referral: Referral) => {
  return [
    types.ReferralState.SPLITTING,
    types.ReferralState.RECEIVED_SPLITTING,
  ].includes(referral.state);
};

export const hasActiveSibling = (group: ReferralSection[]) => {
  return group?.some(
    (section) =>
      ![ReferralState.SPLITTING, ReferralState.RECEIVED_SPLITTING].includes(
        section.referral.state,
      ) && section.type !== ReferralType.MAIN,
  );
};

export const isMainReferral = (
  referral: Referral,
  group: ReferralSection[],
) => {
  return !!group?.some(
    (section) =>
      section.type === ReferralType.MAIN && section.referral.id === referral.id,
  );
};
