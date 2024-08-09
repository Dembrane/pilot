import { Icons } from "@/icons";
import { useConversationsByProjectId } from "@/lib/query";
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
  Paper,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UploadResourceDropzone } from "../dropzone/UploadResourceDropzone";
import { UploadConversationDropzone } from "../dropzone/UploadConversationDropzone";
import clsx from "clsx";
import { useDebouncedValue } from "@mantine/hooks";
import { IconChevronRight, IconSearch, IconX } from "@tabler/icons-react";
import { formatRelative } from "date-fns";
import { InlineInputClasses } from "node_modules/@mantine/core/lib/components/InlineInput";
import { NavigationButton } from "../common/NavigationButton";

// const ResourceAccordionLabelIcon = ({ resource }: { resource: TResource }) => {
//   if (resource.is_processed) {
//     if (resource.context != null) {
//       return <Icons.DocumentFilled />;
//     }

//     return <Icons.DocumentOutline />;
//   }

//   if (resource.processing_error != null) {
//     return <Icons.Alert />;
//   }

//   return <Loader size="xs" color="black" />;
// };

// const ResourceAccordionLabel = ({
//   resource,
// }: PropsWithChildren<{ resource: TResource }>) => {
//   return (
//     <Group wrap="nowrap" align="center">
//       <Box>
//         <ResourceAccordionLabelIcon resource={resource} />
//       </Box>

//       <Box>
//         <Title order={4} className="font-normal text-sm">
//           {resource.title ? resource.title : "Document"}
//         </Title>
//       </Box>
//     </Group>
//   );
// };

// const ResourceAccordionDetail = ({
//   resource,
// }: PropsWithChildren<{ resource: TResource }>) => {
//   return (
//     <Stack gap="xs">
//       {!resource.is_processed && resource.processing_error == null && (
//         <Text size="xs">
//           <Trans>Document is being processed</Trans>
//         </Text>
//       )}
//       {resource.processing_error && (
//         <Text size="xs" c="red">
//           {resource.processing_error}
//         </Text>
//       )}
//       {resource.title !== resource.original_filename && (
//         <Box>
//           <Text size="sm">Original File</Text>
//           <Group gap="xs">
//             <Text size="xs">{resource.original_filename}</Text>
//             <Tooltip label="Open in new tab">
//               <a
//                 href={
//                   apiCommonConfig.baseURL +
//                   "/resources/" +
//                   resource.id +
//                   "/content"
//                 }
//                 target="_blank"
//               >
//                 <ActionIcon color="gray" variant="subtle" size="sm">
//                   <IconExternalLink />
//                 </ActionIcon>
//               </a>
//             </Tooltip>
//           </Group>
//         </Box>
//       )}
//       <Box>
//         <Text size="sm">
//           <Trans>Created on</Trans>
//         </Text>
//         <Text size="xs">{new Date(resource.created_at).toLocaleString()}</Text>
//       </Box>
//       {resource.description && (
//         <Box>
//           <Text size="sm">
//             <Trans>Description</Trans>
//           </Text>
//           <Text size="xs">{resource.description}</Text>
//         </Box>
//       )}
//       <Link
//         to={`/projects/${resource.project_id}/resources/${resource.id}/overview`}
//       >
//         <Button component="a" fullWidth autoContrast>
//           <Trans>Open</Trans>
//         </Button>
//       </Link>
//     </Stack>
//   );
// };

const ConversationAccordionLabel = ({
  conversation,
  highlight = false,
}: {
  conversation: Conversation;
  highlight?: boolean;
}) => {
  return (
    <NavigationButton active={highlight} className="w-full">
      <Stack gap="1">
        <Text className="text-sm font-normal">
          {conversation.participant_email ?? conversation.participant_name}
        </Text>
        <Text size="xs" c="gray.6">
          {formatRelative(new Date(conversation.created_at), new Date())}
        </Text>
        <Group gap="sm" pr="sm" wrap="wrap">
          {conversation.tags &&
            conversation.tags.length > 0 &&
            conversation.tags.map((tag) => (
              <React.Fragment key={tag.id}>
                {tag.project_tag_id && (
                  <Pill size="sm">
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

export const ProjectAccordion = ({ projectId }: { projectId: string }) => {
  const [hideConversationsWithoutContent, setHideConversationsWithoutContent] =
    useState(true);
  // const resourcesQuery = useResourcesByProjectId(projectId);
  const resources = [];

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

  const [parent] = useAutoAnimate();
  const [parent2] = useAutoAnimate();

  return (
    <Accordion multiple defaultValue={["resources", "conversations"]}>
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
              {/* <LoadingOverlay visible={resourcesQuery.isLoading} /> */}
              {resources?.length === 0 && (
                <Text size="sm">
                  <Trans>
                    No resources found.
                    {/* Add resources using the button above. */}
                  </Trans>
                </Text>
              )}
              {/* {resources?.map((item: TResource) => (
                <Accordion.Item
                  key={item.id}
                  value={item.id}
                  className="overflow-hidden"
                >
                  <Accordion.Control
                  // bg={
                  //   item.processing_error
                  //     ? "red.1"
                  //     : item.is_processed && !item.context
                  //       ? "yellow.1"
                  //       : "gray.1"
                  // }
                  >
                    <ResourceAccordionLabel resource={item} />
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ResourceAccordionDetail resource={item} />
                  </Accordion.Panel>
                </Accordion.Item>
              ))} */}
            </div>
          </Accordion>
        </Accordion.Panel>
      </Accordion.Item>

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
                className="w-full"
              />
            )}

            <Checkbox
              size="sm"
              disabled={conversationsQuery.isLoading}
              label={`Hide Conversations Without Content`}
              checked={hideConversationsWithoutContent}
              onChange={() =>
                setHideConversationsWithoutContent((prev) => !prev)
              }
            />

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
                <Link
                  key={item.id}
                  to={`/projects/${projectId}/conversation/${item.id}/overview`}
                >
                  <ConversationAccordionLabel
                    highlight={item.id === activeConversationId}
                    conversation={item as Conversation}
                  />
                </Link>
              ))}
            </Stack>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
