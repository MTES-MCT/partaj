import { QueryFunction } from 'react-query';

import { appData } from 'appData';

export type FetchOneQueryKey = readonly [string, string];

/**
 * `react-query` fetcher for individual items from the Partaj API.
 */
export const fetchOne: QueryFunction<any, FetchOneQueryKey> = async ({
  queryKey,
}) => {
  const [name, id] = queryKey;
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get /${name}/${id}/.`);
  }

  return await response.json();
};

export type FetchOneWithActionQueryKey = readonly [string, string, string];

/**
 * `react-query` fetcher for individual items from the Partaj API.
 */
export const fetchOneWithAction: QueryFunction<
  any,
  FetchOneWithActionQueryKey
> = async ({ queryKey }) => {
  const [name, id, action] = queryKey;
  const response = await fetch(`/api/${name}/${id}/${action}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get /${name}/${id}/${action}.`);
  }

  return await response.json();
};
