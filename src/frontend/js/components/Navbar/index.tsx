import React, { useState, useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { appData } from 'appData';
import { CreateReferralButton } from 'components/CreateReferralButton';
import { DropdownButton, useDropdownMenu } from 'components/DropdownMenu';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { getUserFullname, isAdmin } from 'utils/user';
import { NavbarTitle } from './NavbarTitle';
import { DashboardIcon, DraftIcon, SendIcon } from '../Icons';

const messages = defineMessages({
  accountOptions: {
    defaultMessage: 'Account options',
    description:
      'Accessible message for the icon to open the user dropdown menu.',
    id: 'components.Sidebar.accountOptions',
  },
  backOffice: {
    defaultMessage: 'Back-office',
    description:
      'Navigation item to the back office (shown only to staff users).',
    id: 'components.Sidebar.backOffice',
  },
  dashboard: {
    defaultMessage: 'Dashboard',
    description: 'Navigation item to the dashboard.',
    id: 'components.Sidebar.dashboard',
  },
  requesterDashboard: {
    defaultMessage: 'Referrals Dashboard',
    description: 'Navigation item to the requester dashboard.',
    id: 'components.Sidebar.requesterDashboard',
  },
  documentation: {
    defaultMessage: 'Documentation',
    description: 'Navigation item to the documentation.',
    id: 'components.Sidebar.documentation',
  },
  loadingCurrentUser: {
    defaultMessage: 'Loading current user...',
    description: 'Spinner accessible message while loading the current user.',
    id: 'components.Sidebar.loadingCurrentUser',
  },
  logOut: {
    defaultMessage: 'Log out',
    description: 'Navigation item to enable users to log out.',
    id: 'components.Sidebar.logOut',
  },
  metrics: {
    defaultMessage: 'metrics',
    description: 'Navigation item to the metrics.',
    id: 'components.Sidebar.metrics',
  },
  metricsDaj: {
    defaultMessage: 'Daj Metrics',
    description: "Navigation item to the metrics 's daj page.",
    id: 'components.Sidebar.metricsDaj',
  },
  metricsRequesters: {
    defaultMessage: 'Requeters metrics',
    description: "Navigation item to the metrics 's requesters page.",
    id: 'components.Sidebar.metricsRequesters',
  },
  navTitle: {
    defaultMessage: 'Navigation',
    description: 'Title for the navigation element in the navbar',
    id: 'components.Sidebar.navTitle',
  },
  newReferral: {
    defaultMessage: 'New Referral',
    description: 'Navigation item to the referral creation form.',
    id: 'components.Sidebar.newReferral',
  },
  referralListTitle: {
    defaultMessage: 'My Referrals',
    description: 'Title for the list of referrals the user created.',
    id: 'components.Sidebar.referralListTitle',
  },
  draftReferrals: {
    defaultMessage: 'Draft Referrals',
    description:
      'Navigation item to the list of referrals the user created themselves.',
    id: 'components.Sidebar.draftReferrals',
  },
  sentReferrals: {
    defaultMessage: 'Sent Referrals',
    description:
      'Navigation item to the list of referrals the user created themselves.',
    id: 'components.Sidebar.sentReferrals',
  },
  unitListTitle: {
    defaultMessage: 'My Units',
    description: 'Title for the list of units for the user in the sidebar.',
    id: 'components.Sidebar.unitListTitle',
  },
  database: {
    defaultMessage: 'Knowledge Database',
    description: 'Title for the notix knowledge database in the sidebar.',
    id: 'components.Sidebar.database',
  },
});

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const dropdown = useDropdownMenu();
  const { currentUser } = useCurrentUser();
  const [expandedMetrics, setExpandedMetrics] = useState(false);
  const url = useLocation();

  useEffect(() => {
    if (expandedMetrics)
      setExpandedMetrics(url.pathname.split('/')[1] == 'metrics');
  }, [url]);

  return (
    <nav
      className={`navbar absolute lg:static -left-64 lg:left-0 transform transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="w-full space-y-8 flex-shrink">
        <Link
          className="flex items-center justify-center text-black h-12 hover:text-black hover:no-underline"
          to="/dashboard"
        >
          <img
            src="/static/core/img/logo-marianne.svg"
            className="w-auto h-full mr-3"
          />
          <span className="text-2xl	">partaj</span>
        </Link>

        {currentUser ? (
          <div className="w-full flex p-4 space-x-2 items-center justify-center font-semibold">
            <svg role="img" className="navbar-icon" aria-hidden="true">
              <use xlinkHref={`${appData.assets.icons}#icon-person-outline`} />
            </svg>
            <span className="truncate">{getUserFullname(currentUser)}</span>

            <div {...dropdown.getContainerProps({ className: 'ml-3' })}>
              <button {...dropdown.getButtonProps()}>
                <svg role="img" className="h-3 w-3">
                  <use xlinkHref={`${appData.assets.icons}#icon-caret-down`} />
                  <title>
                    <FormattedMessage {...messages.accountOptions} />
                  </title>
                </svg>
              </button>
              {dropdown.getDropdownContainer(
                <>
                  <DropdownButton
                    className="hover:bg-gray-100 focus:bg-gray-100"
                    onClick={() => location.assign(appData.url_logout)}
                  >
                    <FormattedMessage {...messages.logOut} />
                  </DropdownButton>
                </>,
                { style: { maxWidth: '14rem', right: '-0.75rem' } },
              )}
            </div>
          </div>
        ) : (
          <Spinner size="small">
            <FormattedMessage {...messages.loadingCurrentUser} />
          </Spinner>
        )}

        <div className="navbar-nav">
          {currentUser && currentUser.memberships.length > 0 && (
            <>
              <NavLink
                className="navbar-nav-item space-x-2"
                to="/dashboard"
                aria-current="true"
              >
                <DashboardIcon />
                <span>
                  <FormattedMessage {...messages.dashboard} />
                </span>
              </NavLink>
              {isAdmin(currentUser) && (
                <div className="flex flex-col w-full mt-2">
                  <NavbarTitle>Espace Pilotage</NavbarTitle>
                  <NavLink
                    className="navbar-nav-item"
                    to="/metrics/metrics-daj"
                    aria-current="true"
                  >
                    <svg
                      role="img"
                      className="navbar-icon mr-2"
                      aria-hidden="true"
                    >
                      <use
                        xlinkHref={`${appData.assets.icons}#icon-area-chart`}
                      />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.metricsDaj} />
                    </span>
                  </NavLink>
                  <NavLink
                    className="navbar-nav-item"
                    to="/metrics/metrics-requesters"
                    aria-current="true"
                  >
                    <svg
                      role="img"
                      className="navbar-icon mr-2"
                      aria-hidden="true"
                    >
                      <use
                        xlinkHref={`${appData.assets.icons}#icon-area-chart`}
                      />
                    </svg>
                    <span>
                      <FormattedMessage {...messages.metricsRequesters} />
                    </span>
                  </NavLink>
                </div>
              )}

              <div className="flex flex-col w-full mt-2">
                <NavbarTitle>Espace DAJ</NavbarTitle>
                <>
                  {currentUser.memberships.map((membership) => (
                    <NavLink
                      className="navbar-nav-item space-x-2"
                      key={membership.unit}
                      to={`/unit/${membership.unit}`}
                      aria-current="true"
                    >
                      <svg
                        role="img"
                        className="navbar-icon"
                        aria-hidden="true"
                      >
                        <use
                          xlinkHref={`${appData.assets.icons}#icon-folder`}
                        />
                      </svg>
                      <span>{membership.unit_name}</span>
                    </NavLink>
                  ))}
                </>
              </div>
            </>
          )}
          <div className="flex flex-col w-full mt-2">
            <NavbarTitle>Espace Demande</NavbarTitle>
            <NavLink
              className="navbar-nav-item space-x-2"
              to="/my-dashboard?task=my_unit"
              aria-current="true"
              isActive={(match, location) => {
                if (!match) {
                  return false;
                }
                const task_param = new URLSearchParams(location.search).get(
                  'task',
                );
                return task_param === 'my_unit' || task_param === null;
              }}
            >
              <svg role="img" className="navbar-icon" aria-hidden="true">
                <use xlinkHref={`${appData.assets.icons}#icon-check-circle`} />
              </svg>
              <span>
                <FormattedMessage {...messages.requesterDashboard} />
              </span>
            </NavLink>
            <NavLink
              className="navbar-nav-item space-x-2"
              to="/my-dashboard?task=my_referrals"
              aria-current="true"
              isActive={(match, location) => {
                if (!match) {
                  return false;
                }
                return (
                  new URLSearchParams(location.search).get('task') ===
                  'my_referrals'
                );
              }}
            >
              <SendIcon />
              <span>
                <FormattedMessage {...messages.sentReferrals} />
              </span>
            </NavLink>
            <NavLink
              className="navbar-nav-item space-x-2"
              to="/my-dashboard?task=my_drafts"
              aria-current="true"
              isActive={(match, location) => {
                if (!match) {
                  return false;
                }
                return (
                  new URLSearchParams(location.search).get('task') ===
                  'my_drafts'
                );
              }}
            >
              <DraftIcon />
              <span>
                <FormattedMessage {...messages.draftReferrals} />
              </span>
            </NavLink>
          </div>
          <div className="navbar-footer flex flex-col w-full mt-2">
            <a
              className="navbar-nav-item space-x-2"
              target="_blank"
              href="https://documentation.partaj.beta.gouv.fr"
            >
              <svg role="img" className="navbar-icon" aria-hidden="true">
                <use xlinkHref={`${appData.assets.icons}#icon-read`} />
              </svg>
              <span>
                <FormattedMessage {...messages.documentation} />
              </span>
            </a>
            {currentUser && currentUser.is_staff && (
              <a className="navbar-nav-item space-x-2" href={appData.url_admin}>
                <svg role="img" className="navbar-icon" aria-hidden="true">
                  <use xlinkHref={`${appData.assets.icons}#icon-database`} />
                </svg>
                <span>
                  <FormattedMessage {...messages.backOffice} />
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex-grow w-full flex flex-col flex-shrink-0 justify-end items-center pt-8">
        <CreateReferralButton />
      </div>
    </nav>
  );
};
