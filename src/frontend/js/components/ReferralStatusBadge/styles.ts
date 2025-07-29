import { ReferralState } from '../../types';

export const classes = {
  [ReferralState.DRAFT]: 'bg-grey-100',
  [ReferralState.CLOSED]: 'bg-grey-100',
  [ReferralState.RECEIVED]: 'bg-mallow-100',
  [ReferralState.RECEIVED_VISIBLE]: 'bg-mallow-100',
  [ReferralState.ASSIGNED]: 'bg-lightblue-100',
  [ReferralState.PROCESSING]: 'bg-primary-100',
  [ReferralState.IN_VALIDATION]: 'bg-warning-200',
  [ReferralState.ANSWERED]: 'bg-success-100',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-dsfr-orange-200',
  [ReferralState.SPLITTING]: 'bg-dsfr-orange-200',
};

export const stateStyles = {
  [ReferralState.DRAFT]: 'bg-grey-400',
  [ReferralState.CLOSED]: 'bg-grey-1000',
  [ReferralState.RECEIVED]: 'bg-mallow-400',
  [ReferralState.RECEIVED_VISIBLE]: 'bg-mallow-400',
  [ReferralState.ASSIGNED]: 'bg-lightblue-400',
  [ReferralState.PROCESSING]: 'bg-primary-400',
  [ReferralState.IN_VALIDATION]: 'bg-warning-400',
  [ReferralState.ANSWERED]: 'bg-success-400',
  [ReferralState.SPLITTING]: 'bg-dsfr-orange-500',
  [ReferralState.RECEIVED_SPLITTING]: 'bg-dsfr-orange-500',
};
