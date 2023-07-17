import React from 'react';
import {
  DOMElementPosition,
  Message,
  ReferralLite,
  ReferralUserAction,
} from '../../types';
import { Nullable } from '../../types/utils';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useClickOutside } from '../../utils/useClickOutside';
import { appData } from '../../appData';
import { useMutation } from 'react-query';
import { Spinner } from '../Spinner';

const messages = defineMessages({
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text',
    id: 'components.SubscribeModal.cancel',
  },
});

export const APIRadioModal = ({
  referral,
  path,
  showModal,
  closeModal,
  onSuccess,
  onChange,
  title,
  items,
  value,
  size = '240',
  position = { top: 0, right: 0 },
  modalRef,
}: {
  path: string;
  referral: ReferralLite;
  showModal: boolean;
  closeModal: Function;
  onSuccess: Function;
  onChange: Function;
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

  const userAction = async (params: UserActionParams) => {
    const response = await fetch(`/api/${path}${params.action}/`, {
      headers: {
        Authorization: `Token ${appData.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        ...params.payload,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to call user API for referral action ${params.action}`,
      );
    }
    return await response.json();
  };

  const mutation = useMutation(
    (params: UserActionParams) => userAction(params),
    {
      onSuccess: (data, variables, context) => {
        onSuccess(data);
      },
      onError: (e) => {
        closeModal();
      },
    },
  );

  const { ref } = useClickOutside({
    ref: modalRef,
    onClick: () => {
      closeModal();
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
              onClick={() => closeModal()}
            >
              <FormattedMessage {...messages.cancel} />
            </div>
          </div>
          <div className="flex flex-col">
            {items.map((item) => (
              <label
                key={`key-${item.name}`}
                className={`p-1 border-t cursor-pointer ${
                  value === item.value && 'bg-purple-200'
                }`}
              >
                <div className="flex p-1 rounded hover:bg-selectHover">
                  {value === item.value && mutation.isLoading ? (
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
                        name={`name-${item.name}`}
                        aria-labelledby={`label-${item.name}`}
                        aria-describedby={`description-${item.name}`}
                        value={item.value}
                        checked={value === item.value}
                        onChange={(event) => {
                          onChange(event.target.value);
                          mutation.mutate(item);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex p-1">{item.icon}</div>
                  <div className="flex flex-col">
                    <div
                      id={`label-${item.name}`}
                      className="text-base text-primary-700"
                    >
                      {item.title}
                    </div>
                    <div
                      id={`description-${item.name}`}
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
