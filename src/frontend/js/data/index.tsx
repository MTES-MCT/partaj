import { QueryConfig, useQuery } from 'react-query';

import { APIList, Referral, ReferralActivity, ReferralAnswer } from 'types';
import { Context } from 'types/context';
import { fetchList } from './fetchList';
import { fetchOne } from './fetchOne';

export const useReferral = (
  context: Context,
  referralId: number | string,
  queryConfig?: QueryConfig<Referral, unknown>,
) => {
  return useQuery<Referral>(
    ['referrals', referralId],
    fetchOne(context),
    queryConfig,
  );
};

type ReferralActivityResponse = APIList<ReferralActivity>;
export const useReferralActivities = (
  context: Context,
  referralId?: number | string,
  queryConfig?: QueryConfig<ReferralActivityResponse, unknown>,
) => {
  return useQuery<ReferralActivityResponse, 'referralactivities'>(
    ['referralactivities', { referral: referralId }],
    fetchList(context),
    queryConfig,
  );
};

export const useReferralAnswer = (
  context: Context,
  answerId: number | string,
  queryConfig?: QueryConfig<ReferralAnswer, unknown>,
) => {
  return useQuery<ReferralAnswer>(
    ['referralanswers', answerId],
    fetchOne(context),
    queryConfig,
  );
};
