import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';
import { Referral, Topic } from '../types';
import { fetchOneWithAction } from './fetchOne';

// List
type UseTopicListActionOptions = UseMutationOptions<
  TopicListActionResponse,
  unknown,
  UseTopicListActionParams
>;

type TopicListActionResponse = Array<Topic>;

type UseTopicListActionParams = {
  referral: Referral;
};

export const useTopicLitesAction = (options?: UseTopicListActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<
    TopicListActionResponse,
    unknown,
    UseTopicListActionParams
  >(({ referral }) => topicLitesAction(referral), {
    ...options,
    onSuccess: (data, variables, context) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

export const topicLitesAction = (referral: Referral) => {
  return fetchOneWithAction({
    queryKey: ['referrals', String(referral.id), 'topics'],
  });
};
