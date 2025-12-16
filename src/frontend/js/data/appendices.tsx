import { appData } from 'appData';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { ErrorResponse, ReferralReportAppendix } from 'types';
import { fetchOneWithAction } from './fetchOne';

type UseUpdateAppendixError = ErrorResponse;
type UseUpdateAppendixData = [string, string | File | string[]][];

type UseUpdateAppendixOptions = UseMutationOptions<
  types.ReferralReportAppendix,
  UseUpdateAppendixError,
  UseUpdateAppendixData
>;

export const useUpdateAppendix = (
  url: string,
  queryKey: string,
  options?: UseUpdateAppendixOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralReportAppendix,
    UseUpdateAppendixError,
    UseUpdateAppendixData
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

type UseAddAppendixError = ErrorResponse;
type UseAddAppendixData = [string, string | File | string[]][];

type UseAddAppendixOptions = UseMutationOptions<
  types.ReferralReportAppendix,
  UseAddAppendixError,
  UseAddAppendixData
>;

export const useAddAppendix = (
  url: string,
  queryKey: string,
  options?: UseAddAppendixOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    types.ReferralReportAppendix,
    UseAddAppendixError,
    UseAddAppendixData
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

type UseSubFiltersNoteLitesActionParams = {
  filter: string;
  query: string;
};

type UseAppendixValidatorsActionOptions = UseMutationOptions<
  any,
  unknown,
  UseSubFiltersNoteLitesActionParams
>;

export const useAppendixValidatorsAction = (
  options?: UseAppendixValidatorsActionOptions,
) => {
  return useMutation<any, unknown, any>(
    ({ appendix }) => appendixValidatorsAction(appendix),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const appendixValidatorsAction = (appendix: ReferralReportAppendix) => {
  return fetchOneWithAction({
    queryKey: ['referralreportappendices', appendix.id, 'get_validators'],
  });
};
