import * as Sentry from '@sentry/react';
import React, { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

import { appData } from 'appData';
import {
  BreadCrumbs,
  BreadCrumbsProvider,
  Crumb,
} from 'components/BreadCrumbs';
import { DraftReferrals } from 'components/DraftReferrals';
import { Metrics } from 'components/Metrics';
import { Overlay } from 'components/Overlay';
import { ReferralFormRedirection } from 'components/ReferralForm/ReferralFormRedirection';
import { SentReferral } from 'components/SentReferral';
import { SentReferrals } from 'components/SentReferrals';
import { Sidebar, focusOnNavbar } from 'components/Navbar';
import { Spinner } from 'components/Spinner';
import { Unit } from 'components/Unit';
import { useCurrentUser } from 'data/useCurrentUser';
import { UserDashboard } from '../OldDashboard/UserDashboard';
import { NoteListView } from '../Notes/NoteListView';
import { NoteDetailView } from '../Notes/NoteDetailView';
import { ReferralForm } from '../ReferralForm';
import { Dashboard } from '../Dashboard';
import { UnitDashboard } from '../UnitDashboard';
import { ReferralDetail } from '../ReferralDetail';
import { GenericModal } from '../modals/GenericModal';
import { ApiModal } from '../modals/APIModal';
import { BaseSideModal } from '../ReferralDetail/Header/BaseSideModal';
import { SupportOverlay } from 'components/SupportOverlay';

const PAGE_ENTRYPOINT_ELEMENT_ID = 'page-entrypoint';

export const focusOnPage = () => {
  document?.getElementById(PAGE_ENTRYPOINT_ELEMENT_ID)?.focus();
};

const LegacyUnitReferralRedirect: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  return <Navigate to={`/unit/referral-detail/${referralId}`} replace />;
};

const messages = defineMessages({
  closeSidebar: {
    defaultMessage: 'Close sidebar menu',
    description:
      'Accessibility message for the hamburger button to close the sidebar on small screens.',
    id: 'components.Root.closeSidebar',
  },
  crumbDashboard: {
    defaultMessage: 'OldDashboard',
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

  useEffect(() => {
    isSidebarOpen ? focusOnNavbar() : focusOnPage();
  }, [isSidebarOpen]);

  useEffect(() => {
    Sentry.init({ dsn: appData.sentry_dsn, environment: appData.environment });
  }, []);

  return (
    <Router basename="/app">
      <BreadCrumbsProvider>
        <div className="flex flex-row min-h-screen h-full max-h-screen relative border-0">
          <SupportOverlay />
          <Sidebar isOpen={isSidebarOpen} />
          <div
            className={`relative overflow-auto flex-grow flex flex-col transition-left duration-500 ease-in-out ${
              isSidebarOpen ? 'main-open' : 'left-0'
            }`}
          >
            <div className="absolute bg-white px-8 py-4 lg:hidden z-50 w-28 h-20">
              <button
                aria-labelledby={seed('sidebar-hamburger-open')}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex p-2 hover:bg-gray-200 items-center"
              >
                <svg
                  aria-labelledby={seed('sidebar-hamburger-open')}
                  className="fill-current h-8 w-8"
                  role="presentation"
                >
                  <title id={seed('sidebar-hamburger-open')}>
                    {isSidebarOpen ? (
                      <FormattedMessage {...messages.closeSidebar} />
                    ) : (
                      <FormattedMessage {...messages.openSidebar} />
                    )}
                  </title>
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-hamburger-menu`}
                  />
                </svg>
              </button>
            </div>
            <div
              id={PAGE_ENTRYPOINT_ELEMENT_ID}
              className="relative flex flex-col overflow-auto flex-grow px-8"
            >
              <BreadCrumbs />
              <Routes>
                <Route
                  path="/unit/:unitId/referrals-list/referral-detail/:referralId"
                  element={<LegacyUnitReferralRedirect />}
                />

                <Route
                  path="/unit/referral-detail/:referralId/*"
                  element={
                    <>
                      <ReferralDetail />
                      <Crumb
                        key="dashboard-referral-detail"
                        title={<FormattedMessage {...messages.crumbUnit} />}
                      />
                    </>
                  }
                />

                <Route
                  path="/unit/:unitId/*"
                  element={
                    <>
                      <UnitDashboard />
                      <Crumb
                        key="unit"
                        title={<FormattedMessage {...messages.crumbUnit} />}
                      />
                    </>
                  }
                />

                <Route
                  path="/dashboard/*"
                  element={
                    <>
                      <Dashboard />
                      <Crumb
                        key="dashboard"
                        title={
                          <FormattedMessage {...messages.crumbDashboard} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/new-referral"
                  element={<ReferralFormRedirection />}
                />

                <Route
                  path="/new-referral/:referralId"
                  element={
                    <>
                      <ReferralForm />
                      <Crumb
                        key="referral-form"
                        title={
                          <FormattedMessage {...messages.crumbReferralForm} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/sent-referrals/*"
                  element={
                    <>
                      <SentReferrals />
                      <Crumb
                        key="sent-referrals"
                        title={
                          <FormattedMessage {...messages.crumbSentReferrals} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/sent-referral/:referral"
                  element={
                    <>
                      <SentReferral />
                      <Crumb
                        key="sent-referral"
                        title={
                          <FormattedMessage {...messages.crumbSentReferral} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/draft-referrals/*"
                  element={
                    <>
                      <DraftReferrals />
                      <Crumb
                        key="draft-referrals"
                        title={
                          <FormattedMessage {...messages.crumbDraftReferral} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/my-dashboard/*"
                  element={
                    <>
                      <UserDashboard />
                      <Crumb
                        key="my-dashboard"
                        title={
                          <FormattedMessage {...messages.crumbMyDashboard} />
                        }
                      />
                    </>
                  }
                />

                <Route
                  path="/Metrics/:metrics"
                  element={
                    <>
                      <Metrics />
                      <Crumb
                        key="metrics"
                        title={<FormattedMessage {...messages.crumbMetrics} />}
                      />
                    </>
                  }
                />

                <Route
                  path="/metrics"
                  element={
                    <>
                      <Metrics />
                      <Crumb
                        key="metrics"
                        title={<FormattedMessage {...messages.crumbMetrics} />}
                      />
                    </>
                  }
                />

                <Route path="/notes/:noteId" element={<NoteDetailView />} />

                <Route path="/notes" element={<NoteListView />} />

                <Route
                  path="/"
                  element={
                    !currentUser ? (
                      <Spinner size="large">
                        <FormattedMessage {...messages.loadingCurrentUser} />
                      </Spinner>
                    ) : currentUser.memberships.length > 0 ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Navigate to="/my-dashboard" replace />
                    )
                  }
                />
              </Routes>
            </div>
            <Overlay isOpen={isSidebarOpen} />
          </div>
          <GenericModal />
          <ApiModal />
        </div>
      </BreadCrumbsProvider>
    </Router>
  );
};
