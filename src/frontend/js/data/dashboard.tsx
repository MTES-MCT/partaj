import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList } from './fetchList';

// Filters
type UseSubFilterReferralListActionOptions = UseMutationOptions<
  any,
  unknown,
  UseSubFiltersReferralLitesActionParams
>;

type UseSubFiltersReferralLitesActionParams = {
  filter: string;
  query: string;
};

export const useFiltersReferralLites = (
  options?: UseSubFilterReferralListActionOptions,
) => {
  return useMutation<any, unknown, any>(() => filtersReferralLitesAction(), {
    onSuccess: (data, variables, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

export const filtersReferralLitesAction = () => {
  return fetchList({
    queryKey: ['referrallites/filters'],
  });
};
