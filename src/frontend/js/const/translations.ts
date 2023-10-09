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
  errorFileFormatText: {
    defaultMessage:
      'For security reasons, files of this type are not accepted. Please upload a file in a format supported by the application. (.doc, .docx, .xls, .csv, .xlsx, .pdf, .odt, .ods)',
    description: 'Error loading file text',
    id: 'const.translations.errorFileFormatText',
  },
  multipleErrorFileFormatText: {
    defaultMessage:
      'One or more attached files are in a format that is not accepted by the PARTAJ application for security reasons. Please attach a .doc, .docx, .xls, .csv, .xlsx, .pdf, .odt, .ods file.',
    description: 'Error loading multiple file text',
    id: 'const.translations.multipleErrorFileFormatText',
  },
});
