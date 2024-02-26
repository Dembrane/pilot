import {
  Stack,
  Title,
  Text,
  Accordion,
  Loader,
  Group,
  Box,
  Skeleton,
  Tooltip,
  Textarea,
  Button,
  LoadingOverlay,
  ActionIcon,
} from "@mantine/core";
import {
  useDeleteDocument,
  useDocuments,
  useUpdateDocument,
} from "../lib/query";
import { PropsWithChildren, useState } from "react";
import { Icons } from "../icons";
import { DropzoneUploadDocuments } from "./Message";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "./Toaster";
import { Link } from "react-router-dom";

const DocumentSkeleton = () => (
  <Stack>
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} height={60} radius="md" />
    ))}
  </Stack>
);

export const DocumentPanel = () => {
  const { data, isLoading } = useDocuments();

  const [parent] = useAutoAnimate();

  return (
    <Stack p="sm" ref={parent}>
      <Group justify="space-between">
        <Title order={2}>Documents</Title>
        <Tooltip label="Upload documents">
          <div>
            <DropzoneUploadDocuments>
              <Icons.Plus />
            </DropzoneUploadDocuments>
          </div>
        </Tooltip>
      </Group>

      {isLoading ? (
        <DocumentSkeleton />
      ) : (
        <DocumentAccordion documents={data ?? []} />
      )}
    </Stack>
  );
};

const UpdateDocumentContextInput = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  const [context, setContext] = useState(document.context);
  const updateDocumentMutation = useUpdateDocument();

  const handleSave = () => {
    updateDocumentMutation.mutate({
      document,
      update: {
        context,
      },
    });
  };

  const handleCancel = () => {
    setContext(document.context);
  };

  return (
    <Stack gap="xs">
      <Text size="sm">Add context to document</Text>
      <Stack gap="xs" pos="relative">
        <LoadingOverlay visible={updateDocumentMutation.isPending} />
        <Textarea
          size="xs"
          rows={5}
          value={context}
          onChange={(e) => setContext(e.currentTarget.value)}
          placeholder="Type context here..."
        />
        <Group justify="stretch" w="100%" gap="xs">
          <Button c="white" bg="blue" flex={1} onClick={handleSave}>
            Save
          </Button>
          <Button c="gray" bg="gray.1" onClick={handleCancel}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Stack>
  );
};

const DocumentChatButton = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  return (
    <Link to={`/document/${document.id}`}>
      <Button
        disabled={document.is_processed === false}
        loading={document.is_processed === false}
        component="a"
        variant="filled"
        c="white"
        bg="blue"
        fullWidth
      >
        Open Document Chat ✨
      </Button>
    </Link>
  );
};

const DocumentContext = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  if (document.processing_error) {
    return null;
  }

  return (
    <Stack gap="xs">
      {document.context != null ? (
        <>
          <Text size="sm">Added context</Text>
          <Text size="xs">{document.context}</Text>
          <DocumentChatButton document={document} />
        </>
      ) : (
        <UpdateDocumentContextInput document={document} />
      )}
    </Stack>
  );
};

const getIconForAccordion = (document: TDocument) => {
  if (document.is_processed) {
    if (document.context != null) {
      return <Text size="xs">📎</Text>;
    }

    return <Icons.Document />;
  }

  if (document.processing_error != null) {
    return <Icons.Alert />;
  }

  return <Loader size="xs" color="black" />;
};

const DocumentAccordionLabel = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  return (
    <Group wrap="nowrap" align="center">
      <div>{getIconForAccordion(document)}</div>

      <Box>
        <Title order={3} className="font-normal text-sm">
          {document.title ? document.title : "Document"}
        </Title>
      </Box>
    </Group>
  );
};

const DocumentProcessingError = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  const deleteDocumentMutation = useDeleteDocument();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(document);
      toast.info("Document was deleted");
    }
  };

  return (
    <Group wrap="nowrap">
      <Text size="xs" c="red">
        {document.processing_error}
      </Text>
      <Tooltip label="Delete document">
        <ActionIcon variant="outline" color="red" onClick={handleDelete}>
          <IconTrash />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

const DocumentAccordionDetail = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  return (
    <Stack gap="xs">
      {!document.is_processed && document.processing_error == null && (
        <Text size="xs">Document is being processed</Text>
      )}
      {document.processing_error && (
        <DocumentProcessingError document={document} />
      )}
      {document.description && (
        <>
          <Text size="sm">Description</Text>
          <Text size="xs">{document.description}</Text>
        </>
      )}
      <DocumentContext document={document} />
    </Stack>
  );
};

export const DocumentAccordion = ({
  documents,
}: PropsWithChildren<{ documents: TDocument[] }>) => {
  const [parent] = useAutoAnimate();

  if (documents.length == 0) {
    return (
      <Stack gap="xs" ref={parent}>
        <Text size="sm">No documents uploaded yet</Text>
      </Stack>
    );
  }

  return (
    // <ScrollArea.Autosize mah="75vh" offsetScrollbars>
    <Accordion variant="separated" radius="md">
      <div ref={parent}>
        {documents.map((item: TDocument) => (
          <Accordion.Item key={item.id} value={item.id}>
            <Accordion.Control
              bg={
                item.processing_error
                  ? "red.1"
                  : item.is_processed && !item.context
                    ? "yellow.1"
                    : "gray.1"
              }
            >
              <DocumentAccordionLabel document={item} />
            </Accordion.Control>
            <Accordion.Panel>
              <DocumentAccordionDetail document={item} />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </div>
    </Accordion>
    // </ScrollArea.Autosize>
  );
};
