import { useMutation, UseMutationOptions } from 'react-query';

import { createOne } from './createOne';

// Request validation action
type UseRequestValidationActionOptions = UseMutationOptions<
  any,
  unknown,
  UseRequestValidationActionParams
>;

type UseRequestValidationActionParams = {
  version: string;
  comment: string;
  selectedOptions: Array<{ role: string; unitName: string }>;
};

export const useRequestValidationAction = (
  options?: UseRequestValidationActionOptions,
) => {
  return useMutation<any, unknown, UseRequestValidationActionParams>(
    ({ version, comment, selectedOptions }) =>
      requestValidationAction({ version, comment, selectedOptions }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const requestValidationAction = ({
  version,
  comment,
  selectedOptions,
}: {
  version: string;
  comment?: string;
  selectedOptions: Array<{ role: string; unitName: string }>;
}) => {
  return createOne({
    name: `referralreportversions/${version}/request_validation`,
    payload: {
      role: 'owner',
      comment: comment,
      selected_options: selectedOptions.map((selectedOption) => ({
        role: selectedOption.role,
        unit_name: selectedOption.unitName,
      })),
    },
  });
};

// Request validation action
type UseRequestValidationAppendixActionOptions = UseMutationOptions<
  any,
  unknown,
  UseRequestValidationAppendixActionParams
>;

type UseRequestValidationAppendixActionParams = {
  appendix: string;
  comment: string;
  selectedOptions: Array<{ role: string; unitName: string }>;
};

export const useRequestAppendixValidationAction = (
  options?: UseRequestValidationAppendixActionOptions,
) => {
  return useMutation<any, unknown, UseRequestValidationAppendixActionParams>(
    ({ appendix, comment, selectedOptions }) =>
      requestValidationAppendixAction({ appendix, comment, selectedOptions }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const requestValidationAppendixAction = ({
  appendix,
  comment,
  selectedOptions,
}: {
  appendix: string;
  comment?: string;
  selectedOptions: Array<{ role: string; unitName: string }>;
}) => {
  return createOne({
    name: `referralreportappendices/${appendix}/request_validation`,
    payload: {
      role: 'owner',
      comment: comment,
      selected_options: selectedOptions.map((selectedOption) => ({
        role: selectedOption.role,
        unit_name: selectedOption.unitName,
      })),
    },
  });
};

// Request change action
type UseRequestChangeActionOptions = UseMutationOptions<
  any,
  unknown,
  UseRequestChangeActionParams
>;

type UseRequestChangeActionParams = {
  version: string;
  comment: string;
};

export const useRequestChangeAction = (
  options?: UseRequestChangeActionOptions,
) => {
  return useMutation<any, unknown, UseRequestChangeActionParams>(
    ({ version, comment }) => requestChangeAction({ version, comment }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const requestChangeAction = ({
  version,
  comment,
}: {
  version: string;
  comment: string;
}) => {
  return createOne({
    name: `referralreportversions/${version}/request_change`,
    payload: {
      comment,
    },
  });
};

// Request change appendix action
type UseRequestChangeAppendixActionOptions = UseMutationOptions<
  any,
  unknown,
  UseRequestChangeAppendixActionParams
>;

type UseRequestChangeAppendixActionParams = {
  appendix: string;
  comment: string;
};

export const useRequestChangeAppendixAction = (
  options?: UseRequestChangeAppendixActionOptions,
) => {
  return useMutation<any, unknown, UseRequestChangeAppendixActionParams>(
    ({ appendix, comment }) =>
      requestChangeAppendixAction({ appendix, comment }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const requestChangeAppendixAction = ({
  appendix,
  comment,
}: {
  appendix: string;
  comment: string;
}) => {
  return createOne({
    name: `referralreportappendices/${appendix}/request_change`,
    payload: {
      comment,
    },
  });
};

// Validate action
type UseValidateActionOptions = UseMutationOptions<
  any,
  unknown,
  UseValidateActionParams
>;

type UseValidateActionParams = {
  version: string;
  comment: string;
};

export const useValidateAction = (options?: UseValidateActionOptions) => {
  return useMutation<any, unknown, UseValidateActionParams>(
    ({ version, comment }) => validateAction({ version, comment }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

// Validate action
type UseValidateAppendixActionOptions = UseMutationOptions<
  any,
  unknown,
  UseValidateAppendixActionParams
>;

type UseValidateAppendixActionParams = {
  appendix: string;
  comment: string;
};

export const useValidateAppendixAction = (
  options?: UseValidateAppendixActionOptions,
) => {
  return useMutation<any, unknown, UseValidateAppendixActionParams>(
    ({ appendix, comment }) => validateAppendixAction({ appendix, comment }),
    {
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const validateAction = ({
  version,
  comment,
}: {
  version: string;
  comment: string;
}) => {
  return createOne({
    name: `referralreportversions/${version}/validate`,
    payload: {
      comment,
    },
  });
};

export const validateAppendixAction = ({
  appendix,
  comment,
}: {
  appendix: string;
  comment: string;
}) => {
  return createOne({
    name: `referralreportappendices/${appendix}/validate`,
    payload: {
      comment,
    },
  });
};
