import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters, FilterKeys } from './DashboardFilters';
import { Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { ReferralDetail } from '../ReferralDetail';
import { Crumb } from '../BreadCrumbs';
import { DashboardIndex } from '../DashboardIndex';
import { SearchIcon } from '../Icons';
import { commonMessages } from '../../const/translations';
import { Option } from '../select/SearchMultiSelect';
import { NoteFilters } from '../Notes/NoteListView';
import { useTranslateFilter } from './utils';
import { RemovableItem } from '../generics/RemovableItem';
import { snakeCase } from 'lodash-es';
import { IconTextButton } from '../buttons/IconTextButton';
import { SelectOption } from '../select/SelectableList';

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
});

export const NewDashboard: React.FC = () => {
  const {
    status,
    searchText,
    params,
    activeFilters,
    toggleFilter,
  } = useDashboardContext();
  const { path } = useRouteMatch();
  const translateFilter = useTranslateFilter();
  const [query, setQuery] = useState<string>(params.get('query') ?? '');

  return (
    <div className="p-4">
      <Switch>
        <Route path={`${path}/referral-detail/:referralId`}>
          <ReferralDetail />
          <Crumb
            key="dashboard-referral-detail"
            title={<FormattedMessage {...messages.crumbReferral} />}
          />
        </Route>
        <Route path={path}>
          <div className="font-marianne space-y-6">
            <h1 className="text-2xl font-bold mb-4">
              <FormattedMessage {...messages.dashboardTitle} />
            </h1>
            <div className="relative dsfr-search max-w-72">
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

            <div className="space-y-6">
              <DashboardFilters />
              {Object.keys(activeFilters).filter(
                (key) => !['query', 'sort', 'paginate'].includes(key),
              ).length > 0 && (
                <div className="flex w-full space-x-2 space-y-2 items-center flex-wrap">
                  <span className="uppercase ml-2 mt-2 text-sm text-primary-700">
                    {' '}
                    Filtres actifs :{' '}
                  </span>
                  {Object.keys(activeFilters)
                    .filter(
                      (key) => !['query', 'sort', 'paginate'].includes(key),
                    )
                    .map((key: string) => (
                      <>
                        {activeFilters[key as FilterKeys]!.map(
                          (filterName: string) => (
                            <RemovableItem
                              iconTitle={'Supprimer le filtre'}
                              iconClassName="w-5 h-5"
                              removeItem={() =>
                                toggleFilter(snakeCase(key), { id: filterName })
                              }
                            >
                              <span>
                                {translateFilter(key)}: {filterName}
                              </span>
                            </RemovableItem>
                          ),
                        )}
                      </>
                    ))}
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
