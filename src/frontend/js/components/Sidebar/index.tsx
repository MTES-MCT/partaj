import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, NavLink, useRouteMatch } from 'react-router-dom';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { getUserFullname } from 'utils/user';
import { DropdownButton, useDropdownMenu } from 'components/DropdownMenu';

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
    id: 'components.Root.backOffice',
  },
  dashboard: {
    defaultMessage: 'Dashboard',
    description: 'Navigation item to the dashboard.',
    id: 'components.Root.dashboard',
  },
  loadingCurrentUser: {
    defaultMessage: 'Loading current user...',
    description: 'Spinner accessible message while loading the current user.',
    id: 'components.Root.loadingCurrentUser',
  },
  logOut: {
    defaultMessage: 'Log out',
    description: 'Navigation item to enable users to log out.',
    id: 'components.Root.logOut',
  },
  navTitle: {
    defaultMessage: 'Navigation',
    description: 'Title for the navigation element in the navbar',
    id: 'components.Root.navTitle',
  },
  newReferral: {
    defaultMessage: 'New Referral',
    description: 'Navigation item to the referral creation form.',
    id: 'components.Root.newReferral',
  },
  sentReferrals: {
    defaultMessage: 'Sent Referrals',
    description:
      'Navigation item to the list of referrals the user created themselves.',
    id: 'components.Root.sentReferrals',
  },
  unitListTitle: {
    defaultMessage: 'My Units',
    description: 'Title for the list of units for the user in the sidebar.',
    id: 'components.Root.unitListTitle',
  },
});

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { path } = useRouteMatch();
  const { currentUser } = useCurrentUser();

  const dropdown = useDropdownMenu();

  // We have to compute whether the "Dashboard" nav link is active manually as it is
  // the default view (without additional url parts)
  const isOpenDashboardItself = useRouteMatch({ path, exact: true });
  const isOpenDashboardReferral = useRouteMatch({
    path: `${path}referral-detail/:referralId`,
    exact: true,
  });
  const isActiveDashboard = isOpenDashboardItself || isOpenDashboardReferral;

  return (
    <nav
      className={`navbar absolute lg:static -left-64 lg:left-0 transform transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <div className="w-full space-y-8 flex-shrink overflow-auto">
        <Link
          className="flex items-center justify-center text-black h-12 hover:text-black hover:no-underline"
          to="/"
        >
          <img
            src="/static/core/img/logo-marianne.svg"
            className="w-auto h-full mr-3"
          />
          <span className="text-2xl	">partaj</span>
        </Link>

        {currentUser ? (
          <div className="w-full flex p-4 space-x-2 items-center font-semibold">
            <svg role="img" className="navbar-icon" aria-hidden="true">
              <use xlinkHref={`${appData.assets.icons}#icon-person-outline`} />
            </svg>
            <span className="truncate">{getUserFullname(currentUser)}</span>

            <div {...dropdown.getContainerProps()}>
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
                { style: { right: '-6rem' } },
              )}
            </div>
          </div>
        ) : (
          <Spinner size="small">
            <FormattedMessage {...messages.loadingCurrentUser} />
          </Spinner>
        )}

        <div className="navbar-nav">
          <div className="navbar-nav-title">
            <FormattedMessage {...messages.navTitle} />
          </div>
          {currentUser && currentUser.memberships.length > 0 ? (
            <Link
              className={`navbar-nav-item space-x-2 ${
                isActiveDashboard ? 'active' : ''
              }`}
              to="/"
            >
              <svg role="img" className="navbar-icon" aria-hidden="true">
                <use xlinkHref={`${appData.assets.icons}#icon-check-circle`} />
              </svg>
              <span>
                <FormattedMessage {...messages.dashboard} />
              </span>
            </Link>
          ) : null}
          <NavLink className="navbar-nav-item space-x-2" to="/sent-referrals">
            <svg role="img" className="navbar-icon" aria-hidden="true">
              <use xlinkHref={`${appData.assets.icons}#icon-folder`} />
            </svg>
            <span>
              <FormattedMessage {...messages.sentReferrals} />
            </span>
          </NavLink>
          {currentUser && currentUser.memberships.length > 0 ? (
            <>
              <div className="w-full flex items-center py-4 px-8 space-x-2">
                <svg role="img" className="navbar-icon" aria-hidden="true">
                  <use xlinkHref={`${appData.assets.icons}#icon-folder`} />
                </svg>
                <span>
                  <FormattedMessage {...messages.unitListTitle} />
                </span>
              </div>
              {currentUser.memberships.map((membership) => (
                <NavLink
                  className="navbar-nav-item pl-16 space-x-2"
                  key={membership.unit}
                  to={`/unit/${membership.unit}`}
                >
                  <svg role="img" className="navbar-icon" aria-hidden="true">
                    <use xlinkHref={`${appData.assets.icons}#icon-folder`} />
                  </svg>
                  <span>{membership.unit_name}</span>
                </NavLink>
              ))}
            </>
          ) : null}
          {currentUser && currentUser.is_staff ? (
            <a className="navbar-nav-item space-x-2" href={appData.url_admin}>
              <svg role="img" className="navbar-icon" aria-hidden="true">
                <use xlinkHref={`${appData.assets.icons}#icon-database`} />
              </svg>
              <span>
                <FormattedMessage {...messages.backOffice} />
              </span>
            </a>
          ) : null}
          <div className="relative w-full h-2 bg-gray-100" />
        </div>
      </div>

      <div
        className="flex-grow w-full flex flex-col flex-shrink-0 justify-end pt-8"
        style={{ boxShadow: '0 -4px 8px -5px #666' }}
      >
        <Link
          className="btn btn-primary-outline flex items-center space-x-2 mx-6"
          to="/new-referral"
        >
          <svg role="img" className="navbar-icon" aria-hidden="true">
            <use xlinkHref={`${appData.assets.icons}#icon-plus`} />
          </svg>
          <span>
            <FormattedMessage {...messages.newReferral} />
          </span>
        </Link>
      </div>
    </nav>
  );
};
