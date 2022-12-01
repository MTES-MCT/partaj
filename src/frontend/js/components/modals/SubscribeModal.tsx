import React, { useEffect, useState } from 'react';
import {
  NotificationType,
  ReferralLite,
  Requester,
  RequesterAction,
  User,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useClickOutside } from '../../utils/useClickOutside';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';
import {
  NotificationAllIcon,
  NotificationNoneIcon,
  NotificationRestrictedIcon,
  QuitIcon,
} from '../Icons';

const messages = defineMessages({
  modalTitle: {
    defaultMessage: 'Choose your notifications',
    description: 'Modal title',
    id: 'components.SubscribeModal.modalTitle',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.SubscribeModal.cancel',
  },
  noneTitle: {
    defaultMessage: 'None',
    description: 'None item title',
    id: 'components.SubscribeModal.noneTitle',
  },
  allTitle: {
    defaultMessage: 'All',
    description: 'All item title',
    id: 'components.SubscribeModal.allTitle',
  },
  restrictedTitle: {
    defaultMessage: 'Restricted',
    description: 'Restricted item title',
    id: 'components.SubscribeModal.restrictedTitle',
  },
  noneDescription: {
    defaultMessage: "You won't receive any notifications from this referral.",
    description: 'None item description',
    id: 'components.SubscribeModal.noneDescription',
  },
  allDescription: {
    defaultMessage:
      'You will receive all event notifications from this referral',
    description: 'All item description',
    id: 'components.SubscribeModal.allDescription',
  },
  restrictedDescription: {
    defaultMessage:
      'You will only receive essential notifications from this referral',
    description: 'Restricted text description',
    id: 'components.SubscribeModal.restrictedDescription',
  },
  deleteText: {
    defaultMessage: 'Remove me from this referral',
    description: 'Referral removal button text',
    id: 'components.SubscribeModal.deleteText',
  },
});

