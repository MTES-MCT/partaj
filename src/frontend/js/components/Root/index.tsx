import * as Sentry from '@sentry/react';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import { Dashboard } from 'components/Dashboard';
import { Overlay } from 'components/Overlay';
import { ReferralForm } from 'components/ReferralForm';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Sidebar } from 'components/Sidebar';
import { Unit } from 'components/Unit';

const messages = defineMessages({
  closeSidebar: {
    defaultMessage: 'Close sidebar menu',
    description:
      'Accessibility message for the hamburger button to close the sidebar on small screens.',
    id: 'components.Root.closeSidebar',
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
          <div className="relative overflow-auto flex-grow px-8">
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
    </Router>
  );
};
