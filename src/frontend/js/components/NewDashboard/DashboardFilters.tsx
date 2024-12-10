import React, { useEffect, useState } from 'react';
import { defineMessages } from 'react-intl';
import { useDashboardContext } from './DashboardContext';
import { useFiltersReferralLites } from '../../data/dashboard';
import { Option, SearchMultiSelect } from '../select/SearchMultiSelect';
import { useTranslateFilter } from './utils';

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
});

export const DashboardFilters: React.FC = () => {
  const { params, toggleFilter } = useDashboardContext();
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

  return (
    <div className="flex items-center justify-start space-x-4">
      {sortByOrder(Object.keys(filters), filters).map((key) => (
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
