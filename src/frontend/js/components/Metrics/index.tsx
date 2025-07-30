import React from 'react';
import { useParams } from 'react-router-dom';

import { appData } from 'appData';
import { useTitle } from 'utils/useTitle';
import { useCurrentUser } from '../../data/useCurrentUser';
import { isAdmin } from '../../utils/user';

interface MetricsRouteParams {
  metrics: string;
}

export const Metrics = () => {
  useTitle('metrics');
  const { metrics } = useParams<MetricsRouteParams>();
  const { currentUser } = useCurrentUser();

  const src =
    metrics === 'metrics-daj'
      ? appData.metrics_daj_url
      : appData.metrics_users_url;

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
