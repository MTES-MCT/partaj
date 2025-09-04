import React, { useEffect, useState } from 'react';
import { useDashboardContext } from './DashboardContext';
import { NavLink } from 'react-router-dom';
import { TaskParams } from '../../types';
import { ArrowDropLeft, ArrowDropRight, SkipLeft, SkipRight } from '../Icons';

export const Pagination: React.FC = () => {
  const {
    params,
    results,
    activeTab,
    activeFilters,
    paginate,
  } = useDashboardContext();

  const [pouet, setPouet] = useState<any>({});

  useEffect(() => {
    setPouet(results);
    results.hasOwnProperty(activeTab.name) &&
      console.log(Array(Math.floor(results[activeTab.name]!.count / 2)));
    results.hasOwnProperty(activeTab.name) &&
      console.log(results[activeTab.name]!.count);
  }, [results]);

  return (
    <nav role="navigation" aria-label="pagination">
      {pouet && pouet.hasOwnProperty(activeTab.name) && (Math.ceil(pouet[activeTab.name].count / 2) > 1) && (
        <ul className="flex space-x-2 items-center">
          <li className="pagination__link tooltip tooltip-info" data-tooltip={'Première page'}>
            <NavLink
              to={(location) => {
                const currentParams = new URLSearchParams(location.search);
                const hash =
                  location.hash.slice(1).trim().length > 0
                    ? location.hash.slice(1)
                    : 'all';
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
              <SkipLeft className="w-5 h-5"/>
            </NavLink>
          </li>

          <li className="pagination__link tooltip tooltip-info" data-tooltip={'Précédente'}>
            <NavLink
              to={(location) => {
                const currentParams = new URLSearchParams(location.search);
                const hash =
                  location.hash.slice(1).trim().length > 0
                    ? location.hash.slice(1)
                    : 'all';
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
          {[...Array(Math.ceil(pouet[activeTab.name].count / 2))].map(
            (_: any, index: any) => (
              <li>
                <NavLink
                  className="pagination__link"
                  to={(location) => {
                    const currentParams = new URLSearchParams(location.search);
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
                          param === `${location.hash.slice(1)}-${index + 1}`,
                      );
                  }}
                >
                  {index + 1}
                </NavLink>
              </li>
            ),
          )}
          <li className="pagination__link tooltip tooltip-info" data-tooltip={'Suivante'}>
            <NavLink
              to={(location) => {
                const currentParams = new URLSearchParams(location.search);
                const hash =
                  location.hash.slice(1).trim().length > 0
                    ? location.hash.slice(1)
                    : 'all';

                const pageParams = currentParams.getAll('page');

                const newParams = pageParams.filter(
                  (param) => !param.startsWith(location.hash.slice(1)),
                );

                const tabParam = pageParams.filter((param) =>
                  param.startsWith(location.hash.slice(1)),
                );

                const pageNumber =
                  tabParam.length > 0 ? parseInt(tabParam[0].split('-')[1]) : 1;

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
          <li className="pagination__link tooltip tooltip-info" data-tooltip={'Dernière page'}>
            <NavLink
              to={(location) => {
                const currentParams = new URLSearchParams(location.search);
                const hash =
                  location.hash.slice(1).trim().length > 0
                    ? location.hash.slice(1)
                    : 'all';
                const pageParams = currentParams.getAll('page');
                const newPageParams = pageParams.filter(
                  (param) => !param.startsWith(hash),
                );

                currentParams.delete('page');
                newPageParams.forEach((newParam) =>
                  currentParams.append('page', newParam),
                );
                currentParams.append('page', `${hash}-${Math.ceil(pouet[activeTab.name].count / 2)}`);

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
