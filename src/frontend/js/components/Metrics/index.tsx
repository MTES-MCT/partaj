import React from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAdmin } from '../../utils/user';
import { useTitle } from 'utils/useTitle';

interface MetricsRouteParams {
  metrics: string;
}

export const Metrics = () => {
  useTitle('metrics');
  const { metrics } = useParams<MetricsRouteParams>();
  const { currentUser } = useCurrentUser();
  let src = '';

  metrics === 'metrics-daj'
    ? (src =
        'https://metabase.partaj.incubateur.net/public/dashboard/4eea24ec-acb1-4dec-a283-e74377d8faae')
    : (src =
        'https://metabase.partaj.incubateur.net/public/dashboard/0a9b14f3-1a1c-421c-8510-9a9d372b7a83');
  return (
    <>
      {isAdmin(currentUser) && (
        <section className="container mx-auto flex-grow flex flex-col">
          <iframe
            src={src}
            frameBorder="0"
            width="1000"
            height="2300"
            allowTransparency
          ></iframe>
        </section>
      )}
    </>
  );
};
