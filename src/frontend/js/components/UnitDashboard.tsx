import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { Unit } from './Unit';
import { useLocation } from 'react-router-dom';

export const UnitDashboard: React.FC = () => {
  const { status, data } = useFeatureFlag('new_dashboard');
  const location = useLocation();

  return (
    <>
      {status === 'success' && (
        <>
          {data?.is_active ? (
            <DashboardProvider>
              <NewDashboard />
            </DashboardProvider>
          ) : (
            <Unit />
          )}
        </>
      )}
    </>
  );
};
