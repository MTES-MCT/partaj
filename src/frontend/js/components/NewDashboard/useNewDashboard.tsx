import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router';

import { ComboboxOption } from 'components/dsfr/Combobox';
import { DateRange } from 'components/dsfr/DateRangePicker';
import { UseReferralLitesParams, useReferralLites } from 'data';
import { ReferralLite, ReferralState } from 'types';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export const useNewDashboard = () => {
  const history = useHistory();
  const location = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [
    location.search,
  ]);

  const [userId, setUserId] = useState<string>(urlParams.get('userId') || '');
  const [unitId, setUnitId] = useState<string>(urlParams.get('unitId') || '');
  const [search, setSearch] = useState<string>(urlParams.get('search') || '');
  const [referralState, setReferralState] = useState<ReferralState | 'all'>(
    (urlParams.get('state') as ReferralState) || 'all',
  );
  const [sortColumn, setSortColumn] = useState<string | null>(
    (urlParams.get('sort') as keyof ReferralLite) || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (urlParams.get('direction') as SortDirection) || SortDirection.Asc,
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    urlParams.get('fromDate') && urlParams.get('toDate')
      ? {
          from: new Date(urlParams.get('fromDate')!),
          to: new Date(urlParams.get('toDate')!),
        }
      : undefined,
  );

  const filters = useMemo(() => {
    const filters: UseReferralLitesParams & {
      sort?: string;
      sort_dir?: string;
    } = {};

    if (search) filters.query = search;
    if (referralState && referralState !== 'all')
      filters.state = [referralState];
    if (userId) filters.assignee = [userId];
    if (unitId) filters.unit = [unitId];
    if (dateRange?.from)
      filters.due_date_after = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to)
      filters.due_date_before = format(dateRange.to, 'yyyy-MM-dd');
    if (sortColumn) {
      filters.sort = sortColumn;
      filters.sort_dir = sortDirection;
    }

    return filters;
  }, [
    search,
    referralState,
    userId,
    unitId,
    dateRange,
    sortColumn,
    sortDirection,
  ]);

  const { data, isLoading, error } = useReferralLites(filters);
  const referrals = data?.results;

  useEffect(() => {
    updateURL();
  }, [filters]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (sortColumn) params.set('sort', sortColumn);
    if (sortDirection) params.set('direction', sortDirection);
    if (userId) params.set('userId', userId);
    if (unitId) params.set('unitId', unitId);
    if (search) params.set('search', search);
    if (dateRange?.from) params.set('fromDate', dateRange.from.toISOString());
    if (dateRange?.to) params.set('toDate', dateRange.to.toISOString());
    if (referralState !== 'all') params.set('state', referralState);

    history.replace({ pathname: location.pathname, search: params.toString() });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSelectUser = (value: string) => {
    setUserId(value);
  };

  const handleSelectUnit = (value: string) => {
    setUnitId(value);
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleReferralStateChange = (state: ReferralState | 'all') => {
    setReferralState(state);
  };

  const handleSort = (columnName: string) => {
    if (columnName === sortColumn) {
      setSortDirection(
        sortDirection === SortDirection.Asc
          ? SortDirection.Desc
          : SortDirection.Asc,
      );
    } else {
      setSortColumn(columnName);
      setSortDirection(SortDirection.Asc);
    }
  };

  const handleClick = (referral: ReferralLite) => {
    history.push(`/dashboard/referral-detail/${referral.id}`);
  };

  const userOptions: ComboboxOption[] | undefined = useMemo(() => {
    if (!referrals) return undefined;
    const allAssignees = referrals.flatMap((item) => item.assignees);
    return allAssignees
      .map((assignee) => ({
        value: assignee.id,
        label: `${assignee.first_name} ${assignee.last_name}`,
      }))
      .filter(
        (item, index, array) =>
          array.findIndex((option) => option.value === item.value) === index,
      );
  }, [referrals]);

  const unitOptions: ComboboxOption[] | undefined = useMemo(() => {
    if (!referrals) return undefined;
    const allUnits = referrals.flatMap((item) =>
      item.assignees.map((assignee) => assignee.unit_name),
    );
    return [...new Set(allUnits)].map((unit) => ({ value: unit, label: unit }));
  }, [referrals]);

  return {
    search,
    userId,
    unitId,
    dateRange,
    referralState,
    sortColumn,
    sortDirection,
    isLoading,
    error,
    referrals,
    handleSearch,
    handleSelectUser,
    handleSelectUnit,
    handleDateRangeChange,
    handleReferralStateChange,
    handleSort,
    handleClick,
    userOptions,
    unitOptions,
  };
};
