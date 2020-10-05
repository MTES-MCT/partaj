import { Context } from 'types/context';

/**
 * `react-query` fetcher for individual items from the Partaj API.
 */
export const fetchOne = (context: Context) => async (
  name: string,
  id: string | number,
) => {
  const response = await fetch(`/api/${name}/${id}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(context.token ? { Authorization: `Token ${context.token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get /${name}/${id}/.`);
  }

  return await response.json();
};
