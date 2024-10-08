import { MutationFunction } from 'react-query';

import { appData } from '../appData';
import { actions } from 'xstate';

export const updateOne: MutationFunction<
  any,
  { name: string; payload: any; id: string; action?: string }
> = async ({ name, id, payload, action }) => {
  const apiAction = action ? action + '/' : '';
  const response = await fetch(`/api/${name}/${id}/` + apiAction, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
    method: 'PUT',
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
