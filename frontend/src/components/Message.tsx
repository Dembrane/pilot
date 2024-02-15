import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Input,
  Loader,
  LoadingOverlay,
  Paper,
  PaperProps,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Tooltip,
  rem,
  useMantineTheme,
} from "@mantine/core";
import { Markdown } from "./Markdown";
import { PropsWithChildren, useEffect, useState } from "react";
import { Icons } from "../icons";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconArrowUp, IconUpload, IconX } from "@tabler/icons-react";
import {
  useCurrentSession,
  useDocumentMessages,
  useDocuments,
  usePostDocumentMessage,
  usePostSessionMessage,
  useSessionMessages,
  useUpdateSession,
  useUploadDocuments,
} from "../lib/query";
import { toast } from "./Toaster";
import { useScrollIntoView } from "@mantine/hooks";

// const Message = (
//   props: PropsWithChildren<{
//     text: string;
//     role: "human" | "ai";
//   }>
// ) => {
//   return (
//     <Group>
//       <Icons.Octagon color={color} />
//       <Stack></Stack>
//     </Group>
//   );
// };

export const AIMessage = (
  props: PropsWithChildren<{ text: string; title?: string }>
) => {
  const theme = useMantineTheme();
  return (
    <Paper bg="blue.1" p="sm" className="!bg-opacity-50">
      <Group align="start" wrap="nowrap">
        <div className="pt-1">
          <Icons.Octagon color={theme.colors.blue[7]} />
        </div>
        <Box>
          <Text mb="xs" size="sm" c="blue.9">
            {props.title ?? "AI Assistant"}
          </Text>
          <Text size="sm" c="blue.9">
            {props.text}
          </Text>
          {props.children}
        </Box>
      </Group>
    </Paper>
  );
};

export const DocumentAIMessage = (
  props: PropsWithChildren<{ text: string; title?: string }>
) => {
  const theme = useMantineTheme();
  return (
    <Paper bg="indigo.1" p="sm" className="!bg-opacity-50">
      <Group align="start" wrap="nowrap">
        <div className="pt-1">
          <Icons.Octagon color={theme.colors.indigo[7]} />
        </div>
        <Box flex={1}>
          <Text mb="xs" size="sm" c="indigo.9">
            {props.title ?? "Document AI Assistant"}
          </Text>
          <Text size="sm" c="indigo.9">
            {props.text}
          </Text>
          {props.children}
        </Box>
      </Group>
    </Paper>
  );
};

export const HumanMessage = (
  props: PropsWithChildren<{
    text?: string;
    title?: string;
    paperProps?: PaperProps;
  }>
) => {
  return (
    <Paper
      pos="relative"
      bg="gray.1"
      p="sm"
      className="!bg-opacity-50"
      {...props.paperProps}
    >
      <Group align="start" wrap="nowrap">
        <div className="pt-1">
          <Icons.Diamond color="black" />
        </div>
        <Box flex={1}>
          <Text mb="xs" size="sm">
            {props.title ?? "You"}
          </Text>
          <div>
            {props.text && <Text size="sm">{props.text}</Text>}
            {props.children}
          </div>
        </Box>
      </Group>
    </Paper>
  );
};

export const DropzoneUploadDocuments = (
  props: PropsWithChildren<{
    idle?: React.ReactNode;
    reject?: React.ReactNode;
    accept?: React.ReactNode;
  }>
) => {
  const uploadDocumentsMutation = useUploadDocuments();

  return (
    <Dropzone
      onDrop={(files) => {
        uploadDocumentsMutation.mutate(files);
      }}
      onReject={(files) => {
        console.log("rejected files", files);
      }}
      accept={PDF_MIME_TYPE}
    >
      <Group justify="center" gap="xl" style={{ pointerEvents: "none" }}>
        <Dropzone.Accept>
          {props.accept ? (
            props.accept
          ) : (
            <IconUpload
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-blue-6)",
              }}
              stroke={1.5}
            />
          )}
        </Dropzone.Accept>
        <Dropzone.Reject>
          {props.reject ? (
            props.reject
          ) : (
            <IconX
              style={{
                width: rem(52),
                height: rem(52),
                color: "var(--mantine-color-red-6)",
              }}
              stroke={1.5}
            />
          )}
        </Dropzone.Reject>
        <Dropzone.Idle>{props.children}</Dropzone.Idle>
      </Group>
    </Dropzone>
  );
};

