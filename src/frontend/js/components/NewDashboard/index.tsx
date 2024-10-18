import React, { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';

import { ActiveFilters } from './ActiveFilters';
import { DashboardFilters } from './DashboardFilters';
import { messages } from './messages';
import { ReferralStateTabs } from './ReferralStateTabs';
import { ReferralTable } from './ReferralTable';
import { useNewDashboard } from './useNewDashboard';
import { ReferralTab, ReferralTabs } from './ReferralTabs';
import { useFeatureFlag } from 'data';

export const NewDashboard: React.FC = () => {
  const {
    themeId,
    requesterId,
    requesterUnitId,
    search,
    userId,
    unitId,
    dateRange,
    referralState,
    referralTab,
    sortColumn,
    sortDirection,
    isLoading,
    error,
    referrals,
    handleSelectTheme,
    handleSelectRequester,
    handleSelectRequesterUnit,
    handleSearch,
    handleSelectUser,
    handleSelectUnit,
    handleDateRangeChange,
    handleReferralStateChange,
    handleReferralTabChange,
    handleSort,
    handleClick,
    themeOptions,
    requesterOptions,
    requesterUnitOptions,
    userOptions,
    unitOptions,
  } = useNewDashboard();

  // TODO
  const { status: newDashboardStatus } = useFeatureFlag('new_dashboard', {
    onSuccess: (data) => {
      //setNewDashboardActive(data.is_active);
    },
  });

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
        handleSelectTheme={handleSelectTheme}
        handleSelectRequester={handleSelectRequester}
        handleSelectRequesterUnit={handleSelectRequesterUnit}
        handleSearch={handleSearch}
        handleSelectUser={handleSelectUser}
        handleSelectUnit={handleSelectUnit}
        handleDateRangeChange={handleDateRangeChange}
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
        handleClearTheme={() => handleSelectTheme('')}
        handleClearRequester={() => handleSelectRequester('')}
        handleClearRequesterUnit={() => handleSelectRequesterUnit('')}
        handleClearSearch={() =>
          handleSearch({ target: { value: '' } } as ChangeEvent<
            HTMLInputElement
          >)
        }
        handleClearUser={() => handleSelectUser('')}
        handleClearUnit={() => handleSelectUnit('')}
        handleClearDateFilter={() => handleDateRangeChange(undefined)}
      />
      <ReferralTabs
        referralTab={referralTab}
        handleReferralTabChange={handleReferralTabChange}
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
          handleSort={handleSort}
          handleClick={handleClick}
        />
      )}
    </div>
  );
};
