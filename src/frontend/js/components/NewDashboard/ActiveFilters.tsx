import React from 'react';
import { useIntl } from 'react-intl';

import { ClickableBadge } from 'components/dsfr/ClickableBadge';
import { ComboboxOption } from 'components/dsfr/Combobox';
import { DateRange } from 'components/dsfr/DateRangePicker';

import { messages } from './messages';

interface ActiveFiltersProps {
  search: string;
  userId: string;
  unitId: string;
  dateRange: DateRange | undefined;
  userOptions: ComboboxOption[] | undefined;
  unitOptions: ComboboxOption[] | undefined;
  handleClearSearch: () => void;
  handleClearUser: () => void;
  handleClearUnit: () => void;
  handleClearDateFilter: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  search,
  userId,
  unitId,
  dateRange,
  userOptions,
  unitOptions,
  handleClearSearch,
  handleClearUser,
  handleClearUnit,
  handleClearDateFilter,
}) => {
  const intl = useIntl();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (search) {
      activeFilters.push(
        <ClickableBadge key="search" onClose={handleClearSearch}>
          {intl.formatMessage(messages.filterSearch, { search })}
        </ClickableBadge>,
      );
    }

    if (userId) {
      const selectedUser = userOptions?.find(
        (option) => option.value === userId,
      );
      activeFilters.push(
        <ClickableBadge key="user" onClose={handleClearUser}>
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
        <ClickableBadge key="unit" onClose={handleClearUnit}>
          {intl.formatMessage(messages.filterUnit, {
            unit: selectedUnit?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (dateRange?.from && dateRange?.to) {
      activeFilters.push(
        <ClickableBadge key="date" onClose={handleClearDateFilter}>
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
