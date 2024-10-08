import React, { ChangeEvent } from 'react';
import { useIntl } from 'react-intl';

import { Combobox, ComboboxOption } from 'components/dsfr/Combobox';
import { DateRange, DateRangePicker } from 'components/dsfr/DateRangePicker';
import { Input } from 'components/dsfr/Input';

import { messages } from './messages';

interface DashboardFiltersProps {
  themeId: string;
  requesterId: string;
  requesterUnitId: string;
  search: string;
  userId: string;
  unitId: string;
  dateRange: DateRange | undefined;
  handleSelectTheme: (value: string) => void;
  handleSelectRequester: (value: string) => void;
  handleSelectRequesterUnit: (value: string) => void;
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSelectUser: (value: string) => void;
  handleSelectUnit: (value: string) => void;
  handleDateRangeChange: (newDateRange: DateRange | undefined) => void;
  themeOptions: ComboboxOption[] | undefined;
  requesterOptions: ComboboxOption[] | undefined;
  requesterUnitOptions: ComboboxOption[] | undefined;
  userOptions: ComboboxOption[] | undefined;
  unitOptions: ComboboxOption[] | undefined;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  themeId,
  requesterId,
  requesterUnitId,
  search,
  userId,
  unitId,
  dateRange,
  handleSelectTheme,
  handleSelectRequester,
  handleSelectRequesterUnit,
  handleSearch,
  handleSelectUser,
  handleSelectUnit,
  handleDateRangeChange,
  themeOptions,
  requesterOptions,
  requesterUnitOptions,
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
        <Combobox
          options={requesterOptions || []}
          placeholder={intl.formatMessage(messages.filterRequesterPlaceholder)}
          value={requesterId}
          onChange={handleSelectRequester}
        />
        <Combobox
          options={requesterUnitOptions || []}
          placeholder={intl.formatMessage(
            messages.filterRequesterUnitPlaceholder,
          )}
          value={requesterUnitId}
          onChange={handleSelectRequesterUnit}
        />
        <Combobox
          options={themeOptions || []}
          placeholder={intl.formatMessage(messages.filterThemePlaceholder)}
          value={themeId}
          onChange={handleSelectTheme}
        />
        <DateRangePicker
          onChange={handleDateRangeChange}
          value={dateRange}
          placeholder={intl.formatMessage(messages.filterDatePlaceholder)}
        />
      </div>
    </div>
  );
};
