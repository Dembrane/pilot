import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeAdmonitionType,
  CreateLink,
  ListsToggle,
  MDXEditor,
  MDXEditorProps,
  UndoRedo,
  directivesPlugin,
  headingsPlugin,
  linkDialogPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "./styles.css";

export function MarkdownWYSIWYG(props: MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        thematicBreakPlugin(),
        headingsPlugin(),
        quotePlugin(),
        linkDialogPlugin(),
        listsPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <ListsToggle options={["number", "bullet"]} />
              <BlockTypeSelect />
              <UndoRedo />
            </>
          ),
        }),
      ]}
      contentEditableClassName="prose min-h-[200px]"
      className="rounded border border-gray-200"
      {...props}
    />
  );
}
