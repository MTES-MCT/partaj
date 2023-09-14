import * as Sentry from '@sentry/react';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import {
  BreadCrumbs,
  BreadCrumbsProvider,
  Crumb,
} from 'components/BreadCrumbs';
import { Dashboard } from 'components/Dashboard';
import { DraftReferrals } from 'components/DraftReferrals';
import { Metrics } from 'components/Metrics';
import { Overlay } from 'components/Overlay';
import { ReferralForm } from 'components/ReferralForm';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Sidebar } from 'components/Navbar';
import { Spinner } from 'components/Spinner';
import { Unit } from 'components/Unit';
import { useCurrentUser } from 'data/useCurrentUser';
import { UserDashboard } from '../Dashboard/UserDashboard';
import { NoteListView } from '../Notes/NoteListView';
import { NoteDetailView } from '../Notes/NoteDetailView';
import { ExclamationMarkIcon, IconColor } from '../Icons';
import { useFeatureFlag, useReferral, useReferralReport } from '../../data';

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
  crumbMyDashboard: {
    defaultMessage: 'Referrals list',
    description: 'Breadcrumb title for the my dashboard view.',
    id: 'components.Root.crumbMyDashboard',
  },
  crumbMetrics: {
    defaultMessage: 'Metrics',
    description: 'Breadcrumb title for the metrics view.',
    id: 'components.Root.crumbMetrics',
  },
  crumbReferralForm: {
    defaultMessage: 'Referral form',
    description: 'Breadcrumb title for the referral form view.',
    id: 'components.Root.crumbReferralForm',
  },
  crumbDraftReferral: {
    defaultMessage: 'Draft referral',
    description: 'Breadcrumb title for the draft referral view.',
    id: 'components.Root.crumbDrafteferral',
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
  loadingCurrentUser: {
    // Wording that makes sense for users redirected to dashboard and users redirected to sent referrals
    defaultMessage: 'Loading current user...',
    description: `Accessible message for spinners as we determine whether to redirect users to the dashboard or
    to the sent referrals view.`,
    id: 'components.Root.loadingCurrentUser',
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
  const { currentUser } = useCurrentUser();
  const [isUrlChanged, setUrlChanged] = useState<boolean>(false);

  const { status: featureFlagStatus } = useFeatureFlag('url_has_changed', {
    onSuccess: (data) => {
      setUrlChanged(data.is_active);
    },
  });

  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  return (
    <Router basename="/app">
      <BreadCrumbsProvider>
        <div className="flex flex-row min-h-screen h-full max-h-screen relative">
          <Sidebar isOpen={isSidebarOpen} />
          <div
            className={`relative overflow-auto flex-grow flex flex-col transition-left duration-500 ease-in-out ${
              isSidebarOpen ? 'main-open' : 'left-0'
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
              {featureFlagStatus === 'success' && isUrlChanged ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="space-x-2 flex rounded border border-warning-500 bg-warning-200 text-warning-500 p-2 max-w-960 items-center">
                    <ExclamationMarkIcon
                      size={6}
                      color={IconColor.WARNING_500}
                    />
                    <div>
                      <span>
                        La plateforme Partaj change d'adresse et devient
                        désormais{' '}
                      </span>
                      <span className="text-warning-700">
                        https://partaj.ecologie.gouv.fr
                      </span>
                      <span>
                        ! N'oubliez pas de changer vos favoris pour vous
                        connecter directement à la nouvelle adresse.
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
              <BreadCrumbs />
              <Switch>
                <Route exact path="/new-referral/:referralId">
                  <ReferralForm />
                  <Crumb
                    key="referral-form"
                    title={<FormattedMessage {...messages.crumbReferralForm} />}
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

                <Route exact path="/sent-referral/:referral">
                  <SentReferral />
                  <Crumb
                    key="sent-referral"
                    title={<FormattedMessage {...messages.crumbSentReferral} />}
                  />
                </Route>

                <Route path="/draft-referrals">
                  <DraftReferrals />
                  <Crumb
                    key="draft-referrals"
                    title={
                      <FormattedMessage {...messages.crumbDraftReferral} />
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

                <Route path="/my-dashboard">
                  <UserDashboard />
                  <Crumb
                    key="my-dashboard"
                    title={<FormattedMessage {...messages.crumbMyDashboard} />}
                  />
                </Route>

                <Route exact path="/Metrics/:metrics">
                  <Metrics />
                  <Crumb
                    key="metrics"
                    title={<FormattedMessage {...messages.crumbMetrics} />}
                  />
                </Route>

                <Route path="/metrics">
                  <Metrics />
                  <Crumb
                    key="metrics"
                    title={<FormattedMessage {...messages.crumbMetrics} />}
                  />
                </Route>

                <Route exact path="/notes/:noteId">
                  <NoteDetailView />
                </Route>

                <Route exact path="/notes">
                  <NoteListView />
                </Route>

                <Route path="/">
                  {!currentUser ? (
                    <Spinner size="large">
                      <FormattedMessage {...messages.loadingCurrentUser} />
                    </Spinner>
                  ) : currentUser.memberships.length > 0 ? (
                    <Redirect to="/dashboard" />
                  ) : (
                    <Redirect to="/my-dashboard" />
                  )}
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
