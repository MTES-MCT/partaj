import React, { ChangeEvent, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router';

import { useFeatureFlag } from 'data';
import { ActiveFilters } from './ActiveFilters';
import { DashboardFilters } from './DashboardFilters';
import { ReferralTable } from './ReferralTable';
import { useNewDashboard } from './useNewDashboard';
import { ReferralTabs } from './ReferralTabs';

export const messages = defineMessages({
  dashboardTitle: {
    id: 'newDashboard.title',
    defaultMessage: 'Dashboard',
    description: 'Dashboard title',
  },
  loading: {
    id: 'newDashboard.loading',
    defaultMessage: 'Loading...',
    description: 'Loading message',
  },
  error: {
    id: 'newDashboard.error',
    defaultMessage: 'Error: {error}',
    description: 'Error message',
  },
});

export const NewDashboard: React.FC = () => {
  const [isFeatureFlagActive, setFeatureFlagActive] = useState<boolean>(false);

  const {
    themeId,
    requesterId,
    requesterUnitId,
    search,
    userId,
    unitId,
    dateRange,
    referralTab,
    sortColumn,
    sortDirection,
    isLoading,
    error,
    referrals,
    setThemeId,
    setRequesterId,
    setRequesterUnitId,
    performSearch,
    setUserId,
    setUnitId,
    updateDateRange,
    setReferralTab,
    sortReferrals,
    navigateToReferralDetail,
    themeOptions,
    requesterOptions,
    requesterUnitOptions,
    userOptions,
    unitOptions,
  } = useNewDashboard();

  const { status } = useFeatureFlag('new_dashboard', {
    onSuccess: (data) => {
      setFeatureFlagActive(data.is_active);
    },
  });

  if (status === 'loading') {
    return <div />;
  } else if (status === 'error' || !isFeatureFlagActive) {
    return <Redirect to={`/dashboard`} />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        <FormattedMessage {...messages.dashboardTitle} />
      </h1>
      <DashboardFilters
        themeId={themeId}
        requesterId={requesterId}
        requesterUnitId={requesterUnitId}
        search={search}
        userId={userId}
        unitId={unitId}
        dateRange={dateRange}
        handleSelectTheme={setThemeId}
        handleSelectRequester={setRequesterId}
        handleSelectRequesterUnit={setRequesterUnitId}
        handleSearch={performSearch}
        handleSelectUser={setUserId}
        handleSelectUnit={setUnitId}
        handleDateRangeChange={updateDateRange}
        themeOptions={themeOptions}
        requesterOptions={requesterOptions}
        requesterUnitOptions={requesterUnitOptions}
        userOptions={userOptions}
        unitOptions={unitOptions}
      />
      <ActiveFilters
        themeId={themeId}
        requesterId={requesterId}
        requesterUnitId={requesterUnitId}
        search={search}
        userId={userId}
        unitId={unitId}
        dateRange={dateRange}
        themeOptions={themeOptions}
        requesterOptions={requesterOptions}
        requesterUnitOptions={requesterUnitOptions}
        userOptions={userOptions}
        unitOptions={unitOptions}
        handleClearTheme={() => setThemeId('')}
        handleClearRequester={() => setRequesterId('')}
        handleClearRequesterUnit={() => setRequesterUnitId('')}
        handleClearSearch={() =>
          performSearch({ target: { value: '' } } as ChangeEvent<
            HTMLInputElement
          >)
        }
        handleClearUser={() => setUserId('')}
        handleClearUnit={() => setUnitId('')}
        handleClearDateFilter={() => updateDateRange(undefined)}
      />
      <ReferralTabs
        referralTab={referralTab}
        handleReferralTabChange={setReferralTab}
      />
      {isLoading || error ? (
        <div>
          {isLoading ? (
            <FormattedMessage {...messages.loading} />
          ) : (
            <FormattedMessage
              {...messages.error}
              values={{ error: (error as Error).message }}
            />
          )}
        </div>
      ) : (
        <ReferralTable
          referrals={referrals}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={sortReferrals}
          handleClick={navigateToReferralDetail}
        />
      )}
    </div>
  );
};
