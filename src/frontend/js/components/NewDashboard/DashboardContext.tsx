import React, { createContext, useContext, useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ReferralLiteResultV2, useReferralLitesV2 } from '../../data';
import { ReferralTab } from './ReferralTabs';
import { SortDirection } from './ReferralTable';

const DashboardContext = createContext<
  | {
      results: { [key in ReferralTab]?: ReferralLiteResultV2 };
      params: URLSearchParams;
      activeTab: { name: ReferralTab };
      status: string;
      toggleFilter: Function;
      changeTab: Function;
      sortBy: Function;
    }
  | undefined
>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const history = useHistory();
  const location = useLocation();

  const [params, setParams] = useState<URLSearchParams>(
    new URLSearchParams(location.search),
  );

  useEffect(() => {
    console.log('TIEPS 123');

    if (location.hash.length === 0) {
      console.log('TIEPS 123656556');
      setActiveTab({ name: ReferralTab.All });
      setParams(new URLSearchParams());
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

  useEffect(() => {
    console.log('TIEPS 55555');
    history.replace({
      pathname: location.pathname,
      search: params.toString(),
      hash: `#${activeTab.name}`,
    });
  }, [activeTab, params]);

  const toggleFilter = (key: string, value: string) => {
    if (params.has(key)) {
      if (!params.getAll(key).includes(value)) {
        params.append(key, value);
      } else {
        const currentParams = params.getAll(key);
        params.delete(key);
        const newParams = currentParams.filter((param) => param !== value);
        newParams.forEach((newParam) => params.append(key, newParam));
      }
    } else {
      params.set(key, value);
    }

    setParams(new URLSearchParams(params.toString()));
  };

  const sortBy = (columnName: string) => {
    setParams((currentParams: URLSearchParams) => {
      if (!currentParams.has('sort')) {
        console.log('YOP');
        currentParams.set(
          'sort',
          `${activeTab.name}-${columnName}-${SortDirection.ASC}`,
        );
      } else if (
        currentParams
          .getAll('sort')
          .includes(`${activeTab.name}-${columnName}-${SortDirection.ASC}`)
      ) {
        console.log('YOPLA');
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
        console.log('YOPLABOUM');
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
