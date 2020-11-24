import { appData } from 'appData';

/**
 * `react-query` fetcher for individual items from the Partaj API.
 */
export const fetchOne = async (name: string, id: string | number) => {
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
