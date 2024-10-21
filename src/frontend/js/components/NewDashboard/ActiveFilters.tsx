import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ClickableBadge } from 'components/dsfr/ClickableBadge';
import { ComboboxOption } from 'components/dsfr/Combobox';
import { useDashboardContext } from './DashboardContext';

export const messages = defineMessages({
  filterSearch: {
    id: 'newDashboard.filter.search',
    defaultMessage: 'Search: {search}',
    description: 'Search filter label',
  },
  filterUser: {
    id: 'newDashboard.filter.user',
    defaultMessage: 'User: {user}',
    description: 'User filter label',
  },
  filterUnit: {
    id: 'newDashboard.filter.unit',
    defaultMessage: 'Unit: {unit}',
    description: 'Unit filter label',
  },
  filterDate: {
    id: 'newDashboard.filter.date',
    defaultMessage: 'Date: {from} - {to}',
    description: 'Date filter label',
  },
  filterTheme: {
    id: 'newDashboard.filter.theme',
    defaultMessage: 'Theme: {theme}',
    description: 'Theme filter label',
  },
  filterRequester: {
    id: 'newDashboard.filter.requester',
    defaultMessage: 'Requester: {requester}',
    description: 'Requester filter label',
  },
  filterRequesterUnit: {
    id: 'newDashboard.filter.requesterUnit',
    defaultMessage: 'Requester Unit: {requesterUnit}',
    description: 'Requester Unit filter label',
  },
});

interface ActiveFiltersProps {
  themeOptions: ComboboxOption[] | undefined;
  requesterOptions: ComboboxOption[] | undefined;
  requesterUnitOptions: ComboboxOption[] | undefined;
  userOptions: ComboboxOption[] | undefined;
  unitOptions: ComboboxOption[] | undefined;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  themeOptions,
  requesterOptions,
  requesterUnitOptions,
  userOptions,
  unitOptions,
}) => {
  const intl = useIntl();
  const { state, dispatch } = useDashboardContext();
  const {
    themeId,
    requesterId,
    requesterUnitId,
    search,
    userId,
    unitId,
    dateRange,
  } = state;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const clearTheme = () => dispatch({ type: 'SET_THEME_ID', payload: '' });

  const clearRequester = () =>
    dispatch({ type: 'SET_REQUESTER_ID', payload: '' });

  const clearRequesterUnit = () =>
    dispatch({ type: 'SET_REQUESTER_UNIT_ID', payload: '' });

  const clearSearch = () => dispatch({ type: 'SET_SEARCH', payload: '' });

  const clearUser = () => dispatch({ type: 'SET_USER_ID', payload: '' });

  const clearUnit = () => dispatch({ type: 'SET_UNIT_ID', payload: '' });

  const clearDate = () =>
    dispatch({ type: 'SET_DATE_RANGE', payload: undefined });

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (search) {
      activeFilters.push(
        <ClickableBadge key="search" onClose={clearSearch}>
          {intl.formatMessage(messages.filterSearch, { search })}
        </ClickableBadge>,
      );
    }

    if (userId) {
      const selectedUser = userOptions?.find(
        (option) => option.value === userId,
      );
      activeFilters.push(
        <ClickableBadge key="user" onClose={clearUser}>
          {intl.formatMessage(messages.filterUser, {
            user: selectedUser?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (unitId) {
      const selectedUnit = unitOptions?.find(
        (option) => option.value === unitId,
      );
      activeFilters.push(
        <ClickableBadge key="unit" onClose={clearUnit}>
          {intl.formatMessage(messages.filterUnit, {
            unit: selectedUnit?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (themeId) {
      const selectedTheme = themeOptions?.find(
        (option) => option.value === themeId,
      );
      activeFilters.push(
        <ClickableBadge key="theme" onClose={clearTheme}>
          {intl.formatMessage(messages.filterTheme, {
            theme: selectedTheme?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (requesterId) {
      const selectedRequester = requesterOptions?.find(
        (option) => option.value === requesterId,
      );
      activeFilters.push(
        <ClickableBadge key="requester" onClose={clearRequester}>
          {intl.formatMessage(messages.filterRequester, {
            requester: selectedRequester?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (requesterUnitId) {
      const selectedRequesterUnit = requesterUnitOptions?.find(
        (option) => option.value === requesterUnitId,
      );
      activeFilters.push(
        <ClickableBadge key="requesterUnit" onClose={clearRequesterUnit}>
          {intl.formatMessage(messages.filterRequesterUnit, {
            requesterUnit: selectedRequesterUnit?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (dateRange?.from && dateRange?.to) {
      activeFilters.push(
        <ClickableBadge key="date" onClose={clearDate}>
          {intl.formatMessage(messages.filterDate, {
            from: formatDate(dateRange.from),
            to: formatDate(dateRange.to),
          })}
        </ClickableBadge>,
      );
    }

    return activeFilters;
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2">{renderActiveFilters()}</div>
  );
};
