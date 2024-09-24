import { useMutation, UseMutationOptions } from 'react-query';

import { createOne } from './createOne';
import { Referral, Topic } from '../types';
import { fetchOneWithAction } from './fetchOne';
import { patchOne } from './patchOne';
import { updateOne } from './updateOne';

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

// List all topics available for a sent referral
// Need a referral parameter
// /api/referrals/{referral_id}/topics
type UseReferralTopicListOptions = UseMutationOptions<
  ReferralTopicListResponse,
  unknown,
  UseReferralTopicListParams
>;

type ReferralTopicListResponse = Array<Topic>;

type UseReferralTopicListParams = {
  referral: Referral;
};

export const useReferralTopicsAction = (
  options?: UseReferralTopicListOptions,
) => {
  return useMutation<
    ReferralTopicListResponse,
    unknown,
    UseReferralTopicListParams
  >(({ referral }) => referralTopicsAction(referral), {
    ...options,
    onSuccess: (data, variables, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

export const referralTopicsAction = (referral: Referral) => {
  return fetchOneWithAction({
    queryKey: ['referrals', String(referral.id), 'topics'],
  });
};

type UseReferralPatchParams = Partial<Referral>;

type UseReferralOptions = UseMutationOptions<
  Referral,
  unknown,
  UseReferralPatchParams
>;

export const usePatchReferralAction = (
  options?: UseReferralOptions,
  action?: string,
) => {
  return useMutation<Referral, unknown, UseReferralPatchParams>(
    (referral) => patchReferralAction(referral, action),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const patchReferralAction = (
  referral: Partial<Referral>,
  action?: string,
) => {
  return patchOne({
    id: String(referral.id),
    name: 'referrals',
    action,
    payload: referral,
  });
};

type UseReferralSendParams = Partial<Referral>;

type UseReferralSendOptions = UseMutationOptions<
  Referral,
  unknown,
  UseReferralSendParams
>;

export const useSendReferralAction = (options?: UseReferralSendOptions) => {
  return useMutation<Referral, unknown, UseReferralPatchParams>(
    (referral) => sendReferralAction(referral),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

export const sendReferralAction = (referral: Partial<Referral>) => {
  return updateOne({
    name: 'referrals',
    id: String(referral.id),
    payload: {},
    action: 'send_new',
  });
};
