import React from 'react';
import { useIntl } from 'react-intl';

import { Combobox, ComboboxOption } from 'components/dsfr/Combobox';
import { DateRange, DateRangePicker } from 'components/dsfr/DateRangePicker';
import { Input } from 'components/dsfr/Input';

import { messages } from './messages';

interface DashboardFiltersProps {
  search: string;
  userId: string;
  unitId: string;
  dateRange: DateRange | undefined;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectUser: (value: string) => void;
  handleSelectUnit: (value: string) => void;
  handleDateRangeChange: (newDateRange: DateRange | undefined) => void;
  userOptions: ComboboxOption[] | undefined;
  unitOptions: ComboboxOption[] | undefined;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  search,
  userId,
  unitId,
  dateRange,
  handleSearch,
  handleSelectUser,
  handleSelectUnit,
  handleDateRangeChange,
  userOptions,
  unitOptions,
}) => {
  const intl = useIntl();

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder={intl.formatMessage(messages.searchPlaceholder)}
          value={search}
          onChange={handleSearch}
          className="w-full mr-4"
        />
      </div>
      <div className="flex space-x-4">
        <Combobox
          options={userOptions || []}
          placeholder={intl.formatMessage(messages.filterUserPlaceholder)}
          value={userId}
          onChange={handleSelectUser}
        />
        <Combobox
          options={unitOptions || []}
          placeholder={intl.formatMessage(messages.filterUnitPlaceholder)}
          value={unitId}
          onChange={handleSelectUnit}
        />
        <DateRangePicker onChange={handleDateRangeChange} value={dateRange} />
      </div>
    </div>
  );
};
