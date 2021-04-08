import { MutationFunction } from 'react-query';

import { appData } from '../appData';

export const createOne: MutationFunction<
  any,
  { name: string; payload: any }
> = async ({ name, payload }) => {
  const response = await fetch(`/api/${name}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...(await response.json()) };
    }

    throw { code: 'exception' };
  }

  return await response.json();
};
