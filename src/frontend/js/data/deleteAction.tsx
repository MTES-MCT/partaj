import { MutationFunction } from 'react-query';
import { appData } from '../appData';

export const deleteAction: MutationFunction<
  any,
  {
    name: string;
    objectId: string;
  }
> = async ({ name, objectId }) => {
  const response = await fetch(`/api/${name}/${objectId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...(appData.token ? { Authorization: `Token ${appData.token}` } : {}),
    },
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw { code: 'invalid', ...response };
    }

    throw { code: 'exception' };
  }

  return response;
};
