import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { OldDashboard } from './OldDashboard';
import { useTitle } from 'utils/useTitle';

export const Dashboard: React.FC = () => {
  useTitle('dashboard');
  const { status, data } = useFeatureFlag('new_dashboard');

  return (
    <>
      {status === 'success' && (
        <>
          {data?.is_active ? (
            <DashboardProvider>
              <NewDashboard url={'dashboard'} />
            </DashboardProvider>
          ) : (
            <OldDashboard />
          )}
        </>
      )}
    </>
  );
};
