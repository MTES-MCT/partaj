import { useMutation, UseMutationOptions } from 'react-query';

import { createOne } from './createOne';
import { Referral, Topic } from '../types';
import { fetchOneWithAction } from './fetchOne';

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
