import { defineMessages } from 'react-intl';

import { FilterColumns } from './types';

export const sharedMessages = defineMessages({
  [FilterColumns.ASSIGNEE]: {
    defaultMessage: 'Assignee',
    description:
      'Name for the column filter for assignee in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnAssignee',
  },
  [FilterColumns.DUE_DATE]: {
    defaultMessage: 'Due date',
    description:
      'Name for the column filter for due date in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnDueDate',
  },
  [FilterColumns.STATE]: {
    defaultMessage: 'State',
    description:
      'Name for the column filter for state in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnState',
  },
  [FilterColumns.UNIT]: {
    defaultMessage: 'Unit',
    description:
      'Name for the column filter for unit in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnUnit',
  },
  [FilterColumns.USER]: {
    defaultMessage: 'Requester',
    description:
      'Name for the column filter for unit in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnUser',
  },
  [FilterColumns.USER_UNIT_NAME]: {
    defaultMessage: 'Requester unit',
    description:
      'Name for the column filter for user in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnUserUnitName',
  },
  [FilterColumns.TOPIC]: {
    defaultMessage: 'Topic',
    description:
      'Name for the column filter for user in the filters dropdown menu in referral table.',
    id: 'components.ReferralTable.sharedMessages.columnTopic',
  },
});
