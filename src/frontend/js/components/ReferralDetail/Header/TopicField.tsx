import React, { useState, useContext } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useTopics, useReferralAction } from 'data';
import { useUIDSeed } from 'react-uid';
import { Spinner } from 'components/Spinner';
import { GenericErrorMessage } from 'components/GenericErrorMessage';
import { Referral } from 'types';
import { ReferralContext } from '../../../data/providers/ReferralProvider';
import { useClickOutside } from '../../../utils/useClickOutside';
const messages = defineMessages({
  exportReferral: {
    defaultMessage: 'Download the referral',
    description: 'Message for export button.',
    id: 'components.ReferralDetailContent.exportReferral',
  },
  loadingTopic: {
    defaultMessage: 'Loading urgency options...',
    description:
      'Accessible text for the spinner while loading urgency options in the referral form',
    id: 'components.ReferralForm.UrgencyField.loadingUrgencies',
  },
});

interface TopicFieldProps {
  referral: Referral;
  setShowSelect: (showSelect: boolean) => void;
}

export const TopicField: React.FC<TopicFieldProps> = ({
  referral,
  setShowSelect,
}) => {
  const { refetch } = useContext(ReferralContext);

  const { status, data } = useTopics({ unit: referral.topic.unit });
  const [newTopicId, setNewTopicId] = useState(referral.topic.id);

  const mutation = useReferralAction({
    onSuccess: (data) => {
      refetch();
      setShowSelect(false);
    },
  });

  const seed = useUIDSeed();
  const { ref } = useClickOutside({
    onClick: () => {
      setShowSelect(false);
    },
  });

  switch (status) {
    case 'error':
      return <GenericErrorMessage />;

    case 'idle':
    case 'loading':
      return (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingTopic} />
        </Spinner>
      );
    case 'success':
      return (
        <div ref={ref}>
          {newTopicId && (
            <select
              className="base-select pb-1  pt-1"
              id={seed('referral-new-topic')}
              name="topic"
              value={newTopicId}
              onChange={(e) => {
                setNewTopicId(e.target.value);

                mutation.mutate({
                  action: 'update_topic',
                  payload: {
                    topic: e.target.value,
                  },
                  referral,
                });
              }}
            >
              {data!.results.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {'\u00A0\u00A0\u00A0'
                    .repeat(topic.path.length / 4)
                    .concat(topic.name)}
                </option>
              ))}
            </select>
          )}
        </div>
      );
  }
};
