import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters, FilterKeys } from './DashboardFilters';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { ReferralDetail } from '../ReferralDetail';
import { Crumb } from '../BreadCrumbs';
import { SearchIcon } from '../Icons';
import { useTranslateFilter } from './utils';
import { RemovableItem } from '../generics/RemovableItem';
import { snakeCase } from 'lodash-es';

export const messages = defineMessages({
  dashboardTitle: {
    id: 'newDashboard.title',
    defaultMessage: 'OldDashboard',
    description: 'OldDashboard title',
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
  crumbReferral: {
    defaultMessage: 'Referral',
    description: 'Title for the breadcrumb for the referral detail view.',
    id: 'components.OldDashboard.crumbReferral',
  },
  activeFilter: {
    defaultMessage: 'Active filters:',
    description: 'Active filter text',
    id: 'components.NewDashboard.activeFilters',
  },
  resetFilters: {
    defaultMessage: 'Reset filters:',
    description: 'Reset filter button text',
    id: 'components.NewDashboard.resetFilters',
  },
});

export const NewDashboard: React.FC = () => {
  const {
    status,
    searchText,
    params,
    activeFilters,
    toggleFilter,
    resetFilters,
  } = useDashboardContext();
  const { path } = useRouteMatch();
  const translateFilter = useTranslateFilter();
  const [query, setQuery] = useState<string>(params.get('query') ?? '');

  return (
    <div className="px-4 py-2">
      <Switch>
        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
          <Crumb
            key="dashboard-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>
        <Route path={path}>
          <div className="font-marianne">
            <h1 className="text-2xl font-bold mb-4">
              <FormattedMessage {...messages.dashboardTitle} />
            </h1>
            <div className="relative dsfr-search max-w-72 mb-4">
              <input
                className="px-2 pr-8 w-full"
                type="search"
                name={'dashboard-query-input'}
                placeholder={'Rechercher dans le tableau de saisines'}
                aria-label="Rechercher dans le tableau de saisines"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
              />
              <button
                type="submit"
                className="w-fit px-2 btn-primary absolute flex items-center justify-center right-0 top-0 bottom-0 rounded-tr-sm"
                onClick={() => searchText(query)}
              >
                <SearchIcon
                  className="fill-white"
                  title="Search in referrals"
                />
              </button>
            </div>

            <DashboardFilters />
            <div className="min-h-9">
              {Object.keys(activeFilters).filter(
                (key) => !['query', 'sort', 'paginate'].includes(key),
              ).length > 0 && (
                <div className="flex w-full items-center flex-wrap py-1">
                  <span className="uppercase text-s text-primary-700 mr-2 my-2">
                    <FormattedMessage {...messages.activeFilter} />
                  </span>
                  {Object.keys(activeFilters)
                    .filter(
                      (key) => !['query', 'sort', 'paginate'].includes(key),
                    )
                    .map((key: string) => (
                      <>
                        {activeFilters[key as FilterKeys]!.map(
                          (filterName: string) => (
                            <div
                              className="my-2"
                              key={`${key}-${snakeCase(filterName)}`}
                            >
                              <RemovableItem
                                iconTitle={'Supprimer le filtre'}
                                iconClassName="w-5 h-5"
                                removeItem={() =>
                                  toggleFilter(snakeCase(key), {
                                    id: filterName,
                                  })
                                }
                              >
                                {translateFilter(key)}: {filterName}
                              </RemovableItem>
                            </div>
                          ),
                        )}
                      </>
                    ))}
                  <button
                    className={`button text-s underline button-superfit`}
                    onClick={() => resetFilters()}
                  >
                    <FormattedMessage {...messages.resetFilters} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <ReferralTabs />
              {status === 'loading' && (
                <FormattedMessage {...messages.loading} />
              )}
              {status === 'error' && (
                <FormattedMessage
                  {...messages.error}
                  values={{ error: 'TIEPS' }}
                />
              )}
              {status === 'success' && <ReferralTable />}
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
};
