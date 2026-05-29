import { appData } from '../appData';

export const detailAction = async ({
  action,
  name,
  objectId,
  payload,
}: {
  name: string;
  action: string;
  objectId: string;
  payload: { [key: string]: any };
}): Promise<any> => {
  const response = await fetch(`/api/${name}/${objectId}/${action}/`, {
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
