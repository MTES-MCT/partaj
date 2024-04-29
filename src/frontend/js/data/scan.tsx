import { appData } from 'appData';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import * as types from 'types';
import { sendForm } from 'utils/sendForm';
import { ErrorResponse } from 'types';

type UseScanFileError = ErrorResponse;
type UseScanFileData = [string, string | File | string[]][];

type UseScanFileOptions = UseMutationOptions<
  types.ScanFile,
  UseScanFileError,
  UseScanFileData
>;

export const useScanFile = (
  url: string,
  queryKey: string,
  options?: UseScanFileOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<types.ScanFile, UseScanFileError, UseScanFileData>(
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
