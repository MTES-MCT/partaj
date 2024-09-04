import React, { useState, useEffect, useMemo } from 'react';
import { useIntl, FormattedMessage, defineMessages } from 'react-intl';
import { useHistory, useLocation } from 'react-router';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { upperFirst, camelCase } from 'lodash';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/dsfr/Table';
import { Input } from 'components/dsfr/Input';
import { Tabs, TabsList, TabsTrigger } from 'components/dsfr/Tabs';
import { Badge } from 'components/dsfr/Badge';
import { Combobox, ComboboxOption } from 'components/dsfr/Combobox';
import { DateRangePicker, DateRange } from 'components/dsfr/DateRangePicker';
import { ClickableBadge } from 'components/dsfr/ClickableBadge';

import { ReferralLite, ReferralState } from 'types';
import { UseReferralLitesParams, useReferralLites } from 'data';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

const messages = defineMessages({
  dashboardTitle: {
    id: 'newDashboard.title',
    defaultMessage: 'Dashboard',
    description: 'Dashboard title',
  },
  columnId: {
    id: 'newDashboard.column.id',
    defaultMessage: '#',
    description: 'Column header for ID',
  },
  columnCreatedAt: {
    id: 'newDashboard.column.createdAt',
    defaultMessage: 'Created on',
    description: 'Column header for creation date',
  },
  columnDueDate: {
    id: 'newDashboard.column.dueDate',
    defaultMessage: 'Due date',
    description: 'Column header for due date',
  },
  columnTitle: {
    id: 'newDashboard.column.title',
    defaultMessage: 'Title',
    description: 'Column header for title',
  },
  columnRequestersUnits: {
    id: 'newDashboard.column.requestersUnits',
    defaultMessage: 'Requester units',
    description: 'Column header for requester units',
  },
  columnAssignments: {
    id: 'newDashboard.column.assignments',
    defaultMessage: 'Assignments',
    description: 'Column header for assignments',
  },
  columnStatus: {
    id: 'newDashboard.column.status',
    defaultMessage: 'Status',
    description: 'Column header for status',
  },
  columnPublishedDate: {
    id: 'newDashboard.column.publishedDate',
    defaultMessage: 'Published date',
    description: 'Column header for published date',
  },
  filterSearch: {
    id: 'newDashboard.filter.search',
    defaultMessage: 'Search: {search}',
    description: 'Search filter label',
  },
  filterUser: {
    id: 'newDashboard.filter.user',
    defaultMessage: 'User: {user}',
    description: 'User filter label',
  },
  filterUnit: {
    id: 'newDashboard.filter.unit',
    defaultMessage: 'Unit: {unit}',
    description: 'Unit filter label',
  },
  filterDate: {
    id: 'newDashboard.filter.date',
    defaultMessage: 'Date: {from} - {to}',
    description: 'Date filter label',
  },
  searchPlaceholder: {
    id: 'newDashboard.search.placeholder',
    defaultMessage: 'Search...',
    description: 'Search input placeholder',
  },
  filterUserPlaceholder: {
    id: 'newDashboard.filter.user.placeholder',
    defaultMessage: 'Filter by user...',
    description: 'User filter input placeholder',
  },
  filterUnitPlaceholder: {
    id: 'newDashboard.filter.unit.placeholder',
    defaultMessage: 'Filter by unit...',
    description: 'Unit filter input placeholder',
  },
  tabAll: {
    id: 'newDashboard.tab.all',
    defaultMessage: 'All',
    description: 'All tab label',
  },
  loading: {
    id: 'newDashboard.loading',
    defaultMessage: 'Loading...',
    description: 'Loading message',
  },
  error: {
    id: 'newDashboard.error',
    defaultMessage: 'Error: {error}',
    description: 'Error message',
  },
  stateProcessing: {
    id: 'newDashboard.referralState.processing',
    defaultMessage: 'Processing',
    description: 'Processing state label',
  },
  stateAssigned: {
    id: 'newDashboard.referralState.assigned',
    defaultMessage: 'Assigned',
    description: 'Assigned state label',
  },
  stateInValidation: {
    id: 'newDashboard.referralState.in_validation',
    defaultMessage: 'In Validation',
    description: 'In Validation state label',
  },
  stateReceived: {
    id: 'newDashboard.referralState.received',
    defaultMessage: 'Received',
    description: 'Received state label',
  },
  stateClosed: {
    id: 'newDashboard.referralState.closed',
    defaultMessage: 'Closed',
    description: 'Closed state label',
  },
  stateAnswered: {
    id: 'newDashboard.referralState.answered',
    defaultMessage: 'Answered',
    description: 'Answered state label',
  },
  stateDraft: {
    id: 'newDashboard.referralState.draft',
    defaultMessage: 'Draft',
    description: 'Draft state label',
  },
  stateIncomplete: {
    id: 'newDashboard.referralState.incomplete',
    defaultMessage: 'Incomplete',
    description: 'Incomplete state label',
  },
});

