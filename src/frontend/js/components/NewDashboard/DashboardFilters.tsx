import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Combobox, ComboboxOption } from 'components/dsfr/Combobox';
import { DateRange, DateRangePicker } from 'components/dsfr/DateRangePicker';
import { Input } from 'components/dsfr/Input';
import { useDashboardContext } from './DashboardContext';

export const messages = defineMessages({
  searchPlaceholder: {
    id: 'newDashboard.search.placeholder',
    defaultMessage: 'Search...',
    description: 'Search input placeholder',
  },
  filterUserPlaceholder: {
    id: 'newDashboard.filter.user.placeholder',
    defaultMessage: 'Filter by user...',
    description: 'User filter input placeholder',
  },
  filterUnitPlaceholder: {
    id: 'newDashboard.filter.unit.placeholder',
    defaultMessage: 'Filter by unit...',
    description: 'Unit filter input placeholder',
  },
  filterDatePlaceholder: {
    id: 'newDashboard.filter.date.placeholder',
    defaultMessage: 'Filter by date...',
    description: 'Date filter input placeholder',
  },
  filterRequesterPlaceholder: {
    id: 'newDashboard.filter.requester.placeholder',
    defaultMessage: 'Filter by requester...',
    description: 'Requester filter input placeholder',
  },
  filterRequesterUnitPlaceholder: {
    id: 'newDashboard.filter.requesterUnit.placeholder',
    defaultMessage: 'Filter by requester unit...',
    description: 'Requester Unit filter input placeholder',
  },
  filterThemePlaceholder: {
    id: 'newDashboard.filter.theme.placeholder',
    defaultMessage: 'Filter by theme...',
    description: 'Theme filter input placeholder',
  },
});

interface DashboardFiltersProps {
  themeOptions: ComboboxOption[] | undefined;
  requesterOptions: ComboboxOption[] | undefined;
  requesterUnitOptions: ComboboxOption[] | undefined;
  userOptions: ComboboxOption[] | undefined;
  unitOptions: ComboboxOption[] | undefined;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
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

  const selectTheme = (value: string) =>
    dispatch({ type: 'SET_THEME_ID', payload: value });

  const selectRequester = (value: string) =>
    dispatch({ type: 'SET_REQUESTER_ID', payload: value });

  const selectRequesterUnit = (value: string) =>
    dispatch({ type: 'SET_REQUESTER_UNIT_ID', payload: value });

  const selectUser = (value: string) =>
    dispatch({ type: 'SET_USER_ID', payload: value });

  const selectUnit = (value: string) =>
    dispatch({ type: 'SET_UNIT_ID', payload: value });

  const setSearch = (value: string) =>
    dispatch({ type: 'SET_SEARCH', payload: value });

  const setDateRange = (newDateRange: DateRange | undefined) =>
    dispatch({ type: 'SET_DATE_RANGE', payload: newDateRange });

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder={intl.formatMessage(messages.searchPlaceholder)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mr-4"
        />
      </div>
      <div className="flex space-x-4">
        <Combobox
          options={userOptions || []}
          placeholder={intl.formatMessage(messages.filterUserPlaceholder)}
          value={userId}
          onChange={selectUser}
        />
        <Combobox
          options={unitOptions || []}
          placeholder={intl.formatMessage(messages.filterUnitPlaceholder)}
          value={unitId}
          onChange={selectUnit}
        />
        <Combobox
          options={requesterOptions || []}
          placeholder={intl.formatMessage(messages.filterRequesterPlaceholder)}
          value={requesterId}
          onChange={selectRequester}
        />
        <Combobox
          options={requesterUnitOptions || []}
          placeholder={intl.formatMessage(
            messages.filterRequesterUnitPlaceholder,
          )}
          value={requesterUnitId}
          onChange={selectRequesterUnit}
        />
        <Combobox
          options={themeOptions || []}
          placeholder={intl.formatMessage(messages.filterThemePlaceholder)}
          value={themeId}
          onChange={selectTheme}
        />
        <DateRangePicker
          onChange={setDateRange}
          value={dateRange}
          placeholder={intl.formatMessage(messages.filterDatePlaceholder)}
        />
      </div>
    </div>
  );
};
