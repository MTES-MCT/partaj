import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';

import { fetchList, FetchListQueryParams } from './fetchList';
import { Topic } from '../types';

// List
type UseTopicListActionOptions = UseMutationOptions<
  TopicListActionResponse,
  unknown,
  UseTopicListActionParams
>;

type TopicListActionResponse = {
  results: Array<Topic>;
};

type UseTopicListActionParams = {
  unit: string;
};

export const useTopicLitesAction = (options?: UseTopicListActionOptions) => {
  const queryClient = useQueryClient();

  return useMutation<
    TopicListActionResponse,
    unknown,
    UseTopicListActionParams
  >(({ unit }) => topicLitesAction({ unit }), {
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries('topics');
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

export const topicLitesAction = (params: UseTopicListActionParams) => {
  return fetchList({
    queryKey: ['topics', params as FetchListQueryParams],
  });
};
