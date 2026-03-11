import {
  ReportAppendixEventVerb,
  ReportKDBEventVerb,
  ReportVersionEventVerb,
} from '../types';

export enum nestedUrls {
  answer = 'answer',
  appendices = 'appendices',
  content = 'content',
  draftAnswers = 'draft-answers',
  journalAndDiscussion = 'journal-discussion',
  draftAnswer = 'draft-answer',
  messages = 'messages',
  tracking = 'tracking',
  users = 'users',
}

export enum urls {
  versions = '/api/referralreportversions/',
  appendices = '/api/referralreportappendices/',
  scanFile = '/api/scan/file/',
  reports = '/api/referralreports/',
}

export const EscKeyCodes = ['Escape', 'Esc', 27];

export const eventStyle = {
  [ReportVersionEventVerb.NEUTRAL]: {
    style: 'bg-gray-400',
  },
  [ReportVersionEventVerb.VERSION_VALIDATED]: {
    style: 'bg-success-400',
  },
  [ReportAppendixEventVerb.APPENDIX_VALIDATED]: {
    style: 'bg-success-400',
  },
  [ReportVersionEventVerb.REQUEST_VALIDATION]: {
    style: 'bg-warning-400',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION]: {
    style: 'bg-warning-400',
  },
  [ReportVersionEventVerb.REQUEST_CHANGE]: {
    style: 'bg-danger-400',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE]: {
    style: 'bg-danger-400',
  },
  [ReportVersionEventVerb.VERSION_ADDED]: {
    style: 'bg-primary-400',
  },
  [ReportVersionEventVerb.VERSION_UPDATED]: {
    style: 'bg-primary-400',
  },
  [ReportAppendixEventVerb.APPENDIX_ADDED]: {
    style: 'bg-primary-400',
  },
  [ReportAppendixEventVerb.APPENDIX_UPDATED]: {
    style: 'bg-primary-400',
  },
  [ReportKDBEventVerb.KDB_SEND_UPDATE]: {
    style: 'bg-danger-400',
  },
  [ReportKDBEventVerb.KDB_SEND_OVERRIDE]: {
    style: 'bg-danger-400',
  },
};

export const textStyle = {
  [ReportVersionEventVerb.NEUTRAL]: {
    style: 'text-dsfr-gray-400',
  },
  [ReportVersionEventVerb.VERSION_VALIDATED]: {
    style: 'text-dsfr-success-500',
  },
  [ReportAppendixEventVerb.APPENDIX_VALIDATED]: {
    style: 'text-dsfr-success-500',
  },
  [ReportVersionEventVerb.REQUEST_VALIDATION]: {
    style: 'text-dsfr-warning-700',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION]: {
    style: 'text-dsfr-warning-700',
  },
  [ReportVersionEventVerb.REQUEST_CHANGE]: {
    style: 'text-dsfr-expert-500',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE]: {
    style: 'text-dsfr-expert-500',
  },
  [ReportVersionEventVerb.VERSION_ADDED]: {
    style: 'text-dsfr-primary-500',
  },
  [ReportVersionEventVerb.VERSION_UPDATED]: {
    style: 'text-dsfr-primary-500',
  },
  [ReportAppendixEventVerb.APPENDIX_ADDED]: {
    style: 'text-dsfr-primary-500',
  },
  [ReportAppendixEventVerb.APPENDIX_UPDATED]: {
    style: 'text-dsfr-primary-500',
  },
  [ReportKDBEventVerb.KDB_SEND_UPDATE]: {
    style: 'text-danger-400',
  },
  [ReportKDBEventVerb.KDB_SEND_OVERRIDE]: {
    style: 'text-danger-400',
  },
};

export const appendixHighlightStyle = {
  [ReportVersionEventVerb.NEUTRAL]: {
    style: 'bg-gray-400',
  },
  [ReportAppendixEventVerb.APPENDIX_VALIDATED]: {
    style: 'bg-success-300',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_VALIDATION]: {
    style: 'bg-warning-300',
  },
  [ReportAppendixEventVerb.APPENDIX_REQUEST_CHANGE]: {
    style: 'bg-danger-300',
  },
  [ReportAppendixEventVerb.APPENDIX_ADDED]: {
    style: 'bg-primary-300',
  },
  [ReportAppendixEventVerb.APPENDIX_UPDATED]: {
    style: 'bg-primary-300',
  },
};
