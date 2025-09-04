import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { ReferralTable } from './ReferralTable';
import { ReferralTabs } from './ReferralTabs';
import { useDashboardContext } from './DashboardContext';
import { DashboardFilters, FilterKeys } from './DashboardFilters';
import { Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { ReferralDetail } from '../ReferralDetail';
import { Crumb } from '../BreadCrumbs';
import { DownloadIcon, SearchIcon } from '../Icons';
import { useTranslateFilter } from './utils';
import { RemovableItem } from '../generics/RemovableItem';
import { camelCase, result, snakeCase } from 'lodash-es';
import { UnitTabs } from './UnitTabs';
import { UnitNavSubMenuItems } from '../Navbar/UnitNavMenu';
import { UnitTopicList } from '../UnitTopicList';
import { UnitMemberList } from '../UnitMemberList';
import { useHistory } from 'react-router';
import { appData } from 'appData';
import { saveAs } from 'file-saver';
import { Pagination } from './Pagination';

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
  export: {
    defaultMessage: 'Export referrals',
    description: 'Export referrals to CSV format',
    id: 'components.NewDashboard.export',
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
    activeTab: currentTab,
    params,
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
    return (
      (new URLSearchParams(location.search).get(
        'tab',
      ) as UnitNavSubMenuItems) ?? UnitNavSubMenuItems.DASHBOARD
    );
  });

  const exportDashboard = async () => {
    if (unitId) {
      params.set('unit_id', unitId);
    }

    const queryParams = params.toString();
    const queryString = !!queryParams ? `?${queryParams}` : '';

    const response = await fetch(
      `/api/referrallites/export/${url}/${currentTab.name}${queryString}`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'text/csv',
        },
        method: 'GET',
      },
    );
    if (response.status === 200) {
      saveAs(await response.blob(), 'export.csv');
    }
  };

  return (
    <Switch>
      <Route path={`${path}/referral-detail/:referralId`}>
        <ReferralDetail />
        <Crumb
          key="dashboard-referral-detail"
          title={<FormattedMessage {...messages.crumbReferral} />}
        />
      </Route>
      <Route path={path}>
        <div className="px-4 py-2 w-fit max-w-full">
          <div className="w-full flex justify-between">
            <h1 className="text-2xl mb-4">
              <FormattedMessage {...messages.dashboardTitle} />
            </h1>
            <button
              className="navbar-nav-external space-x-1 text-primary-700 before:content-[' '] before:bg-primary-700 h-6 mt-1"
              onClick={exportDashboard}
            >
              <span>
                <FormattedMessage {...messages.export} />
              </span>
              <DownloadIcon className="fill-primary700 mt-0.5 ml-2" />
            </button>
          </div>
          <div className="font-marianne w-fit">
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
                <Pagination />
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
        </div>
      </Route>
    </Switch>
  );
};
