import { defineMessages } from 'react-intl';

import { Referral, Unit, UnitMembershipRole, User } from 'types';
import { Nullable } from 'types/utils';
import * as types from '../types';

/**
 * Check if a given user is a referral requester
 */
export const userIsRequester = (user: Nullable<User>, referral: Referral) =>
  user &&
  referral.users
    .map((user) => user.id)
    .includes(user?.id || '$' /* impossible id */);

/**
 * Check if a given user is from referral affected unit
 */
export const userIsUnitMember = (user: Nullable<User>, referral: Referral) => {

  const tieps = user &&
  user.memberships.some((membership: { unit: string }) =>
    referral!.units.map((unit) => unit.id).includes(membership.unit),
  );
  console.log("tieps")
  console.log(tieps);
  return tieps
}
