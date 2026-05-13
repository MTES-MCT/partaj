import React, { useEffect, useState } from 'react';
import { useDashboardContext } from './DashboardContext';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    setData(results);
  }, [results]);

  const buildPageTarget = (pageNumber: number) => {
    const currentParams = new URLSearchParams(location.search);
    const hash = getHash('all');
    const pageParams = currentParams.getAll('page');
    const newPageParams = pageParams.filter((param) => !param.startsWith(hash));
    currentParams.delete('page');
    newPageParams.forEach((newParam) => currentParams.append('page', newParam));
    currentParams.append('page', `${hash}-${pageNumber}`);
    return {
      pathname: location.pathname,
      search: currentParams.toString(),
      hash: location.hash,
    };
  };

  const goToPage = (pageNumber: number) =>
    navigate(buildPageTarget(pageNumber));

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
  const getPageNumber = (tab: ReferralTab) =>
    Math.ceil(data[tab].count / data.pagination);
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
        getPageNumber(activeTab.name) > 1 && (
          <ul className="flex space-x-2 items-center">
            <li>
              <button
                type="button"
                className={`flex pagination__link ${
                  isFirstPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.firstPageTooltipText)}
                disabled={isFirstPage()}
                onClick={() => {
                  if (!isFirstPage()) {
                    goToPage(1);
                  }
                }}
              >
                <SkipLeft className="w-5 h-5" />
              </button>
            </li>

            <li>
              <button
                type="button"
                className={`flex pagination__link ${
                  isFirstPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(
                  messages.previousPageTooltipText,
                )}
                disabled={isFirstPage()}
                onClick={() => {
                  if (!isFirstPage()) {
                    goToPage(getActivePage() - 1);
                  }
                }}
              >
                <ArrowDropLeft className="w-6 h-6" />
              </button>
            </li>
            {[...Array(getPageNumber(activeTab.name))].map(
              (_: any, index: number) => (
                <React.Fragment key={index}>
                  {isActive(index) && index > 5 && (
                    <li className="text-grey-500">...</li>
                  )}

                  {(isActive(index) || (index >= 0 && index < 5)) && (
                    <li>
                      <button
                        type="button"
                        className={`flex pagination__link${
                          isActive(index) ? ' active' : ''
                        }`}
                        aria-current={isActive(index) ? 'page' : undefined}
                        onClick={() => goToPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  )}

                  {isActive(index) &&
                    getPageNumber(activeTab.name) - (index + 1) > 1 &&
                    index + 1 > 5 && <li className="text-grey-500">...</li>}

                  {!isActive(index) &&
                    getPageNumber(activeTab.name) === index + 1 && (
                      <>
                        {getActivePage() < 6 &&
                          Math.ceil(getPageNumber(activeTab.name)) > 6 && (
                            <li className="text-grey-500">...</li>
                          )}

                        {Math.ceil(getPageNumber(activeTab.name)) > 6 && (
                          <li>
                            <button
                              type="button"
                              className="flex pagination__link"
                              onClick={() => goToPage(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        )}
                      </>
                    )}
                </React.Fragment>
              ),
            )}
            <li>
              <button
                type="button"
                className={`flex pagination__link ${
                  isLastPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.nextPageTooltipText)}
                disabled={isLastPage()}
                onClick={() => {
                  if (!isLastPage()) {
                    goToPage(getActivePage() + 1);
                  }
                }}
              >
                <ArrowDropRight className="w-6 h-6" />
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`flex pagination__link ${
                  isLastPage()
                    ? 'pagination__link_inactive'
                    : 'tooltip tooltip-action'
                }`}
                data-tooltip={intl.formatMessage(messages.lastPageTooltipText)}
                disabled={isLastPage()}
                onClick={() => {
                  if (!isLastPage()) {
                    goToPage(getPageNumber(activeTab.name));
                  }
                }}
              >
                <SkipRight className="w-5 h-5" />
              </button>
            </li>
          </ul>
        )}
    </nav>
  );
};
