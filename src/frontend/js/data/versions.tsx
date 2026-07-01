import { appData } from 'appData';
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { ErrorResponse, ReferralReportVersion } from 'types';
import { fetchOneWithAction } from './fetchOne';

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
  >({
    mutationFn: (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: data,
        url,
        action: 'PUT',
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
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
  >({
    mutationFn: (data) =>
      sendForm({
        headers: { Authorization: `Token ${appData.token}` },
        keyValuePairs: data,
        url,
        action: 'POST',
      }),
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

type UseSubFiltersNoteLitesActionParams = {
  filter: string;
  query: string;
};

type UseVersionValidatorsActionOptions = UseMutationOptions<
  any,
  unknown,
  UseSubFiltersNoteLitesActionParams
>;

export const useVersionValidatorsAction = (
  options?: UseVersionValidatorsActionOptions,
) => {
  return useMutation<any, unknown, any>({
    mutationFn: ({ version }) => versionValidatorsAction(version),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, onMutateResult, context);
      }
    },
  });
};

export const versionValidatorsAction = (version: ReferralReportVersion) => {
  return fetchOneWithAction({
    queryKey: ['referralreportversions', version.id, 'get_validators'],
    meta: undefined,
  } as any);
};
