import { useMutation, UseMutationOptions } from '@tanstack/react-query';

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
  return useMutation<any, unknown, any>({
    mutationFn: () => filtersReferralLitesAction(),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

export const filtersReferralLitesAction = () => {
  return fetchList({
    queryKey: ['referrallites/filters'],
    meta: undefined,
  } as any);
};
