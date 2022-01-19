import { defineMessages, useIntl } from 'react-intl';

import { ReferralState } from 'types';

export const referralStateMessages = defineMessages({
  [ReferralState.ANSWERED]: {
    defaultMessage: 'Answered',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.answered',
  },
  [ReferralState.ASSIGNED]: {
    defaultMessage: 'Assigned',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.assigned',
  },
  [ReferralState.CLOSED]: {
    defaultMessage: 'Closed',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.closed',
  },
  [ReferralState.INCOMPLETE]: {
    defaultMessage: 'Incomplete',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.incomplete',
  },
  [ReferralState.IN_VALIDATION]: {
    defaultMessage: 'In validation',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.in_validation',
  },
  [ReferralState.PROCESSING]: {
    defaultMessage: 'In progress',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.processing',
  },
  [ReferralState.RECEIVED]: {
    defaultMessage: 'Received',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.received',
  },
  [ReferralState.DRAFT]: {
    defaultMessage: 'Draft',
    description: 'Text for the referral status badge for this state.',
    id: 'components.ReferralStatusBadge.draft',
  },
});

const monthsMessages = defineMessages({
  january: {
    defaultMessage: 'January',
    description: 'Localizable string for the month of January.',
    id: 'utils.sharedMessages.monthsMessages.january',
  },
  february: {
    defaultMessage: 'February',
    description: 'Localizable string for the month of February.',
    id: 'utils.sharedMessages.monthsMessages.february',
  },
  march: {
    defaultMessage: 'March',
    description: 'Localizable string for the month of March.',
    id: 'utils.sharedMessages.monthsMessages.march',
  },
  april: {
    defaultMessage: 'April',
    description: 'Localizable string for the month of April.',
    id: 'utils.sharedMessages.monthsMessages.april',
  },
  may: {
    defaultMessage: 'May',
    description: 'Localizable string for the month of May.',
    id: 'utils.sharedMessages.monthsMessages.may',
  },
  june: {
    defaultMessage: 'June',
    description: 'Localizable string for the month of June.',
    id: 'utils.sharedMessages.monthsMessages.june',
  },
  july: {
    defaultMessage: 'July',
    description: 'Localizable string for the month of July.',
    id: 'utils.sharedMessages.monthsMessages.july',
  },
  august: {
    defaultMessage: 'August',
    description: 'Localizable string for the month of August.',
    id: 'utils.sharedMessages.monthsMessages.august',
  },
  september: {
    defaultMessage: 'September',
    description: 'Localizable string for the month of September.',
    id: 'utils.sharedMessages.monthsMessages.september',
  },
  october: {
    defaultMessage: 'October',
    description: 'Localizable string for the month of October.',
    id: 'utils.sharedMessages.monthsMessages.october',
  },
  november: {
    defaultMessage: 'November',
    description: 'Localizable string for the month of November.',
    id: 'utils.sharedMessages.monthsMessages.november',
  },
  december: {
    defaultMessage: 'December',
    description: 'Localizable string for the month of December.',
    id: 'utils.sharedMessages.monthsMessages.december',
  },
});

const weekdaysLongMessages = defineMessages({
  monday: {
    defaultMessage: 'Monday',
    description: 'Localizable string for the long version of Monday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.monday',
  },
  tuesday: {
    defaultMessage: 'Tuesday',
    description: 'Localizable string for the long version of Tuesday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.tuesday',
  },
  wednesday: {
    defaultMessage: 'Wednesday',
    description: 'Localizable string for the long version of Wednesday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.wednesday',
  },
  thursday: {
    defaultMessage: 'Thursday',
    description: 'Localizable string for the long version of Thursday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.thursday',
  },
  friday: {
    defaultMessage: 'Friday',
    description: 'Localizable string for the long version of Friday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.friday',
  },
  saturday: {
    defaultMessage: 'Saturday',
    description: 'Localizable string for the long version of Saturday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.saturday',
  },
  sunday: {
    defaultMessage: 'Sunday',
    description: 'Localizable string for the long version of Sunday.',
    id: 'utils.sharedMessages.weekdaysLongMessages.sunday',
  },
});

const weekdaysShortMessages = defineMessages({
  monday: {
    defaultMessage: 'Mo',
    description: 'Localizable string for the short version of Monday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.monday',
  },
  tuesday: {
    defaultMessage: 'Tu',
    description: 'Localizable string for the short version of Tuesday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.tuesday',
  },
  wednesday: {
    defaultMessage: 'We',
    description: 'Localizable string for the short version of Wednesday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.wednesday',
  },
  thursday: {
    defaultMessage: 'Th',
    description: 'Localizable string for the short version of Thursday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.thursday',
  },
  friday: {
    defaultMessage: 'Fr',
    description: 'Localizable string for the short version of Friday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.friday',
  },
  saturday: {
    defaultMessage: 'Sa',
    description: 'Localizable string for the short version of Saturday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.saturday',
  },
  sunday: {
    defaultMessage: 'Su',
    description: 'Localizable string for the short version of Sunday.',
    id: 'utils.sharedMessages.weekdaysShortMessages.sunday',
  },
});

export const useReactDayPickerL10n = () => {
  const intl = useIntl();

  return {
    MONTHS: [
      intl.formatMessage(monthsMessages.january),
      intl.formatMessage(monthsMessages.february),
      intl.formatMessage(monthsMessages.march),
      intl.formatMessage(monthsMessages.april),
      intl.formatMessage(monthsMessages.may),
      intl.formatMessage(monthsMessages.june),
      intl.formatMessage(monthsMessages.july),
      intl.formatMessage(monthsMessages.august),
      intl.formatMessage(monthsMessages.september),
      intl.formatMessage(monthsMessages.october),
      intl.formatMessage(monthsMessages.november),
      intl.formatMessage(monthsMessages.december),
    ],
    WEEKDAYS_LONG: [
      intl.formatMessage(weekdaysLongMessages.monday),
      intl.formatMessage(weekdaysLongMessages.tuesday),
      intl.formatMessage(weekdaysLongMessages.wednesday),
      intl.formatMessage(weekdaysLongMessages.thursday),
      intl.formatMessage(weekdaysLongMessages.friday),
      intl.formatMessage(weekdaysLongMessages.saturday),
      intl.formatMessage(weekdaysLongMessages.sunday),
    ],
    WEEKDAYS_SHORT: [
      intl.formatMessage(weekdaysShortMessages.monday),
      intl.formatMessage(weekdaysShortMessages.tuesday),
      intl.formatMessage(weekdaysShortMessages.wednesday),
      intl.formatMessage(weekdaysShortMessages.thursday),
      intl.formatMessage(weekdaysShortMessages.friday),
      intl.formatMessage(weekdaysShortMessages.saturday),
      intl.formatMessage(weekdaysShortMessages.sunday),
    ],
  };
};
