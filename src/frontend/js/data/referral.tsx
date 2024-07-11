import { useMutation, UseMutationOptions } from 'react-query';

import { createOne } from './createOne';

// Satisfaction action
type UseSatisfactionActionOptions = UseMutationOptions<
  any,
  unknown,
  UseSatisfactionActionParams
>;

type UseSatisfactionActionParams = {
  id: string;
  choice: number;
};

export const useSatisfactionAction = (
  url: string,
  options?: UseSatisfactionActionOptions,
) => {
  return useMutation<any, unknown, UseSatisfactionActionParams>(
    ({ id, choice }) => satisfactionAction({ id, choice, url }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const satisfactionAction = ({
  id,
  choice,
  url,
}: {
  id: string;
  choice: number;
  url: string;
}) => {
  return createOne({
    name: `referrals/${id}/${url}`,
    payload: {
      choice,
    },
  });
};
