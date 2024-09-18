import { Icons } from "@/icons";
import {
  useAddChatContextMutation,
  useConversationsByProjectId,
  useDeleteChatContextMutation,
  useDeleteChatMutation,
  useProjectChatContext,
  useProjectChats,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import {
  Accordion,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Tooltip,
  Anchor,
  Pill,
  Checkbox,
  TextInput,
  ActionIcon,
  Menu,
  Loader,
  Skeleton,
  Indicator,
} from "@mantine/core";
import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { UploadResourceDropzone } from "../dropzone/UploadResourceDropzone";
import { UploadConversationDropzone } from "../dropzone/UploadConversationDropzone";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconChecks,
  IconDotsVertical,
  IconFilter,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { NavigationButton } from "../common/NavigationButton";
import { capitalize, cn } from "@/lib/utils";

const ConversationAccordionLabelChatSelection = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const { chatId } = useParams();
  const projectChatContextQuery = useProjectChatContext(chatId ?? "");
  const addChatContextMutation = useAddChatContextMutation();
  const deleteChatContextMutation = useDeleteChatContextMutation();

  if (
    projectChatContextQuery.isLoading ||
    addChatContextMutation.isPending ||
    deleteChatContextMutation.isPending
  ) {
    return (
      <Tooltip label="Loading...">
        <Loader size="xs" />
      </Tooltip>
    );
  }

  const isSelected = !!projectChatContextQuery.data?.conversations?.find(
    (c) => c.conversation_id === conversation.id,
  );
  const isLocked = !!projectChatContextQuery.data?.conversations?.find(
    (c) => c.conversation_id === conversation.id && c.locked,
  );

  const handleSelectChat = () => {
    if (!isSelected) {
      addChatContextMutation.mutate({
        chatId: chatId ?? "",
        conversationId: conversation.id,
      });
    } else {
      deleteChatContextMutation.mutate({
        chatId: chatId ?? "",
        conversationId: conversation.id,
      });
    }
  };

  const tooltipLabel = isSelected
    ? "Remove from this chat"
    : isLocked
      ? "Already added to this chat"
      : "Add to this chat";

  return (
    <Tooltip label={tooltipLabel}>
      <Checkbox
        size="md"
        checked={isSelected}
        disabled={isLocked}
        onChange={handleSelectChat}
      />
    </Tooltip>
  );
};

const ConversationAccordionItem = ({
  conversation,
  highlight = false,
}: {
  conversation: Conversation;
  highlight?: boolean;
}) => {
  const location = useLocation();
  const inChatMode = location.pathname.includes("/chats/");

  const { chatId } = useParams();
  const chatContextQuery = useProjectChatContext(chatId ?? "");

  if (inChatMode && chatContextQuery.isLoading) {
    return <Skeleton height={60} />;
  }

  // const isSelected = !!chatContextQuery.data?.conversations?.find(
  //   (c) => c.conversation_id === conversation.id,
  // );

  const isLocked = chatContextQuery.data?.conversations?.find(
    (c) => c.conversation_id === conversation.id && c.locked,
  );

  return (
    <NavigationButton
      to={`/projects/${conversation.project_id}/conversation/${conversation.id}/overview`}
      active={highlight}
      className={cn("w-full", {
        "!bg-primary-50": isLocked,
      })}
      rightSection={
        inChatMode && (
          <ConversationAccordionLabelChatSelection
            conversation={conversation}
          />
        )
      }
    >
      <Stack gap="4" className="pb-[3px]">
        <Text className="pl-[4px] text-sm font-normal">
          {conversation.participant_email ?? conversation.participant_name}
        </Text>
        <Text size="xs" c="gray.6" className="pl-[4px]">
          {formatRelative(new Date(conversation.created_at), new Date())}
        </Text>
        <Group gap="4" pr="sm" wrap="wrap">
          {conversation.tags &&
            conversation.tags.length > 0 &&
            conversation.tags.map((tag) => (
              <React.Fragment key={tag.id}>
                {tag.project_tag_id && (
                  <Pill size="sm" className="font-normal">
                    {(tag?.project_tag_id as unknown as ProjectTag)?.text}
                  </Pill>
                )}
              </React.Fragment>
            ))}
        </Group>
      </Stack>
    </NavigationButton>
  );
};

