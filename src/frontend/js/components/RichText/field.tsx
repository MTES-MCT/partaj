import React, { HTMLProps, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

// @ts-ignore
import { EditorState } from 'prosemirror-state';
// @ts-ignore
import { EditorView } from 'prosemirror-view';
// @ts-ignore
import { Schema } from 'prosemirror-model';
// @ts-ignore
import { addListNodes } from 'prosemirror-schema-list';

import { SerializableState } from 'components/RichText/types';
import { Nullable } from 'types/utils';
// @ts-ignore
import { exampleSetup } from './example-setup';
// @ts-ignore
import { schema, schemaWithHeadings } from './schema-basic';

interface RichTextFieldProps
  extends Omit<HTMLProps<HTMLDivElement>, 'onChange'> {
  'aria-labelledby'?: string;
  enableHeadings?: boolean;
  initialContent?: string;
  onChange: (event: {
    cause: 'CHANGE' | 'INIT';
    data: { textContent: string; serializableState: SerializableState };
  }) => unknown;
}

const richTextSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
});

const richTextSchemaWithHeadings = new Schema({
  nodes: addListNodes(
    schemaWithHeadings.spec.nodes,
    'paragraph block*',
    'block',
  ),
  marks: schema.spec.marks,
});

export const RichTextField: React.FC<RichTextFieldProps> = ({
  'aria-labelledby': arialabelledBy,
  enableHeadings = false,
  initialContent,
  onChange,
  ...props
}) => {
  const intl = useIntl();
  const contentEditable = useRef(null as Nullable<HTMLDivElement>);

  useEffect(() => {
    // Mix the nodes from prosemirror-schema-list into the basic schema to
    // create a schema with list support.
    const chosenSchema = enableHeadings
      ? richTextSchemaWithHeadings
      : richTextSchema;
    const editorStateConfig = {
      schema: chosenSchema,
      plugins: exampleSetup({ schema: chosenSchema }, intl),
    };
    const editorView = new EditorView(contentEditable.current, {
      state: initialContent
        ? EditorState.fromJSON(editorStateConfig, JSON.parse(initialContent))
        : EditorState.create(editorStateConfig),
    });

    // Immediately send the loaded data, allowing parent components to update themselves with the
    // decoded PM state & textual content
    onChange({
      cause: 'INIT',
      data: {
        textContent: editorView.state.doc.textContent,
        serializableState: editorView.state.toJSON(),
      },
    });

    const pollRef = { current: 0 };
    const pollForChange = setInterval(() => {
      if (editorView.state.history$.prevTime !== pollRef.current) {
        onChange({
          cause: 'CHANGE',
          data: {
            textContent: editorView.state.doc.textContent,
            serializableState: editorView.state.toJSON(),
          },
        });
        pollRef.current = editorView.state.history$.prevTime;
      }
    }, 200);

    return () => {
      clearInterval(pollForChange);
    };
  }, []);

  return (
    <div
      className="form-control"
      ref={contentEditable}
      role="textbox"
      aria-labelledby={arialabelledBy}
      {...props}
    />
  );
};
