import { stringify } from 'query-string';

import { appData } from 'appData';

/**
 * `react-query` fetcher for lists of items from the Partaj API.
 */
export const fetchList = async (
  name: string,
  queryParams: { [key: string]: string },
) => {
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
