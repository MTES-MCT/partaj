import { useUIDSeed } from 'react-uid';
import { appData } from '../../appData';
import { defineMessages, FormattedMessage } from 'react-intl';
import React from 'react';
import * as types from '../../types';
import { ReferralState } from '../../types';

const messages = defineMessages({
  currentProgressItem: {
    defaultMessage: 'Current status:',
    description:
      'Accessible helper to mark out the current progress bar status in a non-visual way.',
    id: 'components.ProgressBarElement.currentProgressItem',
  },
  progressStep1: {
    defaultMessage: 'Referral sent',
    description:
        'Text for the first step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep1',
  },
  progressStep2: {
    defaultMessage: 'Unit <br></br> assigned',
    description:
        'Text for the second step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep2',
  },
  progressStep3: {
    defaultMessage: 'Member assigned',
    description:
        'Text for the third step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep3',
  },
  progressStep4: {
    defaultMessage: 'Currently processing',
    description:
        'Text for the fourth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep4',
  },
  progressStep5: {
    defaultMessage: 'Undergoing validation',
    description:
        'Text for the fifth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep5',
  },
  progressStep6: {
    defaultMessage: 'Answer sent',
    description:
        'Text for the sixth step in the referral progress bar for the requester.',
    id: 'components.ReferralDetail.progressStep6',
  },
});

const statusToNumber = {
  [types.ReferralState.DRAFT]: 1,
  [types.ReferralState.RECEIVED]: 2,
  [types.ReferralState.ASSIGNED]: 3,
  [types.ReferralState.PROCESSING]: 4,
  [types.ReferralState.IN_VALIDATION]: 5,
  [types.ReferralState.ANSWERED]: 6,
  [types.ReferralState.CLOSED]: 0,
  [types.ReferralState.INCOMPLETE]: 0,
};

type ProgressBarProps = React.PropsWithChildren<{
  status: ReferralState;
}>;

export const ProgressBar = ({ status }: ProgressBarProps) => {
  const seed = useUIDSeed();

  const statusAsProgressNumber = statusToNumber[status] || 0;
  console.log("PROGRESS BAR")
  console.log(statusAsProgressNumber)
  return (
    <>
      {statusAsProgressNumber > 0 && (
        <div className="mx-8">
          <ul className="progressbar">
            {[1, 2, 3, 4, 5, 6].map((position) => (
              <ProgressBarElement
                key={position}
                position={position}
                referralStatusAsNumber={statusAsProgressNumber}
              >
                <FormattedMessage
                  {...messages[
                    `progressStep${position}` as keyof typeof messages
                  ]}
                  values={{ br: (_: any) => <br /> }}
                />
              </ProgressBarElement>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

type ProgressBarElementProps = React.PropsWithChildren<{
  position: number;
  referralStatusAsNumber: number;
}>;

const ProgressBarElement = ({
  children,
  position,
  referralStatusAsNumber,
}: ProgressBarElementProps) => {
  const seed = useUIDSeed();

  return (
    <li
      className={`progressbar-element ${
        referralStatusAsNumber === position
          ? 'active'
          : referralStatusAsNumber > position
          ? 'done'
          : ''
      }`}
    >
      <div className="progressbar-circle">
        {referralStatusAsNumber === position ? (
          <svg
            role="img"
            className="w-3 h-3 fill-current"
            aria-labelledby={seed('current-progress-item')}
          >
            <title id={seed('current-progress-item')}>
              <FormattedMessage {...messages.currentProgressItem} />
            </title>
            <use xlinkHref={`${appData.assets.icons}#icon-tick`} />
          </svg>
        ) : null}
      </div>
      {children}
      {position > 1 ? <div className="progressbar-link" /> : null}
    </li>
  );
};
