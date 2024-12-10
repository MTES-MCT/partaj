import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { OldDashboard } from './OldDashboard';

export const Dashboard: React.FC = () => {
  const { status, data } = useFeatureFlag('new_dashboard');

  return (
    <>
      {status === 'success' && (
        <>
          {data?.is_active ? (
            <DashboardProvider>
              <NewDashboard />
            </DashboardProvider>
          ) : (
            <OldDashboard />
          )}
        </>
      )}
    </>
  );
};
