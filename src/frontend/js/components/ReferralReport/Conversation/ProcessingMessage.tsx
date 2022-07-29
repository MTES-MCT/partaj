import React from 'react';
import { QueuedMessage } from '../../../types';
import { useAsyncEffect } from '../../../utils/useAsyncEffect';
import { Message } from './Message';
import { useCurrentUser } from '../../../data/useCurrentUser';
import { useCreateMessage } from '../../../data';

interface ProcessingMessageProps {
  onSuccess: (queuedMessage: QueuedMessage) => void;
  queuedMessage: QueuedMessage;
  url: string;
  queryKey: string;
}

export const ProcessingMessage = ({
  onSuccess,
  queuedMessage,
  url,
  queryKey,
}: ProcessingMessageProps) => {
  const mutation = useCreateMessage(url, queryKey);

  const { currentUser } = useCurrentUser();
  useAsyncEffect(async () => {
    mutation.mutate(queuedMessage.payload, {
      onSuccess: (data) => onSuccess({ ...queuedMessage, realId: data.id }),
    });
  }, []);

  return (
    <Message
      user={currentUser}
      isProcessing={true}
      message={queuedMessage.payload.content}
      attachments={
        queuedMessage.payload.files ? queuedMessage.payload.files : []
      }
    />
  );
};
