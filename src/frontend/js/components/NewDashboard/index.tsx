import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters, FilterKeys } from './DashboardFilters';
import { Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { ReferralDetail } from '../ReferralDetail';
import { Crumb } from '../BreadCrumbs';
import { SearchIcon } from '../Icons';
import { useTranslateFilter } from './utils';
import { RemovableItem } from '../generics/RemovableItem';
import { camelCase, snakeCase } from 'lodash-es';
import { UnitTabs } from './UnitTabs';
import { UnitNavSubMenuItems } from '../Navbar/UnitNavMenu';
import { UnitTopicList } from '../UnitTopicList';
import { UnitMemberList } from '../UnitMemberList';
import { useHistory } from 'react-router';

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

export const NewDashboard: React.FC<{
  forceFilters?: Array<string>;
  url: string;
  unitId?: string;
}> = ({ forceFilters = [], url = 'dashboard', unitId }) => {
  const {
    searchText,
    query,
    setQuery,
    activeFilters,
    toggleFilter,
    resetFilters,
  } = useDashboardContext();

  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    setActiveTab(
      (new URLSearchParams(location.search).get(
        'tab',
      ) as UnitNavSubMenuItems) ?? UnitNavSubMenuItems.DASHBOARD,
    );
  }, [location.search]);

  const { path } = useRouteMatch();
  const translateFilter = useTranslateFilter();

  const [activeTab, setActiveTab] = useState<UnitNavSubMenuItems>(() => {
    console.log("new URLSearchParams(location.search).get('tab')");
    console.log(
      new URLSearchParams(location.search).get('tab') ??
        UnitNavSubMenuItems.DASHBOARD,
    );
    return (
      (new URLSearchParams(location.search).get(
        'tab',
      ) as UnitNavSubMenuItems) ?? UnitNavSubMenuItems.DASHBOARD
    );
  });

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
            <div className="w-full flex justify-between">
              <h1 className="text-2xl mb-4">
                <FormattedMessage {...messages.dashboardTitle} />
              </h1>
              <a className="btn btn-secondary text-sm h-fit" href="/export/">
                Exporter les saisines
              </a>
            </div>
            {url === 'unit' && (
              <UnitTabs
                changeTab={(tab: UnitNavSubMenuItems) => {
                  const currentParams = new URLSearchParams(location.search);
                  currentParams.set('tab', tab);

                  history.replace({
                    pathname: location.pathname,
                    search: currentParams.toString(),
                    hash: location.hash,
                  });
                }}
                activeTab={activeTab}
              />
            )}
            {activeTab === UnitNavSubMenuItems.DASHBOARD && (
              <>
                <form
                  className="relative dsfr-search max-w-320 mb-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    searchText(query);
                  }}
                >
                  <input
                    className="px-2 pr-8 w-full"
                    type="search"
                    name={'dashboard-query-input'}
                    placeholder={'Rechercher dans le titre ou le n° de saisine'}
                    aria-label="Rechercher dans le titre ou le n° de saisine"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                    }}
                  />
                  <button
                    type="submit"
                    className="w-fit px-2 btn-primary absolute flex items-center justify-center right-0 top-0 bottom-0 rounded-tr-sm"
                  >
                    <SearchIcon
                      className="fill-white"
                      title="Search in referrals"
                    />
                  </button>
                </form>
                <DashboardFilters forceFilters={forceFilters} />
                <div className="min-h-9 flex flex-col items-start justify-center">
                  {Object.keys(activeFilters).filter(
                    (key) =>
                      ![
                        'query',
                        'sort',
                        'paginate',
                        ...forceFilters.map((forceFilter) =>
                          camelCase(forceFilter),
                        ),
                      ].includes(key),
                  ).length > 0 && (
                    <div className="flex items-center flex-wrap py-1">
                      <span className="uppercase whitespace-nowrap text-s text-primary-700 mr-2 my-2">
                        <FormattedMessage {...messages.activeFilter} />
                      </span>
                      {Object.keys(activeFilters)
                        .filter(
                          (key) =>
                            ![
                              'query',
                              'sort',
                              'paginate',
                              ...forceFilters.map((forceFilter) =>
                                camelCase(forceFilter),
                              ),
                            ].includes(key),
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
                    </div>
                  )}
                  {Object.keys(activeFilters).filter(
                    (key) => !forceFilters.includes(snakeCase(key)),
                  ).length > 0 && (
                    <button
                      className={`button text-s underline button-superfit`}
                      onClick={() => resetFilters()}
                    >
                      <FormattedMessage {...messages.resetFilters} />
                    </button>
                  )}
                </div>
                <div>
                  <ReferralTabs />
                  <ReferralTable
                    forceFilters={forceFilters}
                    url={url}
                    unitId={unitId}
                  />
                </div>
              </>
            )}
            {unitId && (
              <>
                {activeTab === UnitNavSubMenuItems.TOPICS && (
                  <UnitTopicList unit={unitId} />
                )}
                {activeTab === UnitNavSubMenuItems.MEMBERS && (
                  <UnitMemberList unit={unitId} />
                )}
              </>
            )}
          </div>
        </Route>
      </Switch>
    </div>
  );
};