export const SubscribeModal = ({
  user,
  referral,
  showModal,
  setShowModal,
  onSuccess,
}: {
  user: Nullable<User>;
  referral: ReferralLite;
  showModal: boolean;
  setShowModal: Function;
  onSuccess: Function;
}) => {
  type RequesterActionParams = {
    notifications?: Nullable<NotificationType>;
    action: RequesterAction;
  };

  const requesterAction = async (params: RequesterActionParams) => {
    const response = await fetch(
      `/api/referrals/${referral.id}/${params.action}/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          requester: user!.id,
          notifications: params.notifications,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to add_requester the referral ${referral.id} for user ${
          user!.id
        }`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(
    (params: RequesterActionParams) => requesterAction(params),
    {
      onSuccess: (data, variables, context) => {
        setShowModal(false);
        onSuccess(data);
      },
      onError: (data) => {
        setShowModal(false);
      },
    },
  );

  const { ref } = useClickOutside(() => {
    setShowModal(false);
  });

  const getSubscriptionType = (
    referral: ReferralLite,
    user: Nullable<User>,
  ) => {
    const requester =
      user &&
      referral &&
      referral.requesters.find(
        (requester: Requester) => requester.user_id === user.id,
      );

    return requester ? requester.notifications : null;
  };

  const [subscriptionType, setSubscriptionType] = useState(
    getSubscriptionType(referral, user),
  );

  useEffect(() => {
    setSubscriptionType(getSubscriptionType(referral, user));
  }, [referral, user]);

  return (
    <>
      {referral && user && (
        <div
          ref={ref}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            e.stopPropagation();
          }}
          className={`flex flex-col border absolute right-0 top-0 z-20 bg-white shadow-2xl rounded ${
            showModal ? 'block' : 'hidden'
          }`}
        >
          <div className="flex justify-between items-center p-2 cursor-default">
            <span className="modal-title text-primary-200 whitespace-no-wrap hover:cursor-default">
              <FormattedMessage {...messages.modalTitle} />
            </span>
            <div
              role="button"
              className="text-sm hover:underline"
              onClick={() => setShowModal(false)}
            >
              <FormattedMessage {...messages.cancel} />
            </div>
          </div>
          <div className="flex flex-col">
            <label
              className={`p-1 border-t cursor-pointer ${
                subscriptionType === NotificationType.ALL && 'bg-purple-200'
              }`}
            >
              <div className="flex p-1 rounded hover:bg-gray-200">
                {subscriptionType === NotificationType.ALL &&
                mutation.isLoading ? (
                  <div className="flex items-center w-4">
                    <Spinner size="small" color="#8080D1" className="inset-0" />
                  </div>
                ) : (
                  <div className="flex items-center w-4">
                    <input
                      type="radio"
                      name={`notifications-${referral.id}`}
                      aria-labelledby={`label-${referral.id}-all`}
                      aria-describedby={`description-${referral.id}-all`}
                      value={'A'}
                      checked={subscriptionType === 'A'}
                      onChange={(event) => {
                        setSubscriptionType(
                          event.target.value as NotificationType,
                        );
                        mutation.mutate({
                          notifications: NotificationType.ALL,
                          action: RequesterAction.ADD_REQUESTER,
                        });
                      }}
                    />
                  </div>
                )}
                <div className="flex p-1">
                  <NotificationAllIcon color="black" />
                </div>
                <div className="flex flex-col min-w-240">
                  <div
                    id={`label-${referral.id}-all`}
                    className="text-base text-primary-700"
                  >
                    <FormattedMessage {...messages.allTitle} />
                  </div>
                  <div
                    id={`description-${referral.id}-restricted`}
                    className="text-sm text-gray-500"
                  >
                    <FormattedMessage {...messages.allDescription} />
                  </div>
                </div>
              </div>
            </label>
            <label
              className={`p-1 border-t cursor-pointer ${
                subscriptionType === NotificationType.RESTRICTED &&
                'bg-purple-200'
              }`}
            >
              <div className="flex p-1 rounded hover:bg-gray-200">
                {subscriptionType === NotificationType.RESTRICTED &&
                mutation.isLoading ? (
                  <div className="flex items-center w-4">
                    <Spinner size="small" color="#8080D1" className="inset-0" />
                  </div>
                ) : (
                  <div className="flex items-center w-4">
                    <input
                      type="radio"
                      name={`notifications-${referral.id}`}
                      aria-labelledby={`label-${referral.id}-restricted`}
                      aria-describedby={`description-${referral.id}-restricted`}
                      value={'R'}
                      checked={subscriptionType === 'R'}
                      onChange={(event) => {
                        setSubscriptionType(
                          event.target.value as NotificationType,
                        );
                        mutation.mutate({
                          notifications: NotificationType.RESTRICTED,
                          action: RequesterAction.ADD_REQUESTER,
                        });
                      }}
                    />
                  </div>
                )}
                <div className="flex p-1">
                  <NotificationRestrictedIcon color="black" />
                </div>
                <div className="flex flex-col min-w-240">
                  <div
                    id={`label-${referral.id}-restricted`}
                    className="text-base text-primary-700"
                  >
                    <FormattedMessage {...messages.restrictedTitle} />
                  </div>
                  <div
                    id={`description-${referral.id}-restricted`}
                    className="text-sm text-gray-500"
                  >
                    <FormattedMessage {...messages.restrictedDescription} />
                  </div>
                </div>
              </div>
            </label>
            <label
              className={`p-1 border-t cursor-pointer ${
                subscriptionType === NotificationType.NONE && 'bg-purple-200'
              }`}
            >
              <div className="flex p-1 rounded hover:bg-gray-200">
                {subscriptionType === NotificationType.NONE &&
                mutation.isLoading ? (
                  <div className="flex items-center w-4">
                    <Spinner size="small" color="#8080D1" className="inset-0" />
                  </div>
                ) : (
                  <div className="flex items-center w-4">
                    <input
                      type="radio"
                      value={'N'}
                      name={`notifications-${referral.id}`}
                      aria-labelledby={`label-${referral.id}-none`}
                      aria-describedby={`description-${referral.id}-none`}
                      checked={subscriptionType === 'N'}
                      onChange={(event) => {
                        setSubscriptionType(
                          event.target.value as NotificationType,
                        );
                        mutation.mutate({
                          notifications: NotificationType.NONE,
                          action: RequesterAction.ADD_REQUESTER,
                        });
                      }}
                    />
                  </div>
                )}
                <div className="flex p-1">
                  <NotificationNoneIcon color="black" />
                </div>
                <div className="flex flex-col min-w-240">
                  <div
                    id={`label-${referral.id}-none`}
                    className="text-base text-primary-700"
                  >
                    <FormattedMessage {...messages.noneTitle} />
                  </div>
                  <span
                    id={`description-${referral.id}-none`}
                    className="text-sm text-gray-500"
                  >
                    <FormattedMessage {...messages.noneDescription} />
                  </span>
                </div>
              </div>
            </label>
          </div>
          {referral && subscriptionType && referral.state != 'answered' && (
            <div
              role="button"
              className="p-2 cursor-pointer justify-center items-center flex w-full border-t hover:bg-gray-200"
              onClick={() => {
                setSubscriptionType(null);
                mutation.mutate({ action: RequesterAction.REMOVE_REQUESTER });
              }}
            >
              <QuitIcon />
              <span className="pl-2">
                <FormattedMessage {...messages.deleteText} />
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
