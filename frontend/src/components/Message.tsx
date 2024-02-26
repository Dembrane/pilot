import {
  ActionIcon,
  Box,
  Button,
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
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { useAutoAnimate } from "@formkit/auto-animate/react";

export const AIMessage = (
  props: PropsWithChildren<{ text: string; title?: string }>,
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
  props: PropsWithChildren<{ text: string; title?: string }>,
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
  }>,
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
  }>,
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
  session,
}: PropsWithChildren<{ session?: TSession }>) => {
  const updateSessionMutation = useUpdateSession();
  const [context, setContext] = useState(session?.context ?? "");

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
          return (
            <HumanMessage key={message.id} text="">
              <Markdown content={message.text} />
            </HumanMessage>
          );
        }
      })}
    </>
  );
};

const GeneratingAnswerMessage = () => (
  <Paper bg="lime.1" p="md">
    <Group wrap="nowrap">
      <Group flex={1} wrap="nowrap">
        <Loader size="sm" c="lime" color="lime" />
        <Text size="sm" c="lime.9">
          Generating answer...
        </Text>
      </Group>
    </Group>
  </Paper>
);

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
        <GeneratingAnswerMessage />
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
    (doc) => doc.is_processed && doc.context,
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

export const DocumentChat = ({
  document,
}: PropsWithChildren<{ document: TDocument }>) => {
  const [animatePresence] = useAutoAnimate();
  const item = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    item.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [item]);

  return (
    <div className="h-full relative">
      <Stack ref={animatePresence}>
        <DocumentChatMessages
          document={document}
          scrollToBottom={scrollToBottom}
        />
        <DocumentChatInput
          document={document}
          scrollToBottom={scrollToBottom}
        />
        <div ref={item} className="h-[1px]" role="presentation" />
      </Stack>
    </div>
  );
};

export const DocumentChatMessages = ({
  document,
  scrollToBottom,
}: PropsWithChildren<{ document: TDocument; scrollToBottom: () => void }>) => {
  const documentMessagesQuery = useDocumentMessages(document.id);

  useEffect(() => {
    scrollToBottom();
  }, [documentMessagesQuery.data, scrollToBottom]);

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
                  text=""
                >
                  <Markdown content={message.text} />
                </HumanMessage>
              );
            } else {
              return (
                <HumanMessage key={message.id} text="">
                  <Markdown content={message.text} />
                </HumanMessage>
              );
            }
          }
        })}
      </Stack>
    </>
  );
};

export const DocumentChatInput = ({
  document,
  scrollToBottom,
}: PropsWithChildren<{ document: TDocument; scrollToBottom: () => void }>) => {
  const [message, setMessage] = useState("");
  const { isPending, ...postDocumentMessageMutation } =
    usePostDocumentMessage();

  const handleSend = () => {
    if (message == "") {
      toast.info("Please enter a message");
      return;
    }
    try {
      postDocumentMessageMutation.mutate({
        documentId: document.id,
        message,
      });
      setMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [isPending, scrollToBottom]);

  return (
    <>
      {isPending && (
        <div>
          <GeneratingAnswerMessage />
        </div>
      )}
      <div className="sticky bottom-0 w-full pb-2">
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
                  disabled={isPending}
                />
                <Tooltip label="Ask Question">
                  <ActionIcon
                    type="submit"
                    onClick={handleSend}
                    loading={isPending}
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
    </>
  );
};
