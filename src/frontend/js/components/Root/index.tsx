import * as Sentry from '@sentry/react';
import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

import { appData } from 'appData';
import { Dashboard } from 'components/Dashboard';
import { ReferralForm } from 'components/ReferralForm';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Unit } from 'components/Unit';
import { useCurrentUser } from 'data/useCurrentUser';

const messages = defineMessages({
  dashboard: {
    defaultMessage: 'Dashboard',
    description: 'Navigation item to the dashboard.',
    id: 'components.Root.dashboard',
  },
  logIn: {
    defaultMessage: 'Log in / Sign up',
    description: 'Navigation item to enable users to log in or sign up.',
    id: 'components.Root.logIn',
  },
  logOut: {
    defaultMessage: 'Log out',
    description: 'Navigation item to enable users to log out.',
    id: 'components.Root.logOut',
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
});

export const Root: React.FC = () => {
  const { currentUser } = useCurrentUser();

  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  return (
    <Router basename="/app">
      <nav className="container mx-auto flex items-center justify-between flex-wrap lg:py-4">
        <a
          className="flex items-center text-black h-12 hover:text-black hover:no-underline"
          href="/"
        >
          <img
            src="/static/core/img/logo-marianne.svg"
            className="w-auto h-full mr-3"
          />
          <span
            className="h-full font-light"
            style={{ padding: '10px 2px 0 0', fontSize: '1.15rem' }}
          >
            partaj
          </span>
          <img
            src="/static/core/img/point-beta-gouv-fr.svg"
            className="w-auto h-full"
            style={{ minWidth: '7rem' }}
          />
        </a>
        <div className="block lg:hidden mr-4">
          <button className="flex items-center px-3 py-2 border rounded text-primary-500 border-primary-500 hover:text-white hover:border-white">
            <svg
              className="fill-current h-3 w-3"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>
        <div className="w-full block flex-grow my-2 lg:my-0 shadow-inner lg:shadow-none bg-gray-200 lg:bg-transparent lg:flex lg:items-center lg:w-auto lg:justify-end">
          <Link
            className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
            to="/new-referral"
          >
            <FormattedMessage {...messages.newReferral} />
          </Link>
          <Link
            className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
            to="/sent-referrals"
          >
            <FormattedMessage {...messages.sentReferrals} />
          </Link>
          {currentUser && currentUser.memberships.length > 0 ? (
            <>
              <Link
                className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
                to="/"
              >
                <FormattedMessage {...messages.dashboard} />
              </Link>
              {currentUser.memberships.map((membership) => (
                <Link
                  className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
                  key={membership.unit}
                  to={`/unit/${membership.unit}/`}
                >
                  {membership.unit}
                </Link>
              ))}
            </>
          ) : null}
          {/* {% if user.is_staff %}
              <a className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700" href="{% url 'admin:index' %}">{% trans 'Back-office' %}</a>
            {% endif %} */}
          {currentUser ? (
            <a
              className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
              href="{% url 'cas_ng_login' %}"
            >
              <FormattedMessage {...messages.logIn} />
            </a>
          ) : (
            <a
              className="block lg:inline-block my-2 lg:my-0 mx-4 lg:mx-0 lg:mr-4 text-primary-500 hover:text-primary-700"
              href="{% url 'cas_ng_logout' %}"
            >
              <FormattedMessage {...messages.logOut} />
            </a>
          )}
        </div>
      </nav>

      <Switch>
        <Route exact path="/new-referral">
          <ReferralForm />
        </Route>

        <Route exact path="/sent-referral/:referral">
          <SentReferral />
        </Route>

        <Route path="/sent-referrals">
          <SentReferrals />
        </Route>

        <Route path="/unit/:unitId">
          <Unit />
        </Route>

        <Route path="/">
          <Dashboard />
        </Route>
      </Switch>
    </Router>
  );
};
