import { Icons } from "@/icons";
import {
  useAddChatContextMutation,
  useConversationsByProjectId,
  useDeleteChatContextMutation,
  useProjectChatContext,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import {
  Accordion,
  ActionIcon,
  Anchor,
  Checkbox,
  Group,
  Loader,
  LoadingOverlay,
  Menu,
  Pill,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { UploadConversationDropzone } from "../dropzone/UploadConversationDropzone";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { NavigationButton } from "../common/NavigationButton";
import { cn } from "@/lib/utils";
import { I18nLink } from "@/components/common/i18nLink";

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
      <Tooltip label={t`Loading...`}>
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

  const tooltipLabel = isLocked
    ? t`Already added to this chat`
    : isSelected
      ? t`Remove from this chat`
      : t`Add to this chat`;

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

// Conversation Accordion
export const ConversationAccordion = ({ projectId }: { projectId: string }) => {
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
                placeholder={t`Search conversations`}
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
                      <Trans>Filter</Trans>
                    </Text>
                    <Checkbox
                      size="sm"
                      disabled={conversationsQuery.isLoading}
                      label={t`Hide Conversations Without Content`}
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
                <I18nLink to={`/projects/${projectId}/overview`}>
                  <Anchor>project overview.</Anchor>
                </I18nLink>
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
