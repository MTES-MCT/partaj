import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { useIntl } from 'react-intl';

import { Badge } from 'components/dsfr/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/dsfr/Table';
import { ReferralLite, ReferralState } from 'types';

import { messages } from './messages';
import { SortDirection } from './useNewDashboard';

interface Column {
  name: keyof ReferralLite;
  label: string;
  render?: (item: ReferralLite) => React.ReactNode;
}

interface ReferralTableProps {
  referrals: ReferralLite[] | undefined;
  sortColumn: string | null;
  sortDirection: SortDirection;
  handleSort: (columnName: string) => void;
  handleClick: (referral: ReferralLite) => void;
}

export const ReferralTable: React.FC<ReferralTableProps> = ({
  referrals,
  sortColumn,
  sortDirection,
  handleSort,
  handleClick,
}) => {
  const intl = useIntl();

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

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
      case ReferralState.DRAFT:
      case ReferralState.INCOMPLETE:
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTranslatedStatus = (state: ReferralState) => {
    const stateLabel = `state${
      state.charAt(0).toUpperCase() + state.slice(1)
    }` as keyof typeof messages;
    return intl.formatMessage(messages[stateLabel]);
  };

  const columns: Column[] = [
    { name: 'id', label: intl.formatMessage(messages.columnId) },
    {
      name: 'created_at',
      label: intl.formatMessage(messages.columnCreatedAt),
      render: (item: ReferralLite) => formatDate(item.created_at),
    },
    {
      name: 'due_date',
      label: intl.formatMessage(messages.columnDueDate),
      render: (item: ReferralLite) => formatDate(item.due_date),
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
        item.published_date ? formatDate(item.published_date) : '',
    },
  ];

  return (
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
            key={item.id}
            onClick={() => handleClick(item)}
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
  );
};
