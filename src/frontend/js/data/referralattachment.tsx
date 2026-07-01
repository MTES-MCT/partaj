import { appData } from 'appData';
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { ErrorResponse, ReferralAttachment } from 'types';

type UseUpdateVersionError = ErrorResponse;
type UseUpdateVersionData = [string, string | File | string[]][];

type UseUpdateVersionOptions = UseMutationOptions<
  types.ReferralAttachment,
  UseUpdateVersionError,
  UseUpdateVersionData
>;

export const useAddReferralAttachment = (options?: UseUpdateVersionOptions) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralAttachment,
    ErrorResponse,
    UseUpdateVersionData
  >({
    mutationFn: (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: data,
        url: '/api/referralattachments/',
        action: 'POST',
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ['referralattachments'] });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};
