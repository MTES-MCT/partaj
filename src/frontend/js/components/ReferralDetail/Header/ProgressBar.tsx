import { useUIDSeed } from 'react-uid';
import { defineMessages, FormattedMessage } from 'react-intl';
import React from 'react';
import { ReferralState } from '../../../types';
import { appData } from '../../../appData';

const messages = defineMessages({
  currentProgressItem: {
    defaultMessage: 'Current status:',
    description:
      'Accessible helper to mark out the current progress bar status in a non-visual way.',
    id: 'components.ProgressBar.currentProgressItem',
  },
  progressStep1: {
    defaultMessage: 'Referral sent',
    description:
      'Text for the first step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep1',
  },
  progressStep2: {
    defaultMessage: 'Unit <br></br> assigned',
    description:
      'Text for the second step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep2',
  },
  progressStep3: {
    defaultMessage: 'Member assigned',
    description:
      'Text for the third step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep3',
  },
  progressStep4: {
    defaultMessage: 'Currently processing',
    description:
      'Text for the fourth step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep4',
  },
  progressStep5: {
    defaultMessage: 'Undergoing validation',
    description:
      'Text for the fifth step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep5',
  },
  progressStep6: {
    defaultMessage: 'Answer sent',
    description:
      'Text for the sixth step in the referral progress bar for the requester.',
    id: 'components.ProgressBar.progressStep6',
  },
});

const statusToNumber = {
  [ReferralState.DRAFT]: 1,
  [ReferralState.RECEIVED]: 2,
  [ReferralState.ASSIGNED]: 3,
  [ReferralState.PROCESSING]: 4,
  [ReferralState.IN_VALIDATION]: 5,
  [ReferralState.ANSWERED]: 6,
  [ReferralState.CLOSED]: 0,
  [ReferralState.SPLITTING]: -1,
  [ReferralState.RECEIVED_SPLITTING]: -1,
};

type ProgressBarProps = React.PropsWithChildren<{
  status: ReferralState;
}>;

export const ProgressBar = ({ status }: ProgressBarProps) => {
  const statusAsProgressNumber = statusToNumber[status] || 0;
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
                <span>
                  <FormattedMessage
                    {...messages[
                      `progressStep${position}` as keyof typeof messages
                    ]}
                    values={{ br: (_: any) => <br /> }}
                  />
                </span>
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
