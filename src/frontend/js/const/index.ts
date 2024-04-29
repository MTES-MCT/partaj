import { ReportEventVerb } from '../types';

export enum nestedUrls {
  answer = 'answer',
  content = 'content',
  draftAnswers = 'draft-answers',
  draftAnswer = 'draft-answer',
  messages = 'messages',
  tracking = 'tracking',
  users = 'users',
}

export enum urls {
  versions = '/api/referralreportversions/',
  scanFile = '/api/scan/file/',
  reports = '/api/referralreports/',
}

export const EscKeyCodes = ['Escape', 'Esc', 27];

export const eventStyle = {
  [ReportEventVerb.NEUTRAL]: {
    style: 'bg-gray-400',
  },
  [ReportEventVerb.VERSION_VALIDATED]: {
    style: 'bg-success-400',
  },
  [ReportEventVerb.REQUEST_VALIDATION]: {
    style: 'bg-warning-400',
  },
  [ReportEventVerb.REQUEST_CHANGE]: {
    style: 'bg-danger-400',
  },
  [ReportEventVerb.VERSION_ADDED]: {
    style: 'bg-primary-400',
  },
  [ReportEventVerb.VERSION_UPDATED]: {
    style: 'bg-primary-400',
  },
};
