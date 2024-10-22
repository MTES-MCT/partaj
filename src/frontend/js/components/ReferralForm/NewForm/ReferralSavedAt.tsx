import React, { useContext, useEffect, useState } from 'react';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { CircleCheckIcon } from '../../Icons';
import { Text, TextType } from '../../text/Text';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  FormattedTime,
} from 'react-intl';

const messages = defineMessages({
  referralSaved: {
    defaultMessage: 'Saved {date} at {time}',
    description: 'Indicator to shown when referral is lastly saved',
    id: 'components.ReferralSavedAt.referralSaved',
  },
});
export const ReferralSavedAt: React.FC = () => {
  const { referral } = useContext(ReferralContext);
  const [lastUpdatedDateTime, setLastUpdatedDateTime] = useState<
    string | undefined
  >(referral?.updated_at);

  useEffect(() => {
    setLastUpdatedDateTime(referral?.updated_at);
  }, [referral]);

  return (
    <>
      {referral && (
        <div className="flex items-center space-x-1">
          <CircleCheckIcon className="fill-dsfr-success-500" />
          <Text
            type={TextType.SPAN_SMALL}
            className="text-dsfr-success-500"
            font="font-normal"
          >
            <FormattedMessage
              {...messages.referralSaved}
              values={{
                date: (
                  <FormattedDate
                    year="numeric"
                    month="numeric"
                    day="numeric"
                    value={lastUpdatedDateTime}
                  />
                ),
                time: <FormattedTime value={lastUpdatedDateTime} />,
              }}
            />
          </Text>
        </div>
      )}
    </>
  );
};
