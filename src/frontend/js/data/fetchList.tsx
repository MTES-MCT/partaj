import { stringify } from 'query-string';
import { QueryFunction } from 'react-query';

import { appData } from 'appData';

export type FetchListQueryKey = readonly [
  string,
  { [key: string]: string | string[] }?,
];

/**
 * `react-query` fetcher for lists of items from the Partaj API.
 */
export const fetchList: QueryFunction<any, FetchListQueryKey> = async ({
  queryKey,
}) => {
  const [name, queryParams] = queryKey;
  const response = await fetch(
    `/api/${name}/?${stringify({ ...queryParams, limit: 999 })}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get list of ${name}.`);
  }

  return await response.json();
};
