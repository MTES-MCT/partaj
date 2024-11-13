import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useHistory } from 'react-router';

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
import { useTranslateStatus } from './utils';
import { useDashboardContext } from './DashboardContext';

export const messages = defineMessages({
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
});

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

interface Column {
  name: keyof ReferralLite;
  label: string;
  render?: (item: ReferralLite) => React.ReactNode;
}

export const ReferralTable: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const translateStatus = useTranslateStatus();
  const { params, toggleFilter, results, activeTab } = useDashboardContext();

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
        return 'outline';
      default:
        return 'default';
    }
  };

  const navigateToReferral = (referral: ReferralLite) => {
    history.push(`/dashboard/referral-detail/${referral.id}`);
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
          {translateStatus(item.state)}
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
              onClick={() => console.log(column.name)}
              className="cursor-pointer hover:bg-gray-100 bg-muted"
            >
              <div className="flex items-center">
                {column.label}
                {'id' === column.name &&
                  ('asc' === 'asc' ? (
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
        {results &&
          results[activeTab]!.items.map((item: any, index: any) => (
            <TableRow
              key={item.id}
              onClick={() => navigateToReferral(item)}
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
