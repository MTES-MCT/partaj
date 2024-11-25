import React, { createContext, useContext, useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ReferralLiteResultV2, useReferralLitesV2 } from '../../data';
import { ReferralTab } from './ReferralTabs';
import { SortDirection } from './ReferralTable';

const DashboardContext = createContext<
  | {
      results: { [key in ReferralTab]?: ReferralLiteResultV2 };
      params: URLSearchParams;
      activeTab: ReferralTab;
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
    location.hash.length === 0 &&
      history.replace({
        pathname: location.pathname,
        search: params.toString(),
        hash: `#${activeTab}`,
      });
  }, []);

  const getActiveTab: () => ReferralTab = () => {
    console.log('TIEPS');
    console.log(
      location.hash.length > 1
        ? (location.hash.slice(1) as ReferralTab)
        : ('all' as ReferralTab),
    );

    return location.hash.length > 1
      ? (location.hash.slice(1) as ReferralTab)
      : ('all' as ReferralTab);
  };

  const [activeTab, setActiveTab] = useState<ReferralTab>(getActiveTab());

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
          `${activeTab}-${columnName}-${SortDirection.ASC}`,
        );
      } else if (
        currentParams
          .getAll('sort')
          .includes(`${activeTab}-${columnName}-${SortDirection.ASC}`)
      ) {
        console.log('YOPLA');
        const newParams = currentParams
          .getAll('sort')
          .filter(
            (param) =>
              param !== `${activeTab}-${columnName}-${SortDirection.ASC}`,
          );

        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));

        currentParams.append(
          'sort',
          `${activeTab}-${columnName}-${SortDirection.DESC}`,
        );
      } else if (
        currentParams
          .getAll('sort')
          .includes(`${activeTab}-${columnName}-${SortDirection.DESC}`)
      ) {
        console.log('YOPLABOUM');
        const newParams = currentParams
          .getAll('sort')
          .filter(
            (param) =>
              param !== `${activeTab}-${columnName}-${SortDirection.DESC}`,
          );

        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));

        currentParams.append(
          'sort',
          `${activeTab}-${columnName}-${SortDirection.ASC}`,
        );
      } else {
        const newParams = currentParams.getAll('sort').filter((param) => {
          return !(param.split('-')[0] === activeTab);
        });
        currentParams.delete('sort');
        newParams.forEach((newParam) => currentParams.append('sort', newParam));
        currentParams.append(
          'sort',
          `${activeTab}-${columnName}-${SortDirection.ASC}`,
        );
      }

      return new URLSearchParams(currentParams.toString());
    });
  };

  const changeTab = (tabName: ReferralTab) => {
    setActiveTab(tabName);
  };

  const [results, setResults] = useState<
    { [key in ReferralTab]?: ReferralLiteResultV2 }
  >({});

  const { status } = useReferralLitesV2(params, {
    onSuccess: (data) => {
      setResults(data);
    },
  });

  useEffect(() => {
    history.replace({
      pathname: location.pathname,
      search: params.toString(),
      hash: `#${activeTab}`,
    });
  }, [activeTab, params]);

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
