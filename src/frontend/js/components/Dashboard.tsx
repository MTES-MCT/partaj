import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { OldDashboard } from './OldDashboard';
import { useCurrentUser } from '../data/useCurrentUser';
import { hasMembership } from '../utils/user';
import { Redirect } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { status, data } = useFeatureFlag('new_dashboard');
  const { currentUser } = useCurrentUser();

  return (
    <>
      {currentUser && hasMembership(currentUser) ? (
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
      ) : (
        <Redirect to="/my-dashboard" />
      )}
    </>
  );
};
