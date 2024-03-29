import React, { useEffect, useRef } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useUIDSeed } from 'react-uid';

const messages = defineMessages({
  messagesInputLabel: {
    defaultMessage: 'Send a message',
    description:
      'Accessible label for the chat input field in the referral detail view.',
    id: 'components.Conversation.messagesInputLabel',
  },
});

interface TextAreaProps {
  focus: boolean;
  messageContent: string;
  onChange: Function;
  opacitize?: boolean;
  submitForm?: Function;
  customCss: {
    container?: string;
    carbonCopy?: any;
  };
}

export const TextArea = ({
  messageContent,
  submitForm,
  onChange,
  opacitize,
  focus,
  customCss,
}: TextAreaProps) => {
  const seed = useUIDSeed();
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (focus) {
      (textAreaRef.current! as HTMLElement).focus();
    }
  }, [focus]);

  return (
    <div className={`flex-grow ${customCss?.container}`}>
      <div className="relative">
        {/* This div is used as a carbon copy of the textarea. It's a trick to auto-expand
            the actual textarea to fit its content. */}
        <div
          aria-hidden={true}
          className="user-content opacity-0 overflow-hidden"
          style={customCss?.carbonCopy ?? {}}
        >
          {messageContent}
          {/* Zero-width space to force line-breaks to actually occur even when there
              is no characted on the new line */}
          &#65279;
        </div>
        <div className="absolute inset-0">
          <label htmlFor={seed('tab-messages-text-input')} className="sr-only">
            <FormattedMessage {...messages.messagesInputLabel} />
          </label>
          <textarea
            id={seed('tab-messages-text-input')}
            className={`w-full h-full resize-none ${opacitize && 'opacity-25'}`}
            value={messageContent}
            ref={textAreaRef}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                submitForm &&
                event.shiftKey &&
                (event.key === 'Enter' || event.keyCode === 13)
              ) {
                event.preventDefault();
                if (messageContent.length > 0) {
                  submitForm();
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
