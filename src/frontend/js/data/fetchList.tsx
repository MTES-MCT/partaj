import { Context } from 'types/context';

/**
 * `react-query` fetcher for lists of items from the Partaj API.
 */
export const fetchList = (context: Context) => async (name: string) => {
  const response = await fetch(`/api/${name}/?limit=999`, {
    headers: {
      'Content-Type': 'application/json',
      ...(context.token ? { Authorization: `Token ${context.token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get list of ${name}.`);
  }

  return await response.json();
};
