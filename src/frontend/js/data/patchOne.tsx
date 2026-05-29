import { appData } from '../appData';

export const patchOne = async ({
  name,
  payload,
  id,
  action,
}: {
  name: string;
  payload: any;
  id: string;
  action?: string;
}): Promise<any> => {
  const apiAction =
    typeof action === 'undefined' || !action ? '' : action + '/';

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
      throw new Error({ code: 'invalid', ...(await response.json()) });
    }

    throw new Error({ code: 'exception', ...(await response.json()) });
  }

  return await response.json();
};
