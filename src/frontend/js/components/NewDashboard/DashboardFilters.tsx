import React, { useEffect, useState } from 'react';
import { defineMessages } from 'react-intl';
import { useDashboardContext } from './DashboardContext';
import { useFiltersReferralLites } from '../../data/dashboard';
import { Option, SearchMultiSelect } from '../select/SearchMultiSelect';
import { useTranslateFilter } from './utils';
import { DateSelect } from '../select/DateSelect';
import { DateRange } from 'react-day-picker';

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

export enum FilterKeys {
  TOPICS = 'topics',
  ASSIGNEES = 'assignees',
  CONTRIBUTORS_UNIT_NAMES = 'contributorsUnitNames',
  REQUESTERS = 'requesters',
  REQUESTERS_UNIT_NAMES = 'requestersUnitNames',
}

export enum DateFilterKeys {
  DUE_DATE_AFTER = 'due_date_after',
  DUE_DATE_BEFORE = 'due_date_before',
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
});

export const DashboardFilters: React.FC<{ forceFilters: Array<string> }> = ({
  forceFilters,
}) => {
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

  const getDateRange = () => {
    const from = params.get(DateFilterKeys.DUE_DATE_AFTER)
      ? new Date(params.get(DateFilterKeys.DUE_DATE_AFTER) as string)
      : undefined;
    const to = params.has(DateFilterKeys.DUE_DATE_BEFORE)
      ? new Date(params.get(DateFilterKeys.DUE_DATE_BEFORE) as string)
      : undefined;

    return { from, to };
  };

  return (
    <div className="flex items-center justify-start space-x-4">
      <DateSelect
        filterName={'Échéance'}
        range={getDateRange()}
        onSelectRange={(dateRange?: DateRange) => {
          updateDateFilter(dateRange?.from, dateRange?.to);
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
