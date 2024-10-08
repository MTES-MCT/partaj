import { useMutation, UseMutationOptions } from 'react-query';
import { Topic } from '../types';
import { fetchList } from './fetchList';

// API topics

/*
List all topics available for a draft referral
Accept a query parameters to search in topic names
*/
type UseTopicListOptions = UseMutationOptions<
  TopicListResponse,
  unknown,
  UseTopicListParams
>;

type TopicListResponse = {
  results: Array<Topic>;
};

type UseTopicListParams = {
  query: string;
};

export const useTopicList = (options?: UseTopicListOptions) => {
  return useMutation<TopicListResponse, unknown, UseTopicListParams>(
    ({ query }) => topicsAction({ query }),
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

export const topicsAction = (params: UseTopicListParams) => {
  return fetchList({
    queryKey: ['topics', params],
  });
};
