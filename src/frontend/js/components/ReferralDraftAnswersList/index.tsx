import React, { useContext } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

import { CreateAnswerButton } from 'components/CreateAnswerButton';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { ReferralAnswerActions } from 'components/ReferralAnswerActions';
import { ReferralAnswerStatusBadge } from 'components/ReferralAnswerStatusBadge';
import { Spinner } from 'components/Spinner';
import { useReferral, useReferralAnswers } from 'data';
import { ReferralAnswerState } from 'types';
import { getUserFullname } from 'utils/user';
import { ReferralContext } from '../../data/providers/ReferralProvider';

const messages = defineMessages({
  emptyList: {
    defaultMessage: 'There are no draft answers for this referral yet.',
    description:
      'Message for the empty state of the referral draft answers list.',
    id: 'components.ReferralDraftAnswersList.emptyList',
  },
  loadingAnswers: {
    defaultMessage: 'Loading referral answers...',
    description:
      'Accessibility message for the spinner in the referral detail answers tab.',
    id: 'components.ReferralDraftAnswersList.loadingAnswers',
  },
  thActions: {
    defaultMessage: 'Actions',
    description:
      'Title for the column with actions in the referral draft answers list.',
    id: 'components.ReferralDraftAnswersList.thActions',
  },
  thAuthor: {
    defaultMessage: 'Author',
    description: 'Title for the table column with referral answer authors.',
    id: 'components.ReferralDraftAnswersList.thAuthor',
  },
  thDate: {
    defaultMessage: 'Date',
    description: 'Title for the table column with referral answer dates.',
    id: 'components.ReferralDraftAnswersList.thDate',
  },
  thStatus: {
    defaultMessage: 'Status',
    description: 'Title for the table column with referral answer statuses.',
    id: 'components.ReferralDraftAnswersList.thStatus',
  },
});

interface ReferralDraftAnswersListProps {
  getAnswerUrl: (answerId: string) => string;
  referralId: string;
}

export const ReferralDraftAnswersList: React.FC<ReferralDraftAnswersListProps> = ({
  getAnswerUrl,
  referralId,
}) => {
  const history = useHistory();
  const { url } = useRouteMatch();

  const { data: answersData, status: answersStatus } = useReferralAnswers({
    referral: referralId,
  });
  const { data: referral, status: referralStatus } = useReferral(referralId);

  if ([answersStatus, referralStatus].includes('error')) {
    return <GenericErrorMessage />;
  }

  if (
    [answersStatus, referralStatus].includes('idle') ||
    [answersStatus, referralStatus].includes('loading')
  ) {
    return (
      <Spinner size="large">
        <FormattedMessage {...messages.loadingAnswers} />
      </Spinner>
    );
  }

  return (
    <div
      className="border-2 border-gray-200 rounded-sm inline-block max-w-full"
      style={{ width: '60rem' }}
    >
      <table className="min-w-full relative" style={{ zIndex: 1 }}>
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thDate} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thAuthor} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thStatus} />
            </th>
            <th scope="col" className="p-3">
              <FormattedMessage {...messages.thActions} />
            </th>
          </tr>
        </thead>
        <tbody className="answers-list-table">
          {answersData!.count === 0 ? (
            <tr>
              <td colSpan={4} className="text-center space-y-4 py-16">
                <div>
                  <FormattedMessage {...messages.emptyList} />
                </div>
                <div>
                  <CreateAnswerButton
                    getAnswerUrl={(answerId) => `${url}/${answerId}/form`}
                    referral={referral!}
                  />
                </div>
              </td>
            </tr>
          ) : (
            answersData!.results
              // We're only showing draft answers here as the actual published answer is just a copy
              // of its corresponding draft answer.
              .filter((answer) => answer.state === ReferralAnswerState.DRAFT)
              .map((answer, index) => (
                <tr
                  key={answer.id}
                  className={`stretched-link-container cursor-pointer hover:bg-gray-300 relative ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                  }`}
                  // Each row should have a higher z-index than the following one so the dropdown
                  // can freely overflow onto the row below it.
                  style={{ zIndex: 9999 - index }}
                  onClick={(event) => {
                    // Link stretching does not work in Safari. JS has to take over to make rows clickable.
                    // Also make sure to not break the dropdown menu and answer sending modal as we do that.
                    if (
                      document
                        .querySelector('.answers-list-table')!
                        .contains(event.target as Node) &&
                      (!document.querySelector(`.answer-menu-${answer.id}`) ||
                        !document
                          .querySelector(`.answer-menu-${answer.id}`)!
                          .contains(event.target as Node))
                    ) {
                      history.push(getAnswerUrl(answer.id));
                    }
                  }}
                >
                  <td>
                    <Link
                      to={getAnswerUrl(answer.id)}
                      onClick={(e) => e.preventDefault()}
                    >
                      <FormattedDate
                        year="numeric"
                        month="numeric"
                        day="numeric"
                        value={answer.created_at}
                      />
                    </Link>
                  </td>
                  <td>
                    <div>{getUserFullname(answer.created_by)}</div>
                    <div className="text-gray-500">
                      {answer.created_by.unit_name}
                    </div>
                  </td>
                  <td>
                    <ReferralAnswerStatusBadge answer={answer} />
                  </td>
                  <td>
                    <div className={`answer-menu-${answer.id}`}>
                      <ReferralAnswerActions
                        answer={answer}
                        referral={referral!}
                      />
                    </div>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  );
};
