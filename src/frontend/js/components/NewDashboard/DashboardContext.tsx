import React, { createContext, useContext, useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ReferralLiteResultV2 } from '../../data';
import { ReferralTab } from './ReferralTabs';
import { SortDirection } from './ReferralTable';
import { Option } from '../select/SearchMultiSelect';
import { camelCase } from 'lodash-es';
import { FilterKeys } from './DashboardFilters';

const DashboardContext = createContext<
  | {
      results: { [key in ReferralTab]?: ReferralLiteResultV2 };
      params: URLSearchParams;
      activeTab: { name: ReferralTab };
      setResults: Function;
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

export const DashboardProvider: React.FC<{}> = ({ children }) => {
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

  const getActiveTab: () => { name: ReferralTab } = () => {
    return location.hash.length > 1
      ? ({ name: location.hash.slice(1) } as { name: ReferralTab })
      : ({ name: 'all' } as { name: ReferralTab });
  };

  const [params, setParams] = useState<URLSearchParams>(
    new URLSearchParams(location.search),
  );
  const [activeFilters, setActiveFilters] = useState<{}>(
    toActiveFilter(new URLSearchParams(location.search)),
  );
  const [activeTab, setActiveTab] = useState<{ name: ReferralTab }>(
    getActiveTab(),
  );
  const [query, setQuery] = useState<string>(
    new URLSearchParams(location.search).get('query') || '',
  );

  useEffect(() => {
    setActiveFilters(toActiveFilter(new URLSearchParams(location.search)));
    setActiveTab(getActiveTab());
    setParams(new URLSearchParams(location.search));
    setQuery(new URLSearchParams(location.search).get('query') || '');
  }, [location.search, location.hash]);

  const toggleFilter = (key: string, option: Option) => {
    const temporaryParams = new URLSearchParams(location.search);

    if (temporaryParams.has(key)) {
      if (!temporaryParams.getAll(key).includes(option.id)) {
        temporaryParams.append(key, option.id);
      } else {
        const currentParams = temporaryParams.getAll(key);
        temporaryParams.delete(key);
        const newParams = currentParams.filter((param) => param !== option.id);
        newParams.forEach((newParam) => temporaryParams.append(key, newParam));
      }
    } else {
      temporaryParams.set(key, option.id);
    }

    history.replace({
      pathname: location.pathname,
      search: temporaryParams.toString(),
      hash: `#${activeTab.name}`,
    });
  };

  const resetFilters = () => {
    history.replace({
      pathname: location.pathname,
      search: new URLSearchParams().toString(),
      hash: `#${activeTab.name}`,
    });
  };

  const sortBy = (columnName: string) => {
    const temporaryParams = new URLSearchParams(params.toString());

    if (!temporaryParams.has('sort')) {
      temporaryParams.set(
        'sort',
        `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
      );
    } else if (
      temporaryParams
        .getAll('sort')
        .includes(`${activeTab.name}-${columnName}-${SortDirection.ASC}`)
    ) {
      const newParams = temporaryParams
        .getAll('sort')
        .filter(
          (param) =>
            param !== `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
        );

      temporaryParams.delete('sort');
      newParams.forEach((newParam) => temporaryParams.append('sort', newParam));

      temporaryParams.append(
        'sort',
        `${activeTab.name}-${columnName}-${SortDirection.DESC}`,
      );
    } else if (
      temporaryParams
        .getAll('sort')
        .includes(`${activeTab.name}-${columnName}-${SortDirection.DESC}`)
    ) {
      const newParams = temporaryParams
        .getAll('sort')
        .filter(
          (param) =>
            param !== `${activeTab.name}-${columnName}-${SortDirection.DESC}`,
        );

      temporaryParams.delete('sort');
      newParams.forEach((newParam) => temporaryParams.append('sort', newParam));

      temporaryParams.append(
        'sort',
        `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
      );
    } else {
      const newParams = temporaryParams.getAll('sort').filter((param) => {
        return !(param.split('-')[0] === activeTab.name);
      });
      temporaryParams.delete('sort');
      newParams.forEach((newParam) => temporaryParams.append('sort', newParam));
      temporaryParams.append(
        'sort',
        `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
      );
    }

    history.replace({
      pathname: location.pathname,
      search: temporaryParams.toString(),
      hash: `#${activeTab.name}`,
    });
  };

  const changeTab = (tabName: ReferralTab) => {
    history.replace({
      pathname: location.pathname,
      search: new URLSearchParams(params).toString(),
      hash: `#${tabName}`,
    });
  };

  const searchText = (query: string) => {
    const temporaryParams = new URLSearchParams(params.toString());
    temporaryParams.set('query', query);

    history.replace({
      pathname: location.pathname,
      search: temporaryParams.toString(),
      hash: `#${activeTab.name}`,
    });
  };

  const [results, setResults] = useState<
    { [key in ReferralTab]?: ReferralLiteResultV2 }
  >({});

  return (
    <DashboardContext.Provider
      value={{
        results,
        setResults,
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
