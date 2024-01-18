import { ReportEventVerb, VersionEventVerb } from 'types';
import { eventStyle } from '../const';

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
