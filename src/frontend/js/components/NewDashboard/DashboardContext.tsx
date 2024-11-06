import React, { createContext, useContext, useEffect, useState } from 'react';

import { ReferralLite } from 'types';
import { useHistory, useLocation } from 'react-router';
import { useReferralLites } from '../../data';

const DashboardContext = createContext<
  | {
      referrals: Array<ReferralLite>;
      params: URLSearchParams;
      status: string;
      toggleFilter: Function;
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

  const [referrals, setReferrals] = useState<Array<ReferralLite>>([]);

  const { status } = useReferralLites(Object.fromEntries(params), {
    onSuccess: (data) => {
      setReferrals(data.results);
    },
  });

  useEffect(() => {
    history.replace({ pathname: location.pathname, search: params.toString() });
  }, [params]);

  return (
    <DashboardContext.Provider
      value={{ referrals, status, params, toggleFilter }}
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
