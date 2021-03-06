import * as Sentry from '@sentry/react';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Dashboard } from 'components/Dashboard';
import { Overlay } from 'components/Overlay';
import { ReferralForm } from 'components/ReferralForm';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Sidebar } from 'components/Sidebar';
import { Unit } from 'components/Unit';
import {
  BreadCrumbs,
  BreadCrumbsProvider,
  Crumb,
} from 'components/BreadCrumbs';

const messages = defineMessages({
  closeSidebar: {
    defaultMessage: 'Close sidebar menu',
    description:
      'Accessibility message for the hamburger button to close the sidebar on small screens.',
    id: 'components.Root.closeSidebar',
  },
  crumbDashboard: {
    defaultMessage: 'Dashboard',
    description: 'Breadcrumb title for the dashboard view.',
    id: 'components.Root.crumbDashboard',
  },
  crumbReferralForm: {
    defaultMessage: 'Referral form',
    description: 'Breadcrumb title for the referral form view.',
    id: 'components.Root.crumbReferralForm',
  },
  crumbSentReferral: {
    defaultMessage: 'Sent referral',
    description: 'Breadcrumb title for the sent referral view.',
    id: 'components.Root.crumbSentReferral',
  },
  crumbSentReferrals: {
    defaultMessage: 'Sent referrals',
    description: 'Breadcrumb title for the sent referrals list view.',
    id: 'components.Root.crumbSentReferrals',
  },
  crumbUnit: {
    defaultMessage: 'Unit',
    description: 'Breadcrumb title for the unit view.',
    id: 'components.Root.crumbUnit',
  },
  openSidebar: {
    defaultMessage: 'Open sidebar menu',
    description:
      'Accessibility message for the hamburger button to open the sidebar on small screens.',
    id: 'components.Root.openSidebar',
  },
});

export const Root: React.FC = () => {
  const seed = useUIDSeed();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  return (
    <Router basename="/app">
      <BreadCrumbsProvider>
        <div className="flex flex-row min-h-screen h-full max-h-screen relative">
          <Sidebar isOpen={isSidebarOpen} />
          <div
            className={`relative overflow-auto flex-grow flex flex-col transform transition-transform duration-500 ease-in-out ${
              isSidebarOpen ? 'translate-x-64' : 'translate-x-0'
            }`}
          >
            <div className="bg-white px-8 py-4 lg:hidden">
              <button
                aria-labelledby={seed('sidebar-hamburger-open')}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center px-3 py-2 border rounded text-primary-500 border-primary-500 hover:text-white hover:border-white"
              >
                <svg
                  aria-labelledby={seed('sidebar-hamburger-open')}
                  className="fill-current h-3 w-3"
                  role="img"
                >
                  <title id={seed('sidebar-hamburger-open')}>
                    <FormattedMessage {...messages.openSidebar} />
                  </title>
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-hamburger-menu`}
                  />
                </svg>
              </button>
            </div>
            <div className="relative flex flex-col overflow-auto flex-grow px-8">
              <BreadCrumbs />
              <Switch>
                <Route exact path="/new-referral">
                  <ReferralForm />
                  <Crumb
                    key="referral-form"
                    title={<FormattedMessage {...messages.crumbReferralForm} />}
                  />
                </Route>

                <Route exact path="/sent-referral/:referral">
                  <SentReferral />
                  <Crumb
                    key="sent-referral"
                    title={<FormattedMessage {...messages.crumbSentReferral} />}
                  />
                </Route>

                <Route path="/sent-referrals">
                  <SentReferrals />
                  <Crumb
                    key="sent-referrals"
                    title={
                      <FormattedMessage {...messages.crumbSentReferrals} />
                    }
                  />
                </Route>

                <Route path="/unit/:unitId">
                  <Unit />
                  <Crumb
                    key="unit"
                    title={<FormattedMessage {...messages.crumbUnit} />}
                  />
                </Route>

                <Route path="/dashboard">
                  <Dashboard />
                  <Crumb
                    key="dashboard"
                    title={<FormattedMessage {...messages.crumbDashboard} />}
                  />
                </Route>

                <Route path="/">
                  <Redirect to="/dashboard" />
                </Route>
              </Switch>
            </div>
            <Overlay
              Close={() => (
                <button
                  aria-labelledby={seed('sidebar-hamburger-close')}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center mx-8 my-4 px-3 py-2 border rounded text-white border-white"
                >
                  <svg
                    aria-labelledby={seed('sidebar-hamburger-close')}
                    className="fill-current h-3 w-3"
                    role="img"
                  >
                    <title id={seed('sidebar-hamburger-close')}>
                      <FormattedMessage {...messages.closeSidebar} />
                    </title>
                    <use
                      xlinkHref={`${appData.assets.icons}#icon-hamburger-menu`}
                    />
                  </svg>
                </button>
              )}
              isOpen={isSidebarOpen}
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      </BreadCrumbsProvider>
    </Router>
  );
};
