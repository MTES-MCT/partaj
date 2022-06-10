import * as Sentry from '@sentry/react';
import React from 'react';

import * as types from 'components/RichText/types';

const RichTextInline: React.FC<{ node: types.SerializablePMInlineNode }> = ({
  node,
}) => {
  switch (node.type) {
    case 'text':
      if (node.marks) {
        // Reduce is the practical way to extend our element as we iterated through marks, but Typescript
        // is incorrectly assuming the return value type matches the array elements' type, hence the assertions.
        return node.marks.reduce((content, mark) => {
          switch (mark.type) {
            case 'em':
              return <em>{content}</em>;

            case 'strong':
              return <strong>{content}</strong>;

            case 'underline':
              return <u>{content}</u>;
          }
        }, node.text as any) as unknown as JSX.Element;
      }

      return <React.Fragment>{node.text}</React.Fragment>;

    case 'hard_break':
      return <br />;

    default:
      Sentry.captureException(
        new Error(`Unknown inline PM node: ${node.type}`),
        { extra: { node: JSON.stringify(node) } },
      );
      return null;
  }
};

const renderInnerNodes = (node: types.SerializablePMBlockNode) =>
  node.content?.map((node, index) =>
    types.isBlockNode(node) ? (
      <RichTextBlock node={node} key={index} />
    ) : (
      <RichTextInline node={node} key={index} />
    ),
  );

const RichTextBlock: React.FC<{ node: types.SerializablePMBlockNode }> = ({
  node,
}) => {
  switch (node.type) {
    case 'blockquote':
      return <blockquote>{renderInnerNodes(node)}</blockquote>;

    case 'bullet_list':
      return <ul>{renderInnerNodes(node)}</ul>;

    case 'doc':
      // This should not happen, report an error but let it try to render as a paragraph
      Sentry.captureException(
        new Error(
          '"doc" received into <RichTextBlock />, invalid document structure',
        ),
        { extra: { node } },
      );

    case 'heading':
      const headingNode = node as types.SerializablePMHeadingNode;
      switch (headingNode.attrs.level) {
        case 1:
          return <h1>{renderInnerNodes(node)}</h1>;
        case 2:
          return <h2>{renderInnerNodes(node)}</h2>;
        case 3:
          return <h3>{renderInnerNodes(node)}</h3>;
        case 4:
          return <h4>{renderInnerNodes(node)}</h4>;
        case 5:
          return <h5>{renderInnerNodes(node)}</h5>;
        case 6:
          return <h6>{renderInnerNodes(node)}</h6>;
      }

    case 'list_item':
      return <li>{renderInnerNodes(node)}</li>;

    case 'ordered_list':
      return <ol>{renderInnerNodes(node)}</ol>;

    case 'paragraph':
      return <p>{renderInnerNodes(node)}</p>;

    default:
      Sentry.captureException(
        new Error(`Unknown block PM node: ${(node as any).type}`),
        { extra: { node: JSON.stringify(node) } },
      );
      return null;
  }
};

interface RichTextViewProps {
  content: string;
}

/**
 * Display rich text as serialized in the ProseMirror format.
 * If that fails to be parsed (as it should for legacy, simple-text fields), default to just wrapping
 * the text in a <p> and rendering it as-is.
 */
export const RichTextView: React.FC<RichTextViewProps> = ({ content }) => {
  try {
    const richContent: types.SerializableState = JSON.parse(content);
    return (
      <div className="user-content--rich-text">
        {richContent.doc.content?.map((node, index) => (
          <RichTextBlock node={node as any} key={index} />
        ))}
      </div>
    );
  } catch (e) {
    return <p className="user-content">{content}</p>;
  }
};
