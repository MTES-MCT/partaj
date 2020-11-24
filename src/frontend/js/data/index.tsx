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
