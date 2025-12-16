import { ReportAppendixEventVerb, ReportVersionEventVerb } from '../types';

export enum nestedUrls {
  answer = 'answer',
  appendices = 'appendices',
  content = 'content',
  draftAnswers = 'draft-answers',
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
