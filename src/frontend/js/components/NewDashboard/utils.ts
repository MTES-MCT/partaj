import { ReferralState } from 'types';
import { referralStatusMessages } from '../../const/messages/referralStatus';
import { useIntl } from 'react-intl';
import { camelCase } from 'lodash-es';
import { FilterKeys, filterNames } from './DashboardFilters';

export const useTranslateStatus = () => {
  const intl = useIntl();

  return (state: ReferralState) => {
    return referralStatusMessages[state]
      ? intl.formatMessage(referralStatusMessages[state])
      : state;
  };
};

export const useTranslateFilter = () => {
  const intl = useIntl();

  return (key: string) => {
    return Object.keys(filterNames).includes(camelCase(key as string))
      ? intl.formatMessage(filterNames[camelCase(key) as FilterKeys])
      : key;
  };
};
