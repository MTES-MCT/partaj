import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/dsfr/Table';
import { ReferralLite } from 'types';
import { useTranslateTab } from './utils';
import { useDashboardContext } from './DashboardContext';
import { commonMessages } from '../../const/translations';
import { AlertIcon, ArrowCornerDownRight, EmptyFolder } from '../Icons';
import { ReferralStatusBadge } from '../ReferralStatusBadge';
import { useReferralLitesV2 } from '../../data';
import { snakeCase } from 'lodash-es';
import { Text, TextType } from '../text/Text';

export const messages = defineMessages({
  columnId: {
    id: 'newDashboard.column.id',
    defaultMessage: '#',
    description: 'Column header for ID',
  },
  referralDate: {
    id: 'newDashboard.column.referralDate',
    defaultMessage: 'Referral date',
    description: 'Column header for referral date',
  },
  columnCreatedAt: {
    id: 'newDashboard.column.createdAt',
    defaultMessage: 'Created on',
    description: 'Column header for creation date',
  },
  columnSentAt: {
    id: 'newDashboard.column.sentAt',
    defaultMessage: 'Sent at',
    description: 'Column header for sent date',
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
  error: {
    id: 'newDashboard.error',
    defaultMessage: 'Error: {error}',
    description: 'Error message',
  },
  emptyTable: {
    id: 'newDashboard.emptyTable',
    defaultMessage: 'Your tab {tabName} is empty',
    description: 'Empty table message',
  },
  resetFilters: {
    defaultMessage: 'Reset filters:',
    description: 'Reset filter button text',
    id: 'components.ReferralTable.resetFilters',
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

export const ReferralTable: React.FC<{
  forceFilters?: Array<string>;
  url: string;
  unitId?: string;
}> = ({ forceFilters = [], url, unitId }) => {
  const intl = useIntl();
  const history = useHistory();
  const translateTab = useTranslateTab();
  const {
    params,
    setResults,
    results,
    activeTab,
    sortBy,
    activeFilters,
    resetFilters,
  } = useDashboardContext();

  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const navigateToReferral = (referral: ReferralLite) => {
    history.push(`/${url}/referral-detail/${referral.id}`);
  };

  const columns: Column[] = [
    {
      name: 'id',
      label: intl.formatMessage(messages.columnId),
    },
    {
      name: 'sent_at',
      label: intl.formatMessage(messages.columnSentAt),
      render: (item: ReferralLite) => formatDate(item.sent_at),
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
      render: (item: ReferralLite) => {
        return (
          <div className="flex flex-col">
            <span> {item.title ?? item.object}</span>
            {item.sub_title && (
              <div className="flex items-stretch">
                <div className="flex items-start flex-shrink-0 mt-1">
                  <ArrowCornerDownRight className="w-4 h-4 fill-primary400" />
                </div>
                <span className="flex items-start text-sm">
                  {' '}
                  {item.sub_title}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: 'requesters',
      label: intl.formatMessage(messages.columnRequestersUnits),
      styleTd: {
        width: '1%',
        minWidth: '150px',
        maxWidth: '260px',
        whiteSpace: 'pre-wrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      },
      render: (item: ReferralLite) =>
        Array.from(
          new Set(
            item.requesters
              .filter((requester) => requester.unit_name !== '')
              .map((requester) => requester.unit_name),
          ),
        ).map((unitName) => (
          <span
            className="whitespace-nowrap"
            key={`${snakeCase(unitName)}-requesters-cell`}
          >
            {unitName} <br />
          </span>
        )),
    },
    {
      name: 'assignees',
      label: intl.formatMessage(messages.columnAssignments),
      render: (item: ReferralLite) =>
        item.assignees.map((assignee) => (
          <span
            className="whitespace-nowrap"
            key={`${assignee.id}-assignees-cell`}
          >
            {assignee.first_name + ' ' + assignee.last_name} <br />
          </span>
        )),
    },
    {
      name: 'state',
      label: intl.formatMessage(messages.columnStatus),
      render: (item: ReferralLite) => (
        <ReferralStatusBadge status={item.state} />
      ),
    },
    {
      name: 'published_date',
      label: intl.formatMessage(messages.columnPublishedDate),
      render: (item: ReferralLite) =>
        item.published_date ? formatDate(item.published_date) : '',
    },
  ];

  const { status } = useReferralLitesV2(params, url, unitId, {
    onSuccess: (data) => {
      setResults(data);
    },
  });

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
                      ? 'text-primary-450'
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
                      <ChevronUp className="ml-1 h-4 w-4 fill-primary450" />
                    ) : params
                        .getAll('sort')
                        .includes(
                          `${activeTab.name}-${column.name}-${SortDirection.DESC}`,
                        ) ? (
                      <ChevronDown className="ml-1 h-4 w-4 fill-primary450" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4 fill-black" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === 'success' && results.hasOwnProperty(activeTab.name) && (
              <>
                {' '}
                {results[activeTab.name]!.count > 0 ? (
                  <>
                    {results[activeTab.name]!.items.map(
                      (item: any, index: any) => (
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
                              {column.render
                                ? column.render(item)
                                : item[column.name]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ),
                    )}
                  </>
                ) : (
                  <>
                    <div
                      className={`absolute h-96 top-32 flex items-center justify-center w-full`}
                    >
                      <div className="flex flex-col font-medium w-400 items-center">
                        <div className="flex space-x-4 items-center">
                          <EmptyFolder className="fill-dsfr-success-500 h-10 w-10" />
                          <span>
                            <FormattedMessage
                              {...messages.emptyTable}
                              values={{
                                tabName: (
                                  <b> {translateTab(activeTab.name)} </b>
                                ),
                              }}
                            />
                          </span>
                        </div>
                        {Object.keys(activeFilters).filter(
                          (key) => !forceFilters.includes(snakeCase(key)),
                        ).length > 0 && (
                          <button
                            className={`button text-s underline button-superfit`}
                            onClick={() => resetFilters()}
                          >
                            <FormattedMessage {...messages.resetFilters} />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {status === 'loading' && (
              <>
                {[...Array(10).keys()].map((item: number, index: number) => (
                  <TableRow
                    key={`loading-table-row-${index}`}
                    className={`${
                      index % 2 === 0 ? '' : 'table-loading-odd'
                    } transition-colors`}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`loading-table-cell-${index}-${column.name}`}
                        style={column.styleTd ?? {}}
                      >
                        {' '}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}
            {status === 'error' && (
              <div
                className={`absolute h-96 top-32 flex items-center justify-center w-full`}
              >
                <div className="flex font-medium text-dsfr-danger-500 w-400 items-center space-x-4">
                  <AlertIcon className="fill-dsfr-danger-500 h-32 w-32" />
                  <span>
                    <FormattedMessage
                      {...messages.error}
                      values={{
                        error: (
                          <FormattedMessage
                            {...commonMessages.defaultErrorMessage}
                          />
                        ),
                      }}
                    />
                  </span>
                </div>
              </div>
            )}
          </TableBody>
        </Table>
      )}
    </>
  );
};
