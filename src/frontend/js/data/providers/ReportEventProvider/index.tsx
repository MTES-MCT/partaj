import * as Sentry from '@sentry/react';
import React, { ReactNode, useState } from 'react';

import { appData } from 'appData';
import { ReportEvent } from 'types';
import { useAsyncEffect } from 'utils/useAsyncEffect';

export const ReportEventsContext = React.createContext<{
  events: Array<ReportEvent>;
  refetch: any;
  setEvents: Function;
}>({
  setEvents: () => {
    return;
  },
  events: [],
  refetch: () => {
    return;
  },
});

export const ReportEventsProvider = ({
  children,
  reportId,
}: {
  children: ReactNode;
  reportId: string;
}) => {
  const [events, setEvents] = useState<Array<ReportEvent>>([]);
  const [update, setUpdate] = useState<number>(0);

  const refetch = () => {
    setUpdate((prev: number) => {
      return prev + 1;
    });
  };

  useAsyncEffect(async () => {
    const response = await fetch(`/api/reportevents/?report=${reportId}`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      Sentry.captureException(new Error('Failed to get report events.'), {
        extra: { code: response.status, body: response.body },
      });
      return;
    }
    const res = await response.json();
    setEvents(res.results);
  }, [update]);

  const { Provider } = ReportEventsContext;

  return <Provider value={{ events, refetch, setEvents }}>{children}</Provider>;
};
