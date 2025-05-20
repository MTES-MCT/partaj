import { useIntl } from 'react-intl';
import { camelCase } from 'lodash-es';
import { FilterKeys, filterNames } from './DashboardFilters';
import { ReferralTab, tabTitleMessages } from './ReferralTabs';
import {
  unitNavMenuItemMessages,
  UnitNavSubMenuItems,
} from '../Navbar/UnitNavMenu';

export const useTranslateFilter = () => {
  const intl = useIntl();

  return (key: string) => {
    return Object.keys(filterNames).includes(camelCase(key as string))
      ? intl.formatMessage(filterNames[camelCase(key) as FilterKeys])
      : key;
  };
};

export const useTranslateTab = () => {
  const intl = useIntl();

  return (key: string) => {
    return tabTitleMessages[key as ReferralTab]
      ? intl.formatMessage(tabTitleMessages[key as ReferralTab])
      : key;
  };
};

export const useTranslateUnitTab = () => {
  const intl = useIntl();

  return (key: string) => {
    return unitNavMenuItemMessages[key as UnitNavSubMenuItems]
      ? intl.formatMessage(unitNavMenuItemMessages[key as UnitNavSubMenuItems])
      : key;
  };
};
