import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { Unit } from './Unit';

export const UnitDashboard: React.FC = () => {
  const { status, data } = useFeatureFlag('new_dashboard');

  return (
    <>
      {status === 'success' && (
        <>
          {data?.is_active ? (
            <DashboardProvider forceFilters={['contributors_unit_names']}>
              <NewDashboard
                forceFilters={['contributors_unit_names']}
                url={'unit_dashboard'}
              />
            </DashboardProvider>
          ) : (
            <Unit />
          )}
        </>
      )}
    </>
  );
};
