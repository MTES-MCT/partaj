import { defineMessages, useIntl } from 'react-intl';
import { ReferralState } from 'types';

export const messages = defineMessages({
  tabAll: {
    id: 'newDashboard.tab.all',
    defaultMessage: 'All',
    description: 'All tab label',
  },
  stateProcessing: {
    id: 'newDashboard.referralState.processing',
    defaultMessage: 'Processing',
    description: 'Processing state label',
  },
  stateAssigned: {
    id: 'newDashboard.referralState.assigned',
    defaultMessage: 'Assigned',
    description: 'Assigned state label',
  },
  stateInValidation: {
    id: 'newDashboard.referralState.in_validation',
    defaultMessage: 'In Validation',
    description: 'In Validation state label',
  },
  stateReceived: {
    id: 'newDashboard.referralState.received',
    defaultMessage: 'Received',
    description: 'Received state label',
  },
  stateClosed: {
    id: 'newDashboard.referralState.closed',
    defaultMessage: 'Closed',
    description: 'Closed state label',
  },
  stateAnswered: {
    id: 'newDashboard.referralState.answered',
    defaultMessage: 'Answered',
    description: 'Answered state label',
  },
  stateDraft: {
    id: 'newDashboard.referralState.draft',
    defaultMessage: 'Draft',
    description: 'Draft state label',
  },
  stateIncomplete: {
    id: 'newDashboard.referralState.incomplete',
    defaultMessage: 'Incomplete',
    description: 'Incomplete state label',
  },
});

export const useTranslateStatus = () => {
  const intl = useIntl();

  const translatedStatuses = Object.values(ReferralState).reduce(
    (acc, state) => {
      const uppercaseState = state.charAt(0).toUpperCase() + state.slice(1);
      const messageKey = `state${uppercaseState}` as keyof typeof messages;
      const message = messages[messageKey];

      acc[state] = message ? intl.formatMessage(message) : uppercaseState;

      return acc;
    },
    {} as Record<ReferralState, string>,
  );

  return (state: ReferralState | 'all') => {
    if (state === 'all') {
      return intl.formatMessage(messages.tabAll);
    } else if (state in translatedStatuses) {
      return translatedStatuses[state];
    }
    return state.toUpperCase();
  };
};
