import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ActiveFilters } from './ActiveFilters';
import { DashboardFilters } from './DashboardFilters';
import { messages } from './messages';
import { ReferralStateTabs } from './ReferralStateTabs';
import { ReferralTable } from './ReferralTable';
import { useNewDashboard } from './useNewDashboard';

export const NewDashboard: React.FC = () => {
  const {
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
    handleSearch,
    handleSelectUser,
    handleSelectUnit,
    handleDateRangeChange,
    handleReferralStateChange,
    handleSort,
    handleClick,
    userOptions,
    unitOptions,
  } = useNewDashboard();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        <FormattedMessage {...messages.dashboardTitle} />
      </h1>
      <DashboardFilters
        search={search}
        userId={userId}
        unitId={unitId}
        dateRange={dateRange}
        handleSearch={handleSearch}
        handleSelectUser={handleSelectUser}
        handleSelectUnit={handleSelectUnit}
        handleDateRangeChange={handleDateRangeChange}
        userOptions={userOptions}
        unitOptions={unitOptions}
      />
      <ActiveFilters
        search={search}
        userId={userId}
        unitId={unitId}
        dateRange={dateRange}
        userOptions={userOptions}
        unitOptions={unitOptions}
        handleClearSearch={() =>
          handleSearch({ target: { value: '' } } as React.ChangeEvent<
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
