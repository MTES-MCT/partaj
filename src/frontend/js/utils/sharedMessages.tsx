import { defineMessages } from 'react-intl';

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
});