export const DropzoneUploadDocumentsMessage = () => {
  return (
    <DropzoneUploadDocuments>
      <Group align="center">
        <div>
          <Icons.Document height={24} width={24} />
        </div>
        <div>
          <Text size="xl">Drag documents here or select files</Text>
          <Text size="sm" c="dimmed">
            Attach as many documents as you like to analyse
          </Text>
        </div>
      </Group>
    </DropzoneUploadDocuments>
  );
};

export const InputGlobalContextHumanMessage = ({
  session: { context: initialContext },
}: PropsWithChildren<{ session: TSession }>) => {
  const updateSessionMutation = useUpdateSession();
  const [context, setContext] = useState(initialContext ?? "");

  const handleSave = () => {
    updateSessionMutation.mutate({ context });
  };

  return (
    <HumanMessage title="Input global context">
      <LoadingOverlay visible={updateSessionMutation.isPending} />
      <Stack gap="xs">
        <Textarea
          rows={8}
          placeholder="Type context here..."
          value={context}
          onChange={(e) => setContext(e.currentTarget.value)}
        />
        <Button c="white" bg="blue" fullWidth onClick={handleSave}>
          Save
        </Button>
      </Stack>
    </HumanMessage>
  );
};

export const GlobalContextAIMessage = () => {
  const currentSessionQueryResult = useCurrentSession();

  if (currentSessionQueryResult.isLoading) {
    return null;
  }

  if (!currentSessionQueryResult.data?.context) {
    return null;
  }

  return (
    <AIMessage text="Thank you! In the meantime, click individual documents to add context to each file that I will take into account for further analysis." />
  );
};

export const GlobalAIChatMessages = () => {
  const messagesQuery = useSessionMessages();

  if (messagesQuery.isLoading) {
    return <Skeleton height={200} />;
  }

  return (
    <>
      {messagesQuery.data?.map((message) => {
        if (!message.from_user) {
          return (
            <AIMessage key={message.id} text="">
              <Markdown content={message.text} />
            </AIMessage>
          );
        } else {
          return <HumanMessage key={message.id} text={message.text} />;
        }
      })}
    </>
  );
};

export const InputGlobalResearchQuestionHumanMessage = () => {
  const currentSessionQuery = useCurrentSession();
  const postSessionMessageMutation = usePostSessionMessage();

  const [question, setQuestion] = useState("");

  const handleSave = () => {
    postSessionMessageMutation.mutate({ message: question });
  };

  return (
    <>
      {currentSessionQuery.data?.processing_since && (
        <Paper bg="lime.1" p="md">
          <Group wrap="nowrap">
            <Group flex={1} wrap="nowrap">
              <Loader size="sm" c="lime" color="lime" />
              <Text size="sm" c="lime.9">
                Generating answer...
              </Text>
            </Group>
            {/* <Text>
            {currentSessionQuery.data?.processing_since &&
              "Elapsed time: " +
                (
                  (Date.now() -
                    new Date(
                      currentSessionQuery.data?.processing_since
                    ).getTime()) /
                  1000
                ).toFixed(0) +
                "s"}
          </Text> */}
          </Group>
        </Paper>
      )}
      <HumanMessage title="Ask a global research question">
        <LoadingOverlay visible={postSessionMessageMutation.isPending} />
        <Stack gap="xs">
          <Textarea
            rows={8}
            placeholder="Type a question here..."
            value={question}
            onChange={(e) => setQuestion(e.currentTarget.value)}
          />
          <Button c="white" bg="blue" fullWidth onClick={handleSave}>
            Analyze!
          </Button>
        </Stack>
      </HumanMessage>
    </>
  );
};

