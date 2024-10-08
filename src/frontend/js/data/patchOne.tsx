import { MutationFunction } from 'react-query';

import { appData } from '../appData';

export const patchOne: MutationFunction<
  any,
  { name: string; payload: any; id: string; action?: string }
> = async ({ name, payload, id, action }) => {
  const apiAction =
    typeof action === 'undefined' || !action ? '' : action + '/';
  console.log('apiAction');
  console.log(apiAction);

  const response = await fetch(`/api/${name}/${id}/${apiAction}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
    method: 'PATCH',
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
