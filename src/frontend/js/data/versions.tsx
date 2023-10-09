import { appData } from 'appData';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { ErrorResponse } from 'types';

type UseUpdateVersionError = ErrorResponse;
type UseUpdateVersionData = [string, string | File | string[]][];

type UseUpdateVersionOptions = UseMutationOptions<
  types.ReferralReportVersion,
  UseUpdateVersionError,
  UseUpdateVersionData
>;

export const useUpdateVersion = (
  url: string,
  queryKey: string,
  options?: UseUpdateVersionOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralReportVersion,
    UseUpdateVersionError,
    UseUpdateVersionData
  >(
    (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: data,
        url,
        action: 'PUT',
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKey);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type UseAddVersionError = ErrorResponse;
type UseAddVersionData = [string, string | File | string[]][];

type UseAddVersionOptions = UseMutationOptions<
  types.ReferralReportVersion,
  UseAddVersionError,
  UseAddVersionData
>;

export const useAddVersion = (
  url: string,
  queryKey: string,
  options?: UseAddVersionOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralReportVersion,
    UseAddVersionError,
    UseAddVersionData
  >(
    (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: data,
        url,
        action: 'POST',
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(queryKey);
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};
