import React, { createContext, useContext, useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ReferralLiteResultV2, useReferralLitesV2 } from '../../data';
import { ReferralTab } from './ReferralTabs';
import { SortDirection } from './ReferralTable';
import { Option } from '../select/SearchMultiSelect';
import { camelCase, snakeCase } from 'lodash-es';
import { FilterKeys } from './DashboardFilters';

const DashboardContext = createContext<
  | {
      results: { [key in ReferralTab]?: ReferralLiteResultV2 };
      params: URLSearchParams;
      activeTab: { name: ReferralTab };
      status: string;
      toggleFilter: Function;
      changeTab: Function;
      sortBy: Function;
      searchText: Function;
      query: string;
      setQuery: Function;
      resetFilters: Function;
      activeFilters: { [key in FilterKeys]?: Array<string> };
    }
  | undefined
>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const history = useHistory();
  const location = useLocation();

  const toActiveFilter = (params: URLSearchParams) => {
    const activeFilter: { [key: string]: Array<string> } = {};

    params.forEach((value, key) => {
      if (!activeFilter.hasOwnProperty(camelCase(key))) {
        activeFilter[camelCase(key)] = [value];
      } else {
        activeFilter[camelCase(key)].push(value);
      }
    });

    return activeFilter;
  };

  const [params, setParams] = useState<URLSearchParams>(
    new URLSearchParams(location.search),
  );

  const [activeFilters, setActiveFilters] = useState<{}>({});

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      if (location.hash.length === 0) {
        setActiveTab({ name: ReferralTab.All });
        setParams(new URLSearchParams());
      }
    }
  });

  const getActiveTab: () => { name: ReferralTab } = () => {
    return location.hash.length > 1
      ? ({ name: location.hash.slice(1) } as { name: ReferralTab })
      : ({ name: 'all' } as { name: ReferralTab });
  };

  const [activeTab, setActiveTab] = useState<{ name: ReferralTab }>(
    getActiveTab(),
  );

  const [query, setQuery] = useState<string>(params.get('query') ?? '');

  useEffect(() => {
    history.replace({
      pathname: location.pathname,
      search: params.toString(),
      hash: `#${activeTab.name}`,
    });

    setActiveFilters(toActiveFilter(params));
  }, [activeTab, params]);

  const toggleFilter = (key: string, option: Option) => {
    if (params.has(key)) {
      if (!params.getAll(key).includes(option.id)) {
        params.append(key, option.id);
      } else {
        const currentParams = params.getAll(key);
        params.delete(key);
        const newParams = currentParams.filter((param) => param !== option.id);
        newParams.forEach((newParam) => params.append(key, newParam));
      }
    } else {
      params.set(key, option.id);
    }

    setParams(new URLSearchParams(params.toString()));
  };

  const resetFilters = () => {
    setParams(new URLSearchParams());
    setQuery('');
  };

  const sortBy = (columnName: string) => {
    setParams((currentParams: URLSearchParams) => {
      if (!currentParams.has('sort')) {
        currentParams.set(
          'sort',
          `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
        );
      } else if (
        currentParams
          .getAll('sort')
          .includes(`${activeTab.name}-${columnName}-${SortDirection.ASC}`)
      ) {
        const newParams = currentParams
          .getAll('sort')
          .filter(
            (param) =>
              param !== `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
          );

        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));

        currentParams.append(
          'sort',
          `${activeTab.name}-${columnName}-${SortDirection.DESC}`,
        );
      } else if (
        currentParams
          .getAll('sort')
          .includes(`${activeTab.name}-${columnName}-${SortDirection.DESC}`)
      ) {
        const newParams = currentParams
          .getAll('sort')
          .filter(
            (param) =>
              param !== `${activeTab.name}-${columnName}-${SortDirection.DESC}`,
          );

        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));

        currentParams.append(
          'sort',
          `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
        );
      } else {
        const newParams = currentParams.getAll('sort').filter((param) => {
          return !(param.split('-')[0] === activeTab.name);
        });
        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));
        currentParams.append(
          'sort',
          `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
        );
      }

      return new URLSearchParams(currentParams.toString());
    });
  };

  const changeTab = (tabName: ReferralTab) => {
    setActiveTab({ name: tabName });
  };

  const searchText = (query: string) => {
    params.set('query', query);
    setParams(new URLSearchParams(params.toString()));
  };

  const [results, setResults] = useState<
    { [key in ReferralTab]?: ReferralLiteResultV2 }
  >({});

  const { status } = useReferralLitesV2(params, {
    onSuccess: (data) => {
      setResults(data);
    },
  });

  return (
    <DashboardContext.Provider
      value={{
        results,
        status,
        params,
        toggleFilter,
        changeTab,
        activeTab,
        sortBy,
        query,
        setQuery,
        searchText,
        activeFilters,
        resetFilters,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      'useDashboardContext must be used within a DashboardProvider',
    );
  }
  return context;
};
