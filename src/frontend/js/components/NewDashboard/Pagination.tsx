import React, { useEffect, useState } from 'react';
import { useDashboardContext } from './DashboardContext';
import { NavLink } from 'react-router-dom';
import { ArrowDropLeft, ArrowDropRight, SkipLeft, SkipRight } from '../Icons';
import { getHash } from '../../utils/urls';
import { ReferralTab } from './ReferralTabs';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  lastPageTooltipText: {
    defaultMessage: 'Last Page',
    description: 'Last page tooltipText text.',
    id: 'components.Pagination.lastPageTooltipText',
  },
  previousPageTooltipText: {
    defaultMessage: 'Previous Page',
    description: 'Previous page tooltipText text.',
    id: 'components.Pagination.previousPageTooltipText',
  },
  nextPageTooltipText: {
    defaultMessage: 'Next Page',
    description: 'Next page tooltipText text.',
    id: 'components.Pagination.nextPageTooltipText',
  },
  firstPageTooltipText: {
    defaultMessage: 'First Page',
    description: 'First page tooltipText text.',
    id: 'components.Pagination.firstPageTooltipText',
  },
});

export const Pagination: React.FC = () => {
  const { results, activeTab } = useDashboardContext();

  const intl = useIntl();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    setData(results);
  }, [results]);

  const isFirstPage = () => {
    const hash = getHash('all');
    const currentPageParam = new URLSearchParams(location.search)
      .getAll('page')
      .filter((param) => param.startsWith(hash));

    const currentPage =
      currentPageParam.length > 0 ? currentPageParam[0].split('-')[1] : '1';
    return parseInt(currentPage) === 1;
  };

  const isLastPage = () => {
    const hash = getHash('all');
    const currentPageParam = new URLSearchParams(location.search)
      .getAll('page')
      .filter((param) => param.startsWith(hash));
    const currentPage =
      currentPageParam.length > 0 ? currentPageParam[0].split('-')[1] : '1';

    return (
      parseInt(currentPage) ===
      Math.ceil(data[activeTab.name].count / data['pagination'])
    );
  };

  const getActivePage = () => {
    const pageParams = new URLSearchParams(location.search).getAll('page');
    const tabPageParam = pageParams.filter((param) =>
      param.startsWith(getHash('all')),
    );

    return tabPageParam.length > 0
      ? parseInt(tabPageParam[0].split('-')[1])
      : 1;
  };

  const isActive = (index: number) => {
    const pageParams = new URLSearchParams(location.search).getAll('page');

    if (!pageParams.some((param) => param.startsWith(getHash('all')))) {
      return index + 1 === 1;
    }

    return new URLSearchParams(location.search)
      .getAll('page')
      .some((param) => param === `${getHash('all')}-${index + 1}`);
  };

  return (
    <nav className="text-sm" role="navigation" aria-label="pagination">
      {data &&
        data.hasOwnProperty(activeTab.name) &&
        Math.ceil(data[activeTab.name].count / data.pagination) > 1 && (
          <ul className="flex space-x-2 items-center">
            <li>
              <NavLink
                className={`flex pagination__link ${
                  isFirstPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.firstPageTooltipText)}
                onClick={(
                  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                ) => {
                  if (isFirstPage()) {
                    event.preventDefault();
                  }
                }}
                to={(location) => {
                  const currentParams = new URLSearchParams(location.search);
                  const hash = getHash('all');
                  const pageParams = currentParams.getAll('page');
                  const newPageParams = pageParams.filter(
                    (param) => !param.startsWith(hash),
                  );
                  currentParams.delete('page');
                  newPageParams.forEach((newParam) =>
                    currentParams.append('page', newParam),
                  );
                  currentParams.append('page', `${hash}-1`);

                  return {
                    pathname: location.pathname,
                    search: currentParams.toString(),
                    hash: location.hash,
                  };
                }}
                isActive={() => false}
              >
                <SkipLeft className="w-5 h-5" />
              </NavLink>
            </li>

            <li>
              <NavLink
                className={`flex pagination__link ${
                  isFirstPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(
                  messages.previousPageTooltipText,
                )}
                onClick={(
                  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                ) => {
                  if (isFirstPage()) {
                    event.preventDefault();
                  }
                }}
                to={(location) => {
                  const currentParams = new URLSearchParams(location.search);
                  const hash = getHash('all');
                  const pageParams = currentParams.getAll('page');

                  const newPageParams = pageParams.filter(
                    (param) => !param.startsWith(hash),
                  );

                  const currentPageParams = pageParams.filter((param) =>
                    param.startsWith(hash),
                  );

                  const pageNumber =
                    currentPageParams.length > 0
                      ? parseInt(currentPageParams[0].split('-')[1])
                      : 1;

                  currentParams.delete('page');
                  newPageParams.forEach((newParam) =>
                    currentParams.append('page', newParam),
                  );
                  currentParams.append('page', `${hash}-${pageNumber - 1}`);

                  return {
                    pathname: location.pathname,
                    search: currentParams.toString(),
                    hash,
                  };
                }}
                aria-current="true"
                isActive={() => false}
              >
                <ArrowDropLeft className="w-6 h-6" />
              </NavLink>
            </li>
            {[
              ...Array(
                Math.ceil(data[activeTab.name].count / data.pagination!),
              ),
            ].map((_: any, index: number) => (
              <>
                {isActive(index) && index + 1 > 6 && (
                  <li className="text-grey-500">...</li>
                )}

                {(isActive(index) || (index + 1 > 0 && index + 1 < 6)) && (
                  <li>
                    <NavLink
                      className="flex pagination__link"
                      to={(location) => {
                        const currentParams = new URLSearchParams(
                          location.search,
                        );
                        const hash =
                          location.hash.slice(1).trim().length > 0
                            ? location.hash.slice(1)
                            : 'all';

                        const pageParams = currentParams.getAll('page');

                        const newParams = pageParams.filter(
                          (param) => !param.startsWith(location.hash.slice(1)),
                        );

                        currentParams.delete('page');
                        newParams.forEach((newParam) =>
                          currentParams.append('page', newParam),
                        );
                        currentParams.append('page', `${hash}-${index + 1}`);

                        return {
                          pathname: location.pathname,
                          search: currentParams.toString(),
                          hash,
                        };
                      }}
                      aria-current="true"
                      isActive={(match, location) => {
                        if (!match) {
                          return false;
                        }
                        const pageParams = new URLSearchParams(
                          location.search,
                        ).getAll('page');

                        if (
                          !pageParams.some((param) =>
                            param.startsWith(location.hash.slice(1)),
                          )
                        ) {
                          return index + 1 === 1;
                        }

                        return new URLSearchParams(location.search)
                          .getAll('page')
                          .some(
                            (param) =>
                              param ===
                              `${location.hash.slice(1)}-${index + 1}`,
                          );
                      }}
                    >
                      {index + 1}
                    </NavLink>
                  </li>
                )}

                {isActive(index) &&
                  Math.ceil(
                    results[getHash('all') as ReferralTab]!.count /
                      data.pagination!,
                  ) -
                    (index + 1) >
                    1 &&
                  index + 1 > 5 && <li className="text-grey-500">...</li>}

                {!isActive(index) &&
                  Math.ceil(
                    results[activeTab.name]!.count / data.pagination!,
                  ) ===
                    index + 1 && (
                    <>
                      {getActivePage() < 6 &&
                        Math.ceil(
                          results[activeTab.name]!.count / data.pagination!,
                        ) > 6 && <li className="text-grey-500">...</li>}
                      <li>
                        <NavLink
                          className="flex pagination__link"
                          to={(location) => {
                            const currentParams = new URLSearchParams(
                              location.search,
                            );
                            const hash =
                              location.hash.slice(1).trim().length > 0
                                ? location.hash.slice(1)
                                : 'all';

                            const pageParams = currentParams.getAll('page');

                            const newParams = pageParams.filter(
                              (param) =>
                                !param.startsWith(location.hash.slice(1)),
                            );

                            currentParams.delete('page');
                            newParams.forEach((newParam) =>
                              currentParams.append('page', newParam),
                            );
                            currentParams.append(
                              'page',
                              `${hash}-${index + 1}`,
                            );

                            return {
                              pathname: location.pathname,
                              search: currentParams.toString(),
                              hash,
                            };
                          }}
                          aria-current="true"
                          isActive={() => false}
                        >
                          {index + 1}
                        </NavLink>
                      </li>
                    </>
                  )}
              </>
            ))}
            <li>
              <NavLink
                className={`flex pagination__link ${
                  isLastPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.nextPageTooltipText)}
                onClick={(event) => {
                  if (isLastPage()) {
                    event.preventDefault();
                  }
                }}
                to={(location) => {
                  const currentParams = new URLSearchParams(location.search);
                  const hash = getHash('all');
                  const pageParams = currentParams.getAll('page');
                  const newParams = pageParams.filter(
                    (param) => !param.startsWith(location.hash.slice(1)),
                  );
                  const tabParam = pageParams.filter((param) =>
                    param.startsWith(location.hash.slice(1)),
                  );

                  const pageNumber =
                    tabParam.length > 0
                      ? parseInt(tabParam[0].split('-')[1])
                      : 1;

                  currentParams.delete('page');
                  newParams.forEach((newParam) =>
                    currentParams.append('page', newParam),
                  );
                  currentParams.append('page', `${hash}-${pageNumber + 1}`);

                  return {
                    pathname: location.pathname,
                    search: currentParams.toString(),
                    hash,
                  };
                }}
                aria-current="true"
                isActive={() => false}
              >
                <ArrowDropRight className="w-6 h-6" />
              </NavLink>
            </li>
            <li>
              <NavLink
                className={`flex pagination__link ${
                  isLastPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.lastPageTooltipText)}
                onClick={(event) => {
                  if (isLastPage()) {
                    event.preventDefault();
                  }
                }}
                to={(location) => {
                  const currentParams = new URLSearchParams(location.search);
                  const hash = getHash('all');
                  const pageParams = currentParams.getAll('page');
                  const newPageParams = pageParams.filter(
                    (param) => !param.startsWith(hash),
                  );

                  currentParams.delete('page');
                  newPageParams.forEach((newParam) =>
                    currentParams.append('page', newParam),
                  );
                  currentParams.append(
                    'page',
                    `${hash}-${Math.ceil(
                      data[activeTab.name].count / data['pagination'],
                    )}`,
                  );

                  return {
                    pathname: location.pathname,
                    search: currentParams.toString(),
                    hash: location.hash,
                  };
                }}
                isActive={() => false}
              >
                <SkipRight className="w-5 h-5" />
              </NavLink>
            </li>
          </ul>
        )}
    </nav>
  );
};
