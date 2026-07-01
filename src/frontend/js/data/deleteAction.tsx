import { appData } from '../appData';

export const deleteAction = async ({
  name,
  objectId,
}: {
  name: string;
  objectId: string;
}): Promise<any> => {
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
