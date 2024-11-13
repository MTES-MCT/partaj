import React, { createContext, useContext, useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router';
import { ReferralLiteResultV2, useReferralLitesV2 } from '../../data';
import { ReferralTab } from './ReferralTabs';

const DashboardContext = createContext<
  | {
      results: { [key in ReferralTab]?: ReferralLiteResultV2 };
      params: URLSearchParams;
      status: string;
      toggleFilter: Function;
      changeTab: Function;
      activeTab: ReferralTab;
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

  const getActiveTab: () => ReferralTab = () => {
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
    history.replace({ pathname: location.pathname, search: params.toString() });
  }, [params]);

  useEffect(() => {
    history.replace({ hash: `#${activeTab}` });
  }, [activeTab]);

  return (
    <DashboardContext.Provider
      value={{ results, status, params, toggleFilter, changeTab, activeTab }}
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
