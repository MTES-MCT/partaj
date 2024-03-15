import { appData } from 'appData';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { useUIDSeed } from 'react-uid';

interface Crumb {
  key: string;
  title: JSX.Element;
  url: string;
}

const BreadCrumbsContext = createContext<
  [Crumb[], React.Dispatch<React.SetStateAction<Crumb[]>>]
>([[], () => {}]);

export const BreadCrumbsProvider: React.FC = ({ children }) => {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  return (
    <BreadCrumbsContext.Provider value={[crumbs, setCrumbs]}>
      {children}
    </BreadCrumbsContext.Provider>
  );
};

export const BreadCrumbs: React.FC = () => {
  const [crumbs] = useContext(BreadCrumbsContext);

  const orderedCrumbs = crumbs.sort(
    (crumbA, crumbB) => crumbA.url.length - crumbB.url.length,
  );

  return (
    <ul className="flex flex-row py-4 space-x-3 px-8">
      {orderedCrumbs.map((crumb, index, list) => (
        <li key={crumb.key} className="flex flex-row items-center space-x-3">
          {index === list.length - 1 ? (
            <span>{crumb.title}</span>
          ) : (
            <>
              <Link to={crumb.url} className="underline hover:no-underline">
                {crumb.title}
              </Link>
              <span aria-hidden="true">
                <svg
                  role="presentation"
                  className={'fill-current block w-4 h-4 transform -rotate-90'}
                >
                  <use
                    xlinkHref={`${appData.assets.icons}#icon-chevron-thin-down`}
                  />
                </svg>
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

interface CrumbProps {
  title: Crumb['title'];
}

export const Crumb: React.FC<CrumbProps> = ({ title }) => {
  const seed = useUIDSeed();
  const { url } = useRouteMatch();
  const [_, setCrumbs] = useContext(BreadCrumbsContext);

  useEffect(() => {
    const key = seed(url);
    setCrumbs((crumbs) => [...crumbs, { key, title, url }]);

    return () => {
      setCrumbs((crumbs) =>
        crumbs.filter((currentCrumb) => currentCrumb.key !== key),
      );
    };
  }, []);

  return null;
};
