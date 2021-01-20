import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link, NavLink, useRouteMatch } from 'react-router-dom';

import { appData } from 'appData';
import { Spinner } from 'components/Spinner';
import { useCurrentUser } from 'data/useCurrentUser';
import { getUserFullname } from 'utils/user';

const messages = defineMessages({
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

export const Sidebar: React.FC = () => {
  const { path } = useRouteMatch();
  const { currentUser } = useCurrentUser();

  // We have to compute whether the "Dashboard" nav link is active manually as it is
  // the default view (without additional url parts)
  const isOpenDashboardItself = useRouteMatch({ path, exact: true });
  const isOpenDashboardReferral = useRouteMatch({
    path: `${path}referral-detail/:referralId`,
    exact: true,
  });
  const isActiveDashboard = isOpenDashboardItself || isOpenDashboardReferral;

  return (
    <nav className="navbar">
      <div className="w-full space-y-8">
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
          <div className="w-full py-4 px-8 overflow-hidden font-semibold">
            {getUserFullname(currentUser)}
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
              className={`navbar-nav-item ${isActiveDashboard ? 'active' : ''}`}
              to="/"
            >
              <FormattedMessage {...messages.dashboard} />
            </Link>
          ) : null}
          <NavLink className="navbar-nav-item" to="/sent-referrals">
            <FormattedMessage {...messages.sentReferrals} />
          </NavLink>
          {currentUser && currentUser.memberships.length > 0 ? (
            <>
              <div className="w-full py-4 px-8">
                <FormattedMessage {...messages.unitListTitle} />
              </div>
              {currentUser.memberships.map((membership) => (
                <NavLink
                  className="navbar-nav-item pl-16"
                  key={membership.unit}
                  to={`/unit/${membership.unit}`}
                >
                  {membership.unit_name}
                </NavLink>
              ))}
            </>
          ) : null}
          {currentUser && currentUser.is_staff ? (
            <a className="navbar-nav-item" href={appData.url_admin}>
              <FormattedMessage {...messages.backOffice} />
            </a>
          ) : null}
          <a className="navbar-nav-item" href={appData.url_logout}>
            <FormattedMessage {...messages.logOut} />
          </a>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-end">
        <Link className="btn btn-primary-outline" to="/new-referral">
          <FormattedMessage {...messages.newReferral} />
        </Link>
      </div>
    </nav>
  );
};
