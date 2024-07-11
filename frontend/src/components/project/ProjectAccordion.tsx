import { Icons } from "@/icons";
import { useConversationsByProjectId } from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import {
  Accordion,
  Box,
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
import { PropsWithChildren, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UploadResourceDropzone } from "../dropzone/UploadResourceDropzone";
import { UploadConversationDropzone } from "../dropzone/UploadConversationDropzone";
import clsx from "clsx";
import { useDebouncedState, useDebouncedValue } from "@mantine/hooks";
import { setQuarter } from "date-fns";
import { IconSearch, IconX } from "@tabler/icons-react";

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
}: PropsWithChildren<{ conversation: Conversation; highlight?: boolean }>) => {
  return (
    <Paper
      p="sm"
      className={clsx(
        highlight ? "!border-primary-400" : "hover:!border-primary-400",
      )}
      bg="transparent"
    >
      <Group
        wrap="nowrap"
        align="center"
        justify="between"
        className="w-full pb-1"
      >
        <Title order={4} className="font-normal text-sm">
          {conversation.participant_email ?? conversation.participant_name}
        </Title>
      </Group>
      <Group gap="sm" pr="sm">
        {conversation.tags &&
          conversation.tags.length > 0 &&
          conversation.tags.map((tag) => (
            <Pill key={tag.id} size="sm">
              {(tag?.project_tag_id as unknown as ProjectTag).text}
            </Pill>
          ))}
      </Group>
    </Paper>
  );
};

export const ProjectAccordion = ({ projectId }: { projectId: string }) => {
  const [hideConversationsWithoutContent, setHideConversationsWithoutContent] =
    useState(true);
  // const resourcesQuery = useResourcesByProjectId(projectId);
  const resources = [];

  const { conversationId: activeConversationId, sessionId } = useParams();

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
    <Accordion
      chevronPosition="left"
      variant="filled"
      multiple
      defaultValue={["resources", "conversations"]}
      styles={{
        control: {
          backgroundColor: "transparent",
          padding: 0,
        },
        content: {
          padding: 0,
        },
        item: {
          backgroundColor: "transparent",
          padding: 0,
        },
        panel: {
          backgroundColor: "transparent",
          padding: 0,
        },
      }}
    >
      <Accordion.Item value="resources">
        <Accordion.Control>
          <Group justify="space-between">
            <Title order={3}>Resources</Title>
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
                <Text size="sm" px="md">
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
            <LoadingOverlay visible={conversationsQuery.isLoading} />
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
                      disabled={conversationsQuery.isRefetching}
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
              disabled={conversationsQuery.isRefetching}
              label={`Hide Conversations Without Content`}
              checked={hideConversationsWithoutContent}
              onChange={() =>
                setHideConversationsWithoutContent((prev) => !prev)
              }
            />

            {conversationsQuery.data?.length === 0 && (
              <Text size="sm" px="md" py="md">
                <Trans>
                  No conversations found. Start a conversation using the
                  participation invite link from the{" "}
                  <Link
                    to={`/workspaces/${sessionId}/projects/${projectId}/overview`}
                  >
                    <Anchor>project overview.</Anchor>
                  </Link>
                </Trans>
              </Text>
            )}

            <Stack gap="xs">
              {conversationsQuery.data?.map((item) => (
                <Link
                  to={`/workspaces/${sessionId}/projects/${projectId}/conversation/${item.id}/overview`}
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
