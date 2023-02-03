import React, { useEffect, useState } from 'react';
import {
  DOMElementPosition,
  Message,
  ReferralLite,
  ReferralUserAction,
  UserLite,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useClickOutside } from '../../utils/useClickOutside';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  allTitle: {
    defaultMessage: 'All',
    description: 'All item title',
    id: 'components.SubscribeModal.allTitle',
  },
  allDescription: {
    defaultMessage:
      'You will receive all event notifications from this referral',
    description: 'All item description',
    id: 'components.SubscribeModal.allDescription',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.SubscribeModal.cancel',
  },
  deleteText: {
    defaultMessage: 'Remove me from this referral',
    description: 'Referral removal button text',
    id: 'components.SubscribeModal.deleteText',
  },
});

export const APIRadioModal = ({
  referral,
  showModal,
  setShowModal,
  onSuccess,
  title,
  items,
  value,
  size = '240',
  position = { top: 0, right: 0 },
  modalRef,
}: {
  referral: ReferralLite;
  showModal: boolean;
  setShowModal: Function;
  onSuccess: Function;
  title: Message;
  value: Nullable<string>;
  items: Array<any>;
  size?: string;
  position?: DOMElementPosition;
  modalRef?: any;
}) => {
  type UserActionParams = {
    action: ReferralUserAction;
    payload: any;
  };

  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const userAction = async (params: UserActionParams) => {
    const response = await fetch(
      `/api/referrals/${referral.id}/${params.action}/`,
      {
        headers: {
          Authorization: `Token ${appData.token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          ...params.payload,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to call user API for referral ${referral.id} and action ${params.action}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(
    (params: UserActionParams) => userAction(params),
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

  const { ref } = useClickOutside({
    ref: modalRef,
    onClick: () => {
      setShowModal(false);
    },
  });

  return (
    <>
      {referral && (
        <div
          ref={ref}
          onClick={(e) => {
            /* stopPropagation is used to avoid redirection if the button is nested inside a link */
            e.stopPropagation();
          }}
          className={`${
            showModal ? 'block' : 'hidden'
          } flex flex-col border fixed z-30 bg-white shadow-2xl rounded  max-w-${
            size ?? '240'
          }`}
          style={position}
        >
          <div className="flex justify-between items-center p-2 cursor-default">
            <span className="modal-title text-primary-200 whitespace-no-wrap hover:cursor-default">
              <FormattedMessage {...title} />
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
            {items.map((item) => (
              <label
                key={`${item.name}-${referral.id}`}
                className={`p-1 border-t cursor-pointer ${
                  currentValue === item.value && 'bg-purple-200'
                }`}
              >
                <div className="flex p-1 rounded hover:bg-selectHover">
                  {currentValue === item.value && mutation.isLoading ? (
                    <div className="flex items-center w-4">
                      <Spinner
                        size="small"
                        color="#8080D1"
                        className="inset-0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center w-4">
                      <input
                        type="radio"
                        name={`${item.name}-${referral.id}`}
                        aria-labelledby={`label-${referral.id}-${item.name}`}
                        aria-describedby={`description-${referral.id}-${item.name}`}
                        value={item.value}
                        checked={currentValue === item.value}
                        onChange={(event) => {
                          setCurrentValue(event.target.value);
                          mutation.mutate(item);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex p-1">{item.icon}</div>
                  <div className="flex flex-col">
                    <div
                      id={`label-${referral.id}-${item.name}`}
                      className="text-base text-primary-700"
                    >
                      {item.title}
                    </div>
                    <div
                      id={`description-${referral.id}-restricted`}
                      className="text-sm text-gray-500"
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
