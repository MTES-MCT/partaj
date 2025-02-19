import { useRef, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';

type Title =
  | 'dashboard'
  | 'unitDashboard'
  | 'userDashboard'
  | 'notes'
  | 'metrics'
  | 'draftReferral'
  | 'draftReferralList'
  | 'sentReferral'
  | 'sentReferralList'
  | 'referralForm'
  | 'referralDetails';

const messages = defineMessages({
  dashboardPageTitle: {
    defaultMessage: 'Dashboard',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.dashboard',
  },
  unitDashboardPageTitle: {
    defaultMessage: 'Dashboard {unit}',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.unitDashboard',
  },
  userDashboardPageTitle: {
    defaultMessage: 'My Dashboard',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.userDashboard',
  },
  notesPageTitle: {
    defaultMessage: 'Notes',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.notes',
  },
  metricsPageTitle: {
    defaultMessage: 'Metrics',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.metrics',
  },
  draftReferralPageTitle: {
    defaultMessage: 'Draft #{referralId}',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.draftReferral',
  },
  draftReferralListPageTitle: {
    defaultMessage: 'Drafts',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.draftReferral',
  },
  sentReferralPageTitle: {
    defaultMessage: 'Referral sent',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.sentReferral',
  },
  sentReferralListPageTitle: {
    defaultMessage: 'Referrals',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.sentReferralList',
  },
  referralFormPageTitle: {
    defaultMessage: 'New referral #{referralId}',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.referralForm',
  },
  referralDetailsPageTitle: {
    defaultMessage: 'Referral #{referralId}',
    description: 'Title of the page displayed in the browser tab',
    id: 'utils.pageTitles.referralDetails',
  },
});

export const useTitle = (title: Title, params?: any) => {
  const documentDefined = typeof document !== 'undefined';
  const originalTitle = useRef(documentDefined ? document.title : null);
  const intl = useIntl();

  useEffect(() => {
    if (!documentDefined) return;

    const messageId = (title + 'PageTitle') as keyof typeof messages;
    const message = messages[messageId];

    if (document.title !== title && !!message) {
      document.title = intl.formatMessage(message, params) + ' - Partaj';
    }

    return () => {
      if (originalTitle.current) {
        document.title = originalTitle.current;
      }
    };
  }, [title, documentDefined, originalTitle, params]);
};
