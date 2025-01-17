import React from 'react';
import { useFeatureFlag } from '../data';
import { DashboardProvider } from './NewDashboard/DashboardContext';
import { NewDashboard } from './NewDashboard';
import { Unit } from './Unit';
import { useParams } from 'react-router-dom';

export const UnitDashboard: React.FC = () => {
  const { status, data } = useFeatureFlag('new_dashboard');
  const { unitId } = useParams<{ unitId: string }>();

  return (
    <>
      {status === 'success' && (
        <>
          {data?.is_active ? (
            <DashboardProvider forceFilters={['contributors_unit_names']}>
              <NewDashboard
                forceFilters={['contributors_unit_names']}
                url={'unit'}
                unitId={unitId}
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