const getStateBadgeVariant = (
  state: ReferralState,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (state) {
    case ReferralState.PROCESSING:
      return 'default';
    case ReferralState.ASSIGNED:
      return 'secondary';
    case ReferralState.IN_VALIDATION:
      return 'outline';
    case ReferralState.RECEIVED:
      return 'default';
    case ReferralState.CLOSED:
      return 'destructive';
    case ReferralState.ANSWERED:
      return 'outline';
    case ReferralState.DRAFT:
      return 'outline';
    case ReferralState.INCOMPLETE:
      return 'outline';
    default:
      return 'default';
  }
};

interface Column {
  name: keyof ReferralLite;
  label: string;
  render?: (item: ReferralLite) => React.ReactNode;
}

export const NewDashboard: React.FC = () => {
  const getReferralUrl = (referral: ReferralLite) =>
    `/dashboard/referral-detail/${referral.id}`;

  const intl = useIntl();

  const getTranslatedStatus = (state: ReferralState) => {
    const stateLabel = upperFirst(camelCase(state));
    const message = messages[`state${stateLabel}` as keyof typeof messages];

    if (!message) {
      console.error(`Translation not found for state "${state}"`);
      return stateLabel;
    }

    return intl.formatMessage(message);
  };

  const columns: Column[] = [
    { name: 'id', label: intl.formatMessage(messages.columnId) },
    {
      name: 'created_at',
      label: intl.formatMessage(messages.columnCreatedAt),
      render: (item: ReferralLite) => formatDate(new Date(item.created_at)),
    },
    {
      name: 'due_date',
      label: intl.formatMessage(messages.columnDueDate),
      render: (item: ReferralLite) => formatDate(new Date(item.due_date)),
    },
    { name: 'object', label: intl.formatMessage(messages.columnTitle) },
    {
      name: 'requesters',
      label: intl.formatMessage(messages.columnRequestersUnits),
      render: (item: ReferralLite) =>
        item.requesters.map((requester) => requester.unit_name).join(', '),
    },
    {
      name: 'assignees',
      label: intl.formatMessage(messages.columnAssignments),
      render: (item: ReferralLite) =>
        item.assignees
          .map((assignee) => assignee.first_name + ' ' + assignee.last_name)
          .join(', '),
    },
    {
      name: 'state',
      label: intl.formatMessage(messages.columnStatus),
      render: (item: ReferralLite) => (
        <Badge variant={getStateBadgeVariant(item.state)}>
          {getTranslatedStatus(item.state)}
        </Badge>
      ),
    },
    {
      name: 'published_date',
      label: intl.formatMessage(messages.columnPublishedDate),
      render: (item: ReferralLite) =>
        item.published_date ? formatDate(new Date(item.published_date)) : '',
    },
  ];

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

  const initialDateRange = useMemo(() => {
    const fromDate = urlParams.get('fromDate');
    const toDate = urlParams.get('toDate');
    if (fromDate && toDate) {
      return {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }
    return undefined;
  }, [urlParams]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange,
  );

  const [queryParams, setQueryParams] = useState({
    search,
    referralState,
    userId,
    unitId,
    dateRange,
    sortColumn,
    sortDirection,
  });

  const filters = useMemo(() => {
    const filters: UseReferralLitesParams & {
      sort?: string;
      sort_dir?: string;
    } = {};

    const getSortKey = (column: string): string => {
      switch (column) {
        case 'id':
          return 'case_number';
        case 'object':
          return 'object.keyword';
        case 'requesters':
          return 'users_unit_name_sorting';
        case 'assignees':
          return 'assignees_sorting';
        case 'state':
          return 'state_number';
        default:
          return column;
      }
    };

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
      filters.sort = getSortKey(sortColumn);
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
    setQueryParams({
      search,
      referralState,
      userId,
      unitId,
      dateRange,
      sortColumn,
      sortDirection,
    });
  }, [
    search,
    referralState,
    userId,
    unitId,
    dateRange,
    sortColumn,
    sortDirection,
  ]);

  useEffect(() => {
    updateURL();
  }, [queryParams]);

  const handleSort = (columnName: string): void => {
    if (columnName === sortColumn) {
      if (sortDirection === SortDirection.Desc) {
        setSortColumn(null);
      } else {
        setSortDirection(
          sortDirection === SortDirection.Asc
            ? SortDirection.Desc
            : SortDirection.Asc,
        );
      }
    } else {
      setSortColumn(columnName);
      setSortDirection(SortDirection.Asc);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  const handleSelectUser = (value: string): void => {
    setUserId(value);
  };

  const handleSelectUnit = (value: string): void => {
    setUnitId(value);
  };

  const handleReferralStateChange = (state: ReferralState | 'all') => {
    setReferralState(state);
    const params = new URLSearchParams(location.search);
    if (state === 'all') {
      params.delete('state');
    } else {
      params.set('state', state);
    }
    history.replace({ pathname: location.pathname, search: params.toString() });
  };

  const handleClick = (referral: ReferralLite) => {
    history.push(getReferralUrl(referral));
  };

  const updateURL = (): void => {
    const params = new URLSearchParams();
    if (sortColumn) params.set('sort', sortColumn);
    if (sortDirection) params.set('direction', sortDirection);
    if (userId) params.set('userId', userId.toString());
    if (unitId) params.set('unitId', unitId.toString());
    if (search) params.set('search', search);
    if (dateRange?.from) params.set('fromDate', dateRange.from.toISOString());
    if (dateRange?.to) params.set('toDate', dateRange.to.toISOString());
    if (referralState !== 'all') params.set('state', referralState);

    history.replace({ pathname: location.pathname, search: params.toString() });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const userOptions: ComboboxOption[] | undefined = useMemo(() => {
    if (!referrals) return undefined;

    const allAssignees = referrals.flatMap((item) => item.assignees);

    return allAssignees
      .map((assignee) => ({
        value: assignee.id,
        label: assignee.first_name + ' ' + assignee.last_name,
      }))
      .filter(
        (item, index, array) =>
          array.findIndex((option) => option.value === item.value) === index,
      );
  }, [referrals]);

  const unitOptions: ComboboxOption[] | undefined = useMemo(() => {
    if (!referrals) return undefined;

    const allAssignees = referrals.flatMap((item) => item.assignees);

    return allAssignees
      .map((assignee) => ({
        value: assignee.unit_name,
        label: assignee.unit_name,
      }))
      .filter(
        (item, index, array) =>
          array.findIndex((option) => option.value === item.value) === index,
      );
  }, [referrals]);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  const handleClearDateFilter = () => {
    setDateRange(undefined);
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (search) {
      activeFilters.push(
        <ClickableBadge key="search" onClose={() => setSearch('')}>
          {intl.formatMessage(messages.filterSearch, { search })}
        </ClickableBadge>,
      );
    }

    if (userId) {
      const selectedUser = userOptions?.find(
        (option) => option.value === userId.toString(),
      );
      activeFilters.push(
        <ClickableBadge
          key="user"
          onClose={() => {
            setUserId('');
          }}
        >
          {intl.formatMessage(messages.filterUser, {
            user: selectedUser?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (unitId) {
      const selectedUnit = unitOptions?.find(
        (option) => option.value === unitId.toString(),
      );
      activeFilters.push(
        <ClickableBadge
          key="unit"
          onClose={() => {
            setUnitId('');
          }}
        >
          {intl.formatMessage(messages.filterUnit, {
            unit: selectedUnit?.label,
          })}
        </ClickableBadge>,
      );
    }

    if (dateRange?.from && dateRange?.to) {
      activeFilters.push(
        <ClickableBadge key="date" onClose={handleClearDateFilter}>
          {intl.formatMessage(messages.filterDate, {
            from: formatDate(dateRange.from),
            to: formatDate(dateRange.to),
          })}
        </ClickableBadge>,
      );
    }

    return activeFilters;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        <FormattedMessage {...messages.dashboardTitle} />
      </h1>
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <Input
            type="text"
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
            value={search}
            onChange={handleSearch}
            className="w-full mr-4"
          />
        </div>
        <div className="flex space-x-4">
          <Combobox
            options={userOptions || []}
            placeholder={intl.formatMessage(messages.filterUserPlaceholder)}
            value={userId ? userId.toString() : ''}
            onChange={handleSelectUser}
          />
          <Combobox
            options={unitOptions || []}
            placeholder={intl.formatMessage(messages.filterUnitPlaceholder)}
            value={unitId ? unitId.toString() : ''}
            onChange={handleSelectUnit}
          />
          <DateRangePicker onChange={handleDateRangeChange} value={dateRange} />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">{renderActiveFilters()}</div>
      <Tabs
        defaultValue="all"
        onValueChange={(value) =>
          handleReferralStateChange(value as ReferralState | 'all')
        }
        className="w-full mb-2"
      >
        <TabsList className="flex w-full">
          <TabsTrigger value="all" className="flex-1">
            <FormattedMessage {...messages.tabAll} />
          </TabsTrigger>
          {Object.values(ReferralState).map((state) => (
            <TabsTrigger key={state} value={state} className="flex-1">
              {getTranslatedStatus(state)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {isLoading || error ? (
        <div>
          {isLoading ? (
            <FormattedMessage {...messages.loading} />
          ) : (
            <FormattedMessage
              {...messages.error}
              values={{ error: (error as Error).message }}
            />
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.name}
                  onClick={() => handleSort(column.name)}
                  className="cursor-pointer hover:bg-gray-100 bg-muted"
                >
                  <div className="flex items-center">
                    {column.label}
                    {sortColumn === column.name &&
                      (sortDirection === SortDirection.Asc ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals?.map((item, index) => (
              <TableRow
                onClick={() => handleClick(item)}
                key={item.id}
                className={`
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                  hover:bg-gray-100 transition-colors
                `}
              >
                {columns.map((column) => (
                  <TableCell key={`${item.id}-${column.name}`}>
                    {column.render ? column.render(item) : item[column.name]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
