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
  style?: {};
  styleTd?: {};
  render?: (item: ReferralLite) => React.ReactNode;
}

export const ReferralTable: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const translateStatus = useTranslateStatus();
  const { params, status, results, activeTab, sortBy } = useDashboardContext();

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
    {
      name: 'id',
      label: intl.formatMessage(messages.columnId),
    },
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
    {
      name: 'object',
      label: intl.formatMessage(messages.columnTitle),
      styleTd: {
        width: '1%',
        minWidth: '320px',
        maxWidth: '320px',
        whiteSpace: 'pre-wrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      },
    },
    {
      name: 'requesters',
      label: intl.formatMessage(messages.columnRequestersUnits),
      render: (item: ReferralLite) =>
        item.requesters
          .filter((requester) => requester.unit_name !== '')
          .map((requester) => (
            <span className="whitespace-nowrap">
              {requester.unit_name} <br />
            </span>
          )),
    },
    {
      name: 'assignees',
      label: intl.formatMessage(messages.columnAssignments),
      render: (item: ReferralLite) =>
        item.assignees.map((assignee) => (
          <span className="whitespace-nowrap">
            {assignee.first_name + ' ' + assignee.last_name} <br />
          </span>
        )),
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
    <>
      {activeTab && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.name}
                  onClick={() => sortBy(column.name)}
                  className={`cursor-pointer hover:bg-primary-50 bg-grey-100 border-b-2 border-black ${
                    params
                      .getAll('sort')
                      .filter(
                        (param) =>
                          param ===
                            `${activeTab.name}-${column.name}-${SortDirection.ASC}` ||
                          param ===
                            `${activeTab.name}-${column.name}-${SortDirection.DESC}`,
                      ).length > 0
                      ? 'text-primary-400'
                      : 'text-black'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="whitespace-nowrap">{column.label}</span>
                    {params
                      .getAll('sort')
                      .includes(
                        `${activeTab.name}-${column.name}-${SortDirection.ASC}`,
                      ) ? (
                      <ChevronUp className="ml-1 h-4 w-4 fill-primary400" />
                    ) : params
                        .getAll('sort')
                        .includes(
                          `${activeTab.name}-${column.name}-${SortDirection.DESC}`,
                        ) ? (
                      <ChevronDown className="ml-1 h-4 w-4 fill-primary400" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4 fill-black" />
                    )}
                    {}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === 'success' &&
              results.hasOwnProperty(activeTab.name) &&
              results[activeTab.name]!.items.map((item: any, index: any) => (
                <TableRow
                  key={item.id}
                  onClick={() => navigateToReferral(item)}
                  className={`cursor-pointer
              ${index % 2 === 0 ? 'bg-white' : 'bg-primary-25'}
              hover:bg-primary-50 transition-colors
            `}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${item.id}-${column.name}`}
                      style={column.styleTd ?? {}}
                    >
                      {column.render ? column.render(item) : item[column.name]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};
