import { defineMessages } from 'react-intl';
import { UnitMembershipRole } from '../types';

export const commonMessages = defineMessages({
  [UnitMembershipRole.OWNER]: {
    defaultMessage: 'owner',
    description: 'Translation for unit owner role',
    id: 'const.translations.owner',
  },
  [UnitMembershipRole.ADMIN]: {
    defaultMessage: 'admin',
    description: 'Translation for unit admin role',
    id: 'const.translations.admin',
  },
  [UnitMembershipRole.MEMBER]: {
    defaultMessage: 'member',
    description: 'Translation for unit member role',
    id: 'const.translations.member',
  },
});
