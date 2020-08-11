import React, { useEffect, useRef } from 'react';

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

interface RichTextFieldProps {
  enableHeadings?: boolean;
  onChange: (event: {
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
  enableHeadings = false,
  onChange,
}) => {
  const contentEditable = useRef(null as Nullable<HTMLDivElement>);

  useEffect(() => {
    // Mix the nodes from prosemirror-schema-list into the basic schema to
    // create a schema with list support.

    const chosenSchema = enableHeadings
      ? richTextSchemaWithHeadings
      : richTextSchema;
    const editorView = new EditorView(contentEditable.current, {
      state: EditorState.create({
        schema: chosenSchema,
        plugins: exampleSetup({ schema: chosenSchema }),
      }),
    });

    const pollRef = { current: '' };
    const pollForChange = setInterval(() => {
      if (editorView.state.doc.textContent !== pollRef.current) {
        onChange({
          data: {
            textContent: editorView.state.doc.textContent,
            serializableState: editorView.state.toJSON(),
          },
        });
        pollRef.current = editorView.state.doc.textContent;
      }
    }, 1000);

    return () => {
      clearInterval(pollForChange);
    };
  }, []);

  return <div className="form-control" ref={contentEditable} />;
};
