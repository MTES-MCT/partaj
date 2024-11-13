import { ReferralState } from 'types';
import { referralStatusMessages } from '../../const/messages/referralStatus';
import { useIntl } from 'react-intl';

export const useTranslateStatus = () => {
  const intl = useIntl();

  return (state: ReferralState) => {
    return referralStatusMessages[state]
      ? intl.formatMessage(referralStatusMessages[state])
      : state;
  };
};
