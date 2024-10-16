import { ChatContextProgress } from "@/components/chat/ChatContextProgress";
import { ChatMessage } from "@/components/chat/ChatMessage";
import {
  useAddChatMessageMutation,
  useChatHistory,
  useLockConversationsMutation,
  useChat as useProjectChat,
  useProjectChatContext,
} from "@/lib/query";
import {
  Box,
  Stack,
  Title,
  Divider,
  Textarea,
  Group,
  Text,
  Button,
  LoadingOverlay,
  Alert,
  Menu,
  SimpleGrid,
  CopyButton,
  ActionIcon,
  Tooltip,
  Anchor,
} from "@mantine/core";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconCalculator,
  IconCheck,
  IconCopy,
  IconNotes,
  IconRefresh,
  IconSend,
  IconSquare,
} from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { useChat } from "ai/react";
import { API_BASE_URL } from "@/config";
import { Markdown } from "@/components/common/Markdown";
import React, { useEffect, useMemo, useRef } from "react";
import { formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { I18nLink } from "@/components/common/i18nLink";

const ConversationLinks = ({
  conversations,
}: {
  conversations: Conversation[];
}) => {
  const { projectId } = useParams();

  return (
    <Group gap="xs" align="center">
      {conversations?.map((conversation) => (
        <I18nLink
          key={conversation.id}
          to={`/projects/${projectId}/conversation/${conversation.id}/overview`}
        >
          <Anchor size="xs">{conversation.participant_name}</Anchor>
        </I18nLink>
      )) ?? null}
    </Group>
  );
};

const ChatHistoryMessage = ({
  message,
  section,
}: {
  message: ChatHistory[number];
  section?: React.ReactNode;
}) => {
  if (message.role === "system") {
    return null;
  }

  if (["user", "assistant"].includes(message.role)) {
    return (
      <ChatMessage
        key={message.id}
        role={message.role}
        section={
          <Group w="100%" gap="xs">
            <Text className={cn("italic")} size="xs" c="gray.7">
              {formatDate(
                // @ts-ignore
                new Date(message.createdAt ?? new Date()),
                "MMM d, h:mm a",
              )}
            </Text>
            <CopyButton value={message.content}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied" : "Copy"} position="bottom">
                  <ActionIcon
                    size="xs"
                    color={copied ? "teal" : "gray"}
                    variant="subtle"
                    onClick={copy}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        }
      >
        <Markdown className="prose-sm" content={message.content} />
      </ChatMessage>
    );
  }

  if (message._original.added_conversations?.length > 0) {
    return (
      <ChatMessage key={message.id} role="dembrane" section={section}>
        <Group gap="xs" align="baseline">
          <Text size="xs">Context added:</Text>
          <ConversationLinks
            conversations={message._original.added_conversations.map(
              (ac) => ac.conversation_id,
            )}
          />
        </Group>
      </ChatMessage>
    );
  }

  return null;
};

// New component for the Templates menu
const TemplatesMenu = ({
  input,
  setInput,
}: {
  input: string;
  setInput: (input: string) => void;
}) => {
  const templates = [
    {
      title: "Summarize",
      icon: IconNotes,
      content:
        "Please provide a concise summary of the following provided in the context.",
    },
    {
      title: "Compare & Contrast",
      icon: IconCalculator,
      content:
        "Compare and contrast the following items provided in the context.",
    },
    {
      title: "Meeting Notes",
      icon: IconNotes,
      content:
        "Generate structured meeting notes based on the following discussion points provided in the context.",
    },
  ];

  const handleTemplateClick = (content: string) => {
    if (
      input.trim() !== "" &&
      !window.confirm("This will clear your current input. Are you sure?")
    ) {
      return;
    }
    setInput(content);
  };

  const [open, setOpen] = useDisclosure(false);

  return (
    <Menu
      position="top"
      withArrow
      opened={open}
      onOpen={setOpen.open}
      onClose={setOpen.close}
    >
      <Menu.Target>
        <Button variant="subtle" color="gray">
          Templates
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Stack p="md" gap="sm">
          <Alert variant="info" title="Templates">
            These are some helpful preset templates to get you started.
          </Alert>
          <SimpleGrid cols={2}>
            {templates.map((template) => (
              <Button
                key={template.title}
                variant="outline"
                color="gray"
                onClick={() => {
                  handleTemplateClick(template.content);
                  setOpen.close();
                }}
                leftSection={<template.icon />}
              >
                <Text size="sm">{template.title}</Text>
              </Button>
            ))}
          </SimpleGrid>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
};

const useDembraneChat = ({ chatId }: { chatId: string }) => {
  const chatHistoryQuery = useChatHistory(chatId);
  const chatContextQuery = useProjectChatContext(chatId);

  const addChatMessageMutation = useAddChatMessageMutation();
  const lockConversationsMutation = useLockConversationsMutation();

  const lastInput = useRef("");
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const contextToBeAdded = useMemo(() => {
    if (!chatContextQuery.data) {
      return null;
    }
    return {
      conversations: chatContextQuery.data.conversations.filter(
        (c) => !c.locked,
      ),
    };
  }, [chatContextQuery.data, chatHistoryQuery.data]);

  const {
    setMessages,
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
  } = useChat({
    api: `${API_BASE_URL}/chats/${chatId}`,
    credentials: "include",
    // @ts-ignore
    initialMessages: chatHistoryQuery.data ?? [],
    streamProtocol: "data",
    onResponse: (response) => {
      console.log("onResponse", response);
    },
    onError: (error) => {
      if (lastInput.current) {
        setInput(lastInput.current);
      }
      console.log("onError", error);
    },
    onFinish: async (message) => {
      console.log("onFinish", message.content);
      // do this for now because - i dont want to do the streamed text processing again in the backend
      addChatMessageMutation.mutate({
        project_chat_id: {
          id: chatId,
        } as ProjectChat,
        text: message.content,
        message_from: "assistant",
        date_created: new Date().toISOString(),
      });
      // scroll to the last message
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    },
  });

  const customHandleStop = () => {
    stop();

    const incompleteMessage = messages[messages.length - 1];

    const body = {
      project_chat_id: {
        id: chatId,
      } as ProjectChat,
      text: incompleteMessage.content,
      message_from: "assistant",
      date_created: new Date(
        incompleteMessage.createdAt ?? new Date(),
      ).toISOString(),
    };

    // publish the incomplete result to the backend
    addChatMessageMutation.mutate(body as any);
  };

  const customHandleSubmit = async () => {
    lastInput.current = input;

    try {
      // Lock conversations first
      await lockConversationsMutation.mutateAsync({ chatId });

      // Wait for queries to settle
      await Promise.all([
        chatHistoryQuery.refetch(),
        chatContextQuery.refetch(),
      ]);

      // Submit the chat
      handleSubmit();
    } catch (error) {
      console.error("Error in customHandleSubmit:", error);
    }
  };

  // reconcile for "dembrane" messages
  useEffect(() => {
    if (isLoading || chatHistoryQuery.isLoading || !chatHistoryQuery.data) {
      return;
    }

    if (
      chatHistoryQuery.data &&
      chatHistoryQuery.data.length > (messages?.length ?? 0)
    ) {
      // @ts-ignore
      setMessages(chatHistoryQuery.data ?? messages);
    }
  }, [chatHistoryQuery.data, isLoading, chatHistoryQuery.isLoading, messages]);

  return {
    isInitializing: chatHistoryQuery.isLoading,
    isLoading,
    messages,
    contextToBeAdded,
    input,
    error,
    lastInputRef: lastInput,
    lastMessageRef,
    reload,
    setInput,
    handleInputChange,
    handleSubmit: customHandleSubmit,
    stop: customHandleStop,
  };
};

export const ProjectChatRoute = () => {
  useDocumentTitle("Chat | Dembrane");

  const { chatId } = useParams();
  const chatQuery = useProjectChat(chatId ?? "");

  const {
    isInitializing,
    isLoading,
    messages,
    input,
    error,
    contextToBeAdded,
    lastMessageRef,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    reload,
  } = useDembraneChat({ chatId: chatId ?? "" });

  if (isInitializing || chatQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  return (
    <Stack className="relative flex min-h-full flex-col px-2 pr-4">
      {/* Header */}
      <Stack className="top-0 w-full bg-white pt-6">
        <Title order={1}>{chatQuery.data?.name ?? "Chat"}</Title>
        <Divider />
      </Stack>
      {/* Body */}
      <Box className="flex-grow">
        <Stack py="sm" pb="xl" className="relative h-full w-full">
          <ChatHistoryMessage
            // @ts-ignore
            message={{
              id: "init",
              role: "assistant",
              content:
                "Welcome to Dembrane Chat! Use the sidebar to select resources and conversations that you want to analyse. Then, you can ask questions about the selected resources and conversations.",
            }}
          />

          {/* get everything except the last message */}
          {messages &&
            messages.length > 0 &&
            messages.slice(0, -1).map((message, idx) => (
              <div key={message.id + idx}>
                {/* @ts-ignore */}
                <ChatHistoryMessage message={message} />
              </div>
            ))}

          {messages &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <div ref={lastMessageRef}>
                <ChatHistoryMessage
                  // @ts-ignore
                  message={messages[messages.length - 1]}
                  section={
                    !isLoading && (
                      <Button onClick={handleSubmit}>Regenerate</Button>
                    )
                  }
                />
              </div>
            )}

          {isLoading && (
            <Group>
              <Text size="sm" className="italic">
                Assistant is typing...
              </Text>
              <Button
                onClick={() => stop()}
                variant="outline"
                color="gray"
                size="sm"
                rightSection={<IconSquare size={14} />}
              >
                Stop
              </Button>
            </Group>
          )}

          {messages &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "assistant" && (
              <div ref={lastMessageRef}>
                {/* @ts-ignore */}
                <ChatHistoryMessage message={messages[messages.length - 1]} />
              </div>
            )}

          {error && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
              variant="outline"
            >
              <Text>An error occurred.</Text>
              <Button
                color="red"
                onClick={() => reload()}
                leftSection={<IconRefresh size="1rem" />}
                mt="md"
              >
                Retry
              </Button>
            </Alert>
          )}
        </Stack>
      </Box>
      {/* Footer */}
      <Box className="bottom-0 w-full border-t bg-white py-4 lg:sticky">
        <Stack>
          {contextToBeAdded && contextToBeAdded.conversations.length > 0 && (
            <ChatMessage role="dembrane">
              <Group gap="xs" align="baseline">
                <Text size="xs">Adding Context:</Text>
                <ConversationLinks
                  // @ts-ignore
                  conversations={contextToBeAdded.conversations.map((c) => ({
                    id: c.conversation_id,
                    participant_name: c.conversation_participant_name,
                  }))}
                />
              </Group>
            </ChatMessage>
          )}
          <Box className="flex-grow">
            <ChatContextProgress chatId={chatId ?? ""} />
          </Box>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <Group>
              <Box className="grow">
                <Textarea
                  placeholder="Type a message..."
                  minRows={4}
                  autosize
                  value={input}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit();
                    }
                  }}
                  color="gray"
                />
              </Box>
              <Stack className="h-full" gap="xs">
                <Box>
                  <Button
                    size="lg"
                    type="submit"
                    variant="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit();
                    }}
                    rightSection={<IconSend size={24} />}
                    disabled={input.trim() === "" || isLoading}
                  >
                    Send
                  </Button>
                </Box>

                <TemplatesMenu input={input} setInput={setInput} />
              </Stack>
            </Group>

            <Text size="xs" className="mt-1 italic" c="dimmed">
              Use Shift + Enter to add a new line
            </Text>
          </form>
        </Stack>
      </Box>
    </Stack>
  );
};
