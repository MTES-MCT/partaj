import {
  Referral,
  ReferralSection,
  ReferralType,
  ReportAppendixEventVerb,
  ReportEventVerb,
  ReportKDBEventVerb,
  ReportVersionEventVerb,
  User,
  VersionEventVerb,
} from 'types';
import { appendixHighlightStyle, eventStyle, textStyle } from '../const';
import { userHasAccess } from './referral';

/**
 * Return event style
 */
export const getEventStyle = (verb: ReportEventVerb) => {
  return eventStyle.hasOwnProperty(verb)
    ? eventStyle[verb as VersionEventVerb].style
    : eventStyle[ReportVersionEventVerb.NEUTRAL].style;
};

/**
 * Return text style
 */
export const getTextStyle = (verb: ReportEventVerb) => {
  return textStyle.hasOwnProperty(verb)
    ? textStyle[verb as VersionEventVerb].style
    : textStyle[ReportVersionEventVerb.NEUTRAL].style;
};

/**
 * Return event style
 */
export const getAppendixEventStyle = (verb: ReportEventVerb) => {
  return appendixHighlightStyle.hasOwnProperty(verb)
    ? appendixHighlightStyle[verb as ReportAppendixEventVerb].style
    : appendixHighlightStyle[ReportVersionEventVerb.NEUTRAL].style;
};

/**
 * Check if verb is part of events
 */
export const isEvent = (verb: ReportEventVerb) => {
  return [
    ReportVersionEventVerb.REQUEST_VALIDATION,
    ReportVersionEventVerb.VERSION_UPDATED,
    ReportVersionEventVerb.VERSION_ADDED,
    ReportVersionEventVerb.REQUEST_CHANGE,
    ReportVersionEventVerb.VERSION_VALIDATED,
    ReportKDBEventVerb.KDB_SEND_UPDATE,
    ReportKDBEventVerb.KDB_SEND_OVERRIDE,
    ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE,
    ReportAppendixEventVerb.APPENDIX_VALIDATED,
    ReportAppendixEventVerb.APPENDIX_UPDATED,
    ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION,
    ReportAppendixEventVerb.APPENDIX_ADDED,
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
