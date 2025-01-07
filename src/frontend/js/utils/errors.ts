import { ErrorCodes } from '../types';
import { commonMessages } from '../const/translations';
import { IntlShape } from 'react-intl';
import { appData } from 'appData';

export const getErrorMessage = (errorCode: string, intl: IntlShape) => {
  if (errorCode === ErrorCodes.FILE_FORMAT_FORBIDDEN) {
    return intl.formatMessage(commonMessages.errorFileFormatText);
  } else if (errorCode === ErrorCodes.FILE_SCAN_KO) {
    return intl.formatMessage(commonMessages.errorFileScanKO, {
      mail: appData.contact_email,
    });
  } else {
    return intl.formatMessage(commonMessages.defaultErrorMessage, {
      mail: appData.contact_email,
    });
  }
};
