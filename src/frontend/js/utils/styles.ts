import {
  Referral,
  ReferralSection,
  ReferralType,
  ReportEventVerb,
  User,
  VersionEventVerb,
} from 'types';
import { eventStyle } from '../const';
import { userHasAccess } from './referral';

/**
 * Return event style
 */
export const getEventStyle = (verb: ReportEventVerb) => {
  return eventStyle.hasOwnProperty(verb)
    ? eventStyle[verb as VersionEventVerb].style
    : eventStyle[ReportEventVerb.NEUTRAL].style;
};

/**
 * Check if verb is part of events
 */
export const isEvent = (verb: ReportEventVerb) => {
  return [
    ReportEventVerb.REQUEST_VALIDATION,
    ReportEventVerb.VERSION_UPDATED,
    ReportEventVerb.VERSION_ADDED,
    ReportEventVerb.REQUEST_CHANGE,
    ReportEventVerb.VERSION_VALIDATED,
  ].includes(verb);
};

/**
 * Return field emphasis style
 */
export const getEmphasisStyle = () => {
  return 'border border-dsfr-orange-500';
};

/**
 * Return field emphasis style
 */
export const getClassForSubReferralLink = (
  currentReferral: Referral,
  section: ReferralSection,
  currentUser: User,
) => {
  const isCurrentReferral = currentReferral.id === section.referral.id;

  if (!userHasAccess(currentUser, section.referral)) {
    return 'bg-gray-300';
  }

  if (section.type === ReferralType.MAIN) {
    return isCurrentReferral ? 'bg-primary-700' : 'bg-primary-100';
  } else {
    return isCurrentReferral ? 'bg-dsfr-orange-500' : 'bg-dsfr-orange-300';
  }
};

/**
 * Return field emphasis style
 */
export const getClassForSubReferralTooltip = (
  currentReferral: Referral,
  section: ReferralSection,
  currentUser: User,
) => {
  const isCurrentReferral = currentReferral.id === section.referral.id;

  if (!userHasAccess(currentUser, section.referral)) {
    return 'border-gray-700';
  }

  if (section.type === ReferralType.MAIN) {
    return isCurrentReferral ? 'border-primary-700' : 'border-primary-200';
  } else {
    return isCurrentReferral
      ? 'border-dsfr-orange-500'
      : 'border-dsfr-orange-300';
  }
};
