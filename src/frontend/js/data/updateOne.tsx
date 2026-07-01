import { appData } from '../appData';
export const updateOne = async ({
  name,
  id,
  payload,
  action,
}: {
  name: string;
  payload: any;
  id: string;
  action?: string;
}): Promise<any> => {
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
      throw new Error({ code: 'invalid', ...(await response.json()) });
    }

    throw new Error({ code: 'exception', ...(await response.json()) });
  }

  return await response.json();
};
