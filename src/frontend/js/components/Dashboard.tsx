import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { OldDashboard } from './OldDashboard';

export const Dashboard: React.FC = () => {
  const { data } = useFeatureFlag('new_dashboard');

  return (
    <>
      {data?.is_active ? (
        <DashboardProvider>
          <NewDashboard />
        </DashboardProvider>
      ) : (
        <OldDashboard />
      )}
    </>
  );
};
