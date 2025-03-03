import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDashboardContext } from './DashboardContext';
import { useFiltersReferralLites } from '../../data/dashboard';
import { Option, SearchMultiSelect } from '../select/SearchMultiSelect';
import { useTranslateFilter } from './utils';
import { DateSelect } from '../select/DateSelect';
import { DateRange } from 'react-day-picker';
import { messages as columnMessages } from '../NewDashboard/ReferralTable';

export enum FilterKeys {
  TOPICS = 'topics',
  ASSIGNEES = 'assignees',
  CONTRIBUTORS_UNIT_NAMES = 'contributorsUnitNames',
  REQUESTERS = 'requesters',
  REQUESTERS_UNIT_NAMES = 'requestersUnitNames',
}

export enum DateFilterKeys {
  DUE_DATE = 'due_date',
  SENT_DATE = 'sent_at',
}

export const filterNames = defineMessages({
  topics: {
    defaultMessage: 'Topics',
    description: 'Topic filter text',
    id: 'components.DashboardFilters.topics',
  },
  assignees: {
    defaultMessage: 'Assignees',
    description: 'Assigned unit name filter text',
    id: 'components.DashboardFilters.assignees',
  },
  contributorsUnitNames: {
    defaultMessage: 'Contributors unit names',
    description: 'Contributors filter text',
    id: 'components.DashboardFilters.contributorsUnitNames',
  },
  requestersUnitNames: {
    defaultMessage: 'Requesters unit names',
    description: 'Requester unit name filter text',
    id: 'components.DashboardFilters.requestersUnitNames',
  },
  requesters: {
    defaultMessage: 'Requesters',
    description: 'Requester unit name filter text',
    id: 'components.DashboardFilters.requesters',
  },
  dueDateBefore: {
    defaultMessage: 'Due date before',
    description: 'Due date before filter name',
    id: 'components.DashboardFilters.dueDateBefore',
  },
  dueDateAfter: {
    defaultMessage: 'Due date after',
    description: 'Due date after filter name',
    id: 'components.DashboardFilters.dueDateAfter',
  },
  sentAtAfter: {
    defaultMessage: 'Sending date after',
    description: 'Send date filter name',
    id: 'components.DashboardFilters.sentAtAfter',
  },
  sentAtBefore: {
    defaultMessage: 'Sending date before',
    description: 'Send date filter name',
    id: 'components.DashboardFilters.sentAtBefore',
  },
});

export const DashboardFilters: React.FC<{ forceFilters: Array<string> }> = ({
  forceFilters,
}) => {
  const intl = useIntl();
  const { params, toggleFilter, updateDateFilter } = useDashboardContext();
  const [filters, setFilters] = useState<Array<any>>([]);
  const translateFilter = useTranslateFilter();
  const filtersMutation = useFiltersReferralLites({
    onSuccess: (data) => {
      setFilters(data);
    },
  });

  const toggleActiveFilter = (key: string, option: Option) => {
    toggleFilter(key, option);
  };

  useEffect(() => {
    if (filters.length === 0 && filtersMutation.isIdle) {
      filtersMutation.mutate({});
    }
  });

  const sortByOrder = (objs: Array<any>, filters: any) =>
    objs.sort((a, b) => filters[a].order - filters[b].order);

  const getDateRange = (key: DateFilterKeys) => {
    const from = params.get(`${key}_after`)
      ? new Date(params.get(`${key}_after`) as string)
      : undefined;
    const to = params.has(`${key}_before`)
      ? new Date(params.get(`${key}_before`) as string)
      : undefined;

    return { from, to };
  };

  return (
    <div className="flex items-center justify-start space-x-4">
      <DateSelect
        filterName={intl.formatMessage(columnMessages.columnSentAt)}
        range={getDateRange(DateFilterKeys.SENT_DATE)}
        onSelectRange={(dateRange?: DateRange) => {
          updateDateFilter(
            DateFilterKeys.SENT_DATE,
            dateRange?.from,
            dateRange?.to,
          );
        }}
      />
      <DateSelect
        filterName={intl.formatMessage(columnMessages.columnDueDate)}
        range={getDateRange(DateFilterKeys.DUE_DATE)}
        onSelectRange={(dateRange?: DateRange) => {
          updateDateFilter(
            DateFilterKeys.DUE_DATE,
            dateRange?.from,
            dateRange?.to,
          );
        }}
      />
      {sortByOrder(Object.keys(filters), filters)
        .filter((key) => !forceFilters.includes(key))
        .map((key) => (
          <SearchMultiSelect
            key={`id-${key}`}
            name={translateFilter(key)}
            filterKey={key}
            options={filters[key].results}
            activeOptions={params.has(key) ? params.getAll(key) : []}
            onOptionClick={toggleActiveFilter}
          />
        ))}
    </div>
  );
};
