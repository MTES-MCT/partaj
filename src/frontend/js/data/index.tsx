import { QueryConfig, useQuery } from 'react-query';

import * as types from 'types';
import { fetchList } from './fetchList';
import { fetchOne } from './fetchOne';

export const useReferral = (
  referralId: number | string,
  queryConfig?: QueryConfig<types.Referral, unknown>,
) => {
  return useQuery<types.Referral>(
    ['referrals', referralId],
    fetchOne,
    queryConfig,
  );
};

type ReferralLitesResponse = types.APIList<types.ReferralLite>;
type UseReferralLitesParams =
  | { type: string }
  | { unit: string }
  | { user: string };
function isReferralLiteTypeRequest(
  params: UseReferralLitesParams,
): params is { type: string } {
  return !!(params as any).type;
}
export const useReferralLites = (
  params: UseReferralLitesParams,
  queryConfig?: QueryConfig<ReferralLitesResponse, unknown>,
) => {
  const key = isReferralLiteTypeRequest(params)
    ? [`referrallites/${params.type}`]
    : ['referrallites', params];
  return useQuery<ReferralLitesResponse, 'referrallites'>(
    key,
    fetchList,
    queryConfig,
  );
};

type ReferralActivityResponse = types.APIList<types.ReferralActivity>;
export const useReferralActivities = (
  referralId?: number | string,
  queryConfig?: QueryConfig<ReferralActivityResponse, unknown>,
) => {
  return useQuery<ReferralActivityResponse, 'referralactivities'>(
    ['referralactivities', { referral: referralId }],
    fetchList,
    queryConfig,
  );
};

export const useReferralAnswer = (
  answerId: number | string,
  queryConfig?: QueryConfig<types.ReferralAnswer, unknown>,
) => {
  return useQuery<types.ReferralAnswer>(
    ['referralanswers', answerId],
    fetchOne,
    queryConfig,
  );
};

type ReferralAnswersResponse = types.APIList<types.ReferralAnswer>;
type UseReferralAnswersParams = { referral: string };
export const useReferralAnswers = (
  params: UseReferralAnswersParams,
  queryConfig?: QueryConfig<ReferralAnswersResponse, unknown>,
) => {
  return useQuery<ReferralAnswersResponse, 'referralanswers'>(
    ['referralanswers', params],
    fetchList,
    queryConfig,
  );
};

type ReferralAnswerValidationRequestsResponse = types.APIList<
  types.ReferralAnswerValidationRequest
>;
export const useReferralAnswerValidationRequests = (
  answerId: number | string,
  queryConfig?: QueryConfig<ReferralAnswerValidationRequestsResponse, unknown>,
) => {
  return useQuery<
    ReferralAnswerValidationRequestsResponse,
    'referralanswervalidationrequests'
  >(
    ['referralanswervalidationrequests', { answer: answerId }],
    fetchList,
    queryConfig,
  );
};

type TopicsResponse = types.APIList<types.Topic>;
type UseTopicsParams = { unit: string };
export const useTopics = (
  params?: UseTopicsParams,
  queryConfig?: QueryConfig<TopicsResponse, unknown>,
) => {
  return useQuery<TopicsResponse, 'topics'>(
    !!params ? ['topics', params] : ['topics'],
    fetchList,
    queryConfig,
  );
};

export const useUnit = (
  unitId: string,
  queryConfig?: QueryConfig<types.Unit, unknown>,
) => {
  return useQuery<types.Unit>(['units', unitId], fetchOne, queryConfig);
};

type UnitMembershipsResponse = types.APIList<types.UnitMembership>;
type UseUnitMembershipsParams = { unit: string };
export const useUnitMemberships = (
  params: UseUnitMembershipsParams,
  queryConfig?: QueryConfig<UnitMembershipsResponse, unknown>,
) => {
  return useQuery<UnitMembershipsResponse, 'unitmemberships'>(
    ['unitmemberships', params],
    fetchList,
    queryConfig,
  );
};