export const AllDocumentsReadyMessages = () => {
  const currentSessionQuery = useCurrentSession();
  const documentsQuery = useDocuments();
  const isReady = documentsQuery.data?.every(
    (doc) => doc.is_processed && doc.context
  );
  // ?.filter((doc) => !doc.processing_error)

  if (!isReady) {
    return null;
  }

  if (!currentSessionQuery.data?.context) {
    return null;
  }

  return (
    <>
      <AIMessage text="All documents are uploaded and ready now. What research question are you interested in asking? Optionally, you can now open an individual analysis chat for each document." />
      <GlobalAIChatMessages />
      <InputGlobalResearchQuestionHumanMessage />
    </>
  );
};

export const DocumentChatMessages = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  const documentMessagesQuery = useDocumentMessages(document.id);
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 60,
  });

  useEffect(() => {
    scrollIntoView({
      alignment: "start",
    });
  }, [documentMessagesQuery.data, scrollIntoView]);

  if (documentMessagesQuery.isLoading) {
    return <Skeleton height={200} />;
  }

  return (
    <>
      <Stack gap="sm">
        <DocumentAIMessage text="What kind of question do you want to ask for this document?" />
        {documentMessagesQuery.data?.map((message) => {
          if (!message.from_user) {
            if (message.is_global) {
              return (
                <AIMessage
                  key={message.id}
                  title="Global Research Question"
                  text={""}
                >
                  <Markdown content={message.text} />
                </AIMessage>
              );
            } else {
              return (
                <DocumentAIMessage key={message.id} text={""}>
                  <Markdown content={message.text} />
                </DocumentAIMessage>
              );
            }
          } else {
            if (message.is_global) {
              return (
                <HumanMessage
                  key={message.id}
                  title="Global Research Question"
                  text={message.text}
                />
              );
            } else {
              return <HumanMessage key={message.id} text={message.text} />;
            }
          }
        })}
      </Stack>
      <div
        ref={targetRef}
        className="-mt-4 h-[0.1px]"
        role="presentation"
      ></div>
    </>
  );
};

export const DocumentChatInput = (
  props: PropsWithChildren<{ document: TDocument }>
) => {
  const [message, setMessage] = useState("");
  const postDocumentMessageMutation = usePostDocumentMessage();

  const handleSend = () => {
    if (message == "") {
      toast.info("Please enter a message");
      return;
    }
    postDocumentMessageMutation.mutate({
      documentId: props.document.id,
      message,
    });
    setMessage("");
  };

  return (
    <div className="bg-white pb-4">
      {/* {true && ( */}
      {postDocumentMessageMutation.isPending && (
        <DocumentAIMessage
          text=""
          title="Document AI Assistant is thinking... 🧠 "
        >
          <Stack w="100%">
            <Skeleton w="100%" h="20px" animate={false} />
            <Skeleton w="20%" h="20px" animate={false} />
          </Stack>
        </DocumentAIMessage>
      )}
      <HumanMessage
        paperProps={{
          pos: "sticky",
          bottom: 0,
          py: "sm",
          shadow: "xs",
        }}
      >
        <Box bg="gray.1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Group gap="xs" align="center">
              <Input
                flex={1}
                placeholder="Ask a question..."
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                disabled={postDocumentMessageMutation.isPending}
              />
              <Tooltip label="Ask Question">
                <ActionIcon
                  type="submit"
                  onClick={handleSend}
                  loading={postDocumentMessageMutation.isPending}
                  className="h-full"
                  bg="blue"
                >
                  <IconArrowUp color="white" />
                </ActionIcon>
              </Tooltip>
            </Group>
          </form>
        </Box>
      </HumanMessage>
    </div>
  );
};
