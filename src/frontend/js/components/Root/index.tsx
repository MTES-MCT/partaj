import * as Sentry from '@sentry/react';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { appData } from 'appData';
import { Dashboard } from 'components/Dashboard';
import { ReferralForm } from 'components/ReferralForm';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Sidebar } from 'components/Sidebar';
import { Unit } from 'components/Unit';

export const Root: React.FC = () => {
  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  return (
    //   <div className="block lg:hidden mr-4">
    //   <button className="flex items-center px-3 py-2 border rounded text-primary-500 border-primary-500 hover:text-white hover:border-white">
    //     <svg
    //       className="fill-current h-3 w-3"
    //       viewBox="0 0 20 20"
    //       xmlns="http://www.w3.org/2000/svg"
    //     >
    //       <title>Menu</title>
    //       <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
    //     </svg>
    //   </button>F
    // </div>

    <Router basename="/app">
      <div className="flex flex-row min-h-screen h-full max-h-screen">
        <Sidebar />
        <div className="overflow-auto flex-grow px-8">
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
      </div>
    </Router>
  );
};