const ChatAccordionItemMenu = ({ chat }: { chat: Partial<ProjectChat> }) => {
  const deleteChatMutation = useDeleteChatMutation();
  const navigate = useNavigate();

  return (
    <Menu shadow="md">
      <Menu.Target>
        <ActionIcon
          variant="transparent"
          c="gray"
          className="flex items-center justify-center"
        >
          <IconDotsVertical />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconTrash />}
          disabled={deleteChatMutation.isPending}
          onClick={() => {
            deleteChatMutation.mutate({
              chatId: chat.id ?? "",
              projectId: (chat.project_id as string) ?? "",
            });
            navigate(`/projects/${chat.project_id}/overview`);
          }}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

// Chat Accordion
const ChatAccordion = ({ projectId }: { projectId: string }) => {
  const chatsQuery = useProjectChats(projectId);
  const { chatId: activeChatId } = useParams();

  return (
    <Accordion.Item value="chat">
      <Accordion.Control>
        <Group justify="space-between">
          <Title order={3}>
            <span className="min-w-[48px] pr-2 font-normal text-gray-500">
              {chatsQuery.data?.length ?? 0}
            </span>
            Chats
          </Title>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack gap="xs">
          <LoadingOverlay visible={chatsQuery.isLoading} />
          {chatsQuery.data?.length === 0 && (
            <Text size="sm">
              <Trans>
                No chats found. Start a chat using the "Ask" button.
              </Trans>
            </Text>
          )}
          {chatsQuery.data?.map((item) => (
            <NavigationButton
              key={item.id}
              to={`/projects/${projectId}/chats/${item.id}`}
              active={item.id === activeChatId}
              rightSection={<ChatAccordionItemMenu chat={item} />}
            >
              <Text size="xs">
                {capitalize(
                  formatRelative(
                    new Date(item.date_created ?? new Date()),
                    new Date(),
                  ),
                )}
              </Text>
            </NavigationButton>
          ))}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

// Resource Accordion
const ResourceAccordion = ({ projectId }: { projectId: string }) => {
  const resources = [];
  const [parent] = useAutoAnimate();

  return (
    <Accordion.Item value="resources">
      <Accordion.Control>
        <Group justify="space-between">
          <Title order={3}>
            <span className="min-w-[48px] pr-2 font-normal text-gray-500">
              {resources.length}
            </span>
            Resources
          </Title>
          <Tooltip label={t`Upload resources`}>
            <div>
              <UploadResourceDropzone projectId={projectId}>
                <Icons.Plus stroke="black" fill="black" />
              </UploadResourceDropzone>
            </div>
          </Tooltip>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Accordion variant="separated" radius="md">
          <div ref={parent} className="relative">
            {resources?.length === 0 && (
              <Text size="sm">
                <Trans>No resources found.</Trans>
              </Text>
            )}
          </div>
        </Accordion>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

// Conversation Accordion
const ConversationAccordion = ({ projectId }: { projectId: string }) => {
  const [hideConversationsWithoutContent, setHideConversationsWithoutContent] =
    useState(true);
  const { conversationId: activeConversationId } = useParams();
  const [conversationSearch, setConversationSearch] = useState("");
  const [debouncedConversationSearchValue] = useDebouncedValue(
    conversationSearch,
    200,
  );

  const conversationsQuery = useConversationsByProjectId(
    projectId,
    false,
    hideConversationsWithoutContent,
    {
      search: debouncedConversationSearchValue,
    },
  );

  const [parent2] = useAutoAnimate();

  const filterApplied =
    hideConversationsWithoutContent || debouncedConversationSearchValue !== "";

  return (
    <Accordion.Item value="conversations">
      <Accordion.Control>
        <Group justify="space-between">
          <Title order={3}>
            <span className="min-w-[48px] pr-2 font-normal text-gray-500">
              {conversationsQuery.data?.length ?? 0}
            </span>
            <Trans>Conversations</Trans>
          </Title>

          <Tooltip label={`Upload conversations`}>
            <div>
              <UploadConversationDropzone projectId={projectId}>
                <Icons.Plus stroke="black" fill="black" />
              </UploadConversationDropzone>
            </div>
          </Tooltip>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack ref={parent2} className="relative">
          {!(
            conversationsQuery.data &&
            conversationsQuery.data.length === 0 &&
            debouncedConversationSearchValue === ""
          ) && (
            <Group justify="space-between" align="center" gap="xs">
              <TextInput
                leftSection={<IconSearch />}
                rightSection={
                  !!conversationSearch && (
                    <ActionIcon
                      disabled={conversationsQuery.isLoading}
                      variant="transparent"
                      onClick={() => {
                        setConversationSearch("");
                      }}
                    >
                      <IconX />
                    </ActionIcon>
                  )
                }
                placeholder="Search conversations"
                value={conversationSearch}
                size="sm"
                onChange={(e) => setConversationSearch(e.currentTarget.value)}
                className="flex-grow"
              />
              <Menu withArrow position="right" shadow="md">
                <Menu.Target>
                  <ActionIcon
                    variant="outline"
                    color={filterApplied ? "primary" : "gray"}
                    c={filterApplied ? "primary" : "gray"}
                  >
                    <IconFilter size={24} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Stack py="md" px="lg" gap="sm">
                    <Text size="lg" className="font-semibold">
                      Filter
                    </Text>
                    <Checkbox
                      size="sm"
                      disabled={conversationsQuery.isLoading}
                      label={`Hide Conversations Without Content`}
                      checked={hideConversationsWithoutContent}
                      onChange={() =>
                        setHideConversationsWithoutContent((prev) => !prev)
                      }
                    />
                  </Stack>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}

          {conversationsQuery.data?.length === 0 && (
            <Text size="sm">
              <Trans>
                No conversations found. Start a conversation using the
                participation invite link from the{" "}
                <Link to={`/projects/${projectId}/overview`}>
                  <Anchor>project overview.</Anchor>
                </Link>
              </Trans>
            </Text>
          )}

          <Stack gap="xs" className="relative">
            <LoadingOverlay visible={conversationsQuery.isLoading} />
            {conversationsQuery.data?.map((item) => (
              <ConversationAccordionItem
                key={item.id}
                highlight={item.id === activeConversationId}
                conversation={item as Conversation}
              />
            ))}
          </Stack>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export const ProjectAccordion = ({ projectId }: { projectId: string }) => {
  return (
    <Accordion multiple defaultValue={["resources", "conversations"]} pb="lg">
      <ChatAccordion projectId={projectId} />
      {/* <ResourceAccordion projectId={projectId} /> */}
      <ConversationAccordion projectId={projectId} />
    </Accordion>
  );
};
