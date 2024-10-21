import React, { createContext, useContext, useReducer, Dispatch } from 'react';

import { ReferralLite, ReferralState } from 'types';
import { DateRange } from 'components/dsfr/DateRangePicker';
import { ReferralTab } from './ReferralTabs';
import { SortDirection } from './useNewDashboard';

interface DashboardState {
  search: string;
  requesterId: string;
  requesterUnitId: string;
  themeId: string;
  userId: string;
  unitId: string;
  dateRange: DateRange | undefined;
  referralState: ReferralState | 'all';
  referralTab: ReferralTab;
  sortColumn: string | null;
  sortDirection: SortDirection;
  isLoading: boolean;
  error: Error | null;
  referrals: ReferralLite[] | undefined;
}

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_REQUESTER_ID'; payload: string }
  | { type: 'SET_REQUESTER_UNIT_ID'; payload: string }
  | { type: 'SET_THEME_ID'; payload: string }
  | { type: 'SET_USER_ID'; payload: string }
  | { type: 'SET_UNIT_ID'; payload: string }
  | { type: 'SET_DATE_RANGE'; payload: DateRange | undefined }
  | { type: 'SET_REFERRAL_STATE'; payload: ReferralState | 'all' }
  | { type: 'SET_REFERRAL_TAB'; payload: ReferralTab }
  | { type: 'SET_SORT_COLUMN'; payload: string | null }
  | { type: 'SET_SORT_DIRECTION'; payload: SortDirection }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_REFERRALS'; payload: ReferralLite[] | undefined };

const DashboardContext = createContext<
  { state: DashboardState; dispatch: Dispatch<Action> } | undefined
>(undefined);

const initialState: DashboardState = {
  search: '',
  requesterId: '',
  requesterUnitId: '',
  themeId: '',
  userId: '',
  unitId: '',
  dateRange: undefined,
  referralState: 'all',
  referralTab: ReferralTab.Process,
  sortColumn: null,
  sortDirection: SortDirection.Asc,
  isLoading: false,
  error: null,
  referrals: undefined,
};

function dashboardReducer(
  state: DashboardState,
  action: Action,
): DashboardState {
  switch (action.type) {
    case 'SET_THEME_ID':
      return { ...state, themeId: action.payload };
    case 'SET_REQUESTER_ID':
      return { ...state, requesterId: action.payload };
    case 'SET_REQUESTER_UNIT_ID':
      return { ...state, requesterUnitId: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'SET_UNIT_ID':
      return { ...state, unitId: action.payload };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    case 'SET_REFERRAL_STATE':
      return { ...state, referralState: action.payload };
    case 'SET_SORT_COLUMN':
      return { ...state, sortColumn: action.payload };
    case 'SET_SORT_DIRECTION':
      return { ...state, sortDirection: action.payload };
    case 'SET_REFERRAL_TAB':
      return { ...state, referralTab: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REFERRALS':
      return { ...state, referrals: action.payload };
    default:
      return state;
  }
}

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      'useDashboardContext must be used within a DashboardProvider',
    );
  }
  return context;
};
