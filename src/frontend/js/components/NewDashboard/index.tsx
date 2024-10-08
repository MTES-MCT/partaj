import React, { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';

import { ActiveFilters } from './ActiveFilters';
import { DashboardFilters } from './DashboardFilters';
import { messages } from './messages';
import { ReferralStateTabs } from './ReferralStateTabs';
import { ReferralTable } from './ReferralTable';
import { useNewDashboard } from './useNewDashboard';

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
    handleSort,
    handleClick,
    themeOptions,
    requesterOptions,
    requesterUnitOptions,
    userOptions,
    unitOptions,
  } = useNewDashboard();

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
      <ReferralStateTabs
        referralState={referralState}
        handleReferralStateChange={handleReferralStateChange}
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
