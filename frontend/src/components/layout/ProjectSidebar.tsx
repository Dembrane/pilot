import { Icons } from "@/icons";
import {
  useConversationsByProjectId,
  useProjectById,
  useResourcesByProjectId,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import {
  Accordion,
  ActionIcon,
  Box,
  Breadcrumbs,
  Button,
  Group,
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Loader,
  Tooltip,
  Anchor,
  Pill,
  UnstyledButton,
  UnstyledButtonProps,
} from "@mantine/core";
import { PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";
import { UploadResourceDropzone } from "../resource/UploadResourceDropzone";
import { apiCommonConfig } from "@/lib/api";
import { IconExternalLink } from "@tabler/icons-react";
import { ENABLE_EXPERIMENTAL_FEATURES } from "@/config";

const ResourceAccordionLabelIcon = ({ resource }: { resource: TResource }) => {
  if (resource.is_processed) {
    if (resource.context != null) {
      return <Icons.DocumentFilled />;
    }

    return <Icons.DocumentOutline />;
  }

  if (resource.processing_error != null) {
    return <Icons.Alert />;
  }

  return <Loader size="xs" color="black" />;
};

const ResourceAccordionLabel = ({
  resource,
}: PropsWithChildren<{ resource: TResource }>) => {
  return (
    <Group wrap="nowrap" align="center">
      <Box>
        <ResourceAccordionLabelIcon resource={resource} />
      </Box>

      <Box>
        <Title order={4} className="font-normal text-sm">
          {resource.title ? resource.title : "Document"}
        </Title>
      </Box>
    </Group>
  );
};

const ResourceAccordionDetail = ({
  resource,
}: PropsWithChildren<{ resource: TResource }>) => {
  return (
    <Stack gap="xs">
      {!resource.is_processed && resource.processing_error == null && (
        <Text size="xs">
          <Trans>Document is being processed</Trans>
        </Text>
      )}
      {resource.processing_error && (
        <Text size="xs" c="red">
          {resource.processing_error}
        </Text>
      )}
      {resource.title !== resource.original_filename && (
        <Box>
          <Text size="sm">Original File</Text>
          <Group gap="xs">
            <Text size="xs">{resource.original_filename}</Text>
            <Tooltip label="Open in new tab">
              <a
                href={
                  apiCommonConfig.baseURL +
                  "/resources/" +
                  resource.id +
                  "/content"
                }
                target="_blank"
              >
                <ActionIcon color="gray" variant="subtle" size="sm">
                  <IconExternalLink />
                </ActionIcon>
              </a>
            </Tooltip>
          </Group>
        </Box>
      )}
      <Box>
        <Text size="sm">
          <Trans>Created on</Trans>
        </Text>
        <Text size="xs">{new Date(resource.created_at).toLocaleString()}</Text>
      </Box>
      {resource.description && (
        <Box>
          <Text size="sm">
            <Trans>Description</Trans>
          </Text>
          <Text size="xs">{resource.description}</Text>
        </Box>
      )}
      <Link
        to={`/projects/${resource.project_id}/resources/${resource.id}/overview`}
      >
        <Button component="a" fullWidth autoContrast>
          <Trans>Open</Trans>
        </Button>
      </Link>
    </Stack>
  );
};

const ConversationAccordionLabel = ({
  conversation,
}: PropsWithChildren<{ conversation: TConversation }>) => {
  return (
    <Stack gap="xs">
      <Group wrap="nowrap" align="center" justify="between" className="w-full">
        <Title order={4} className="font-normal text-sm">
          {conversation.participant_email ?? conversation.participant_name}
        </Title>
      </Group>
      <Group gap="sm" pr="sm">
        {conversation.tags &&
          conversation.tags.length > 0 &&
          conversation.tags.map((tag) => (
            <Pill key={tag.id} size="sm">
              {tag.text}
            </Pill>
          ))}
      </Group>
    </Stack>
  );
};

const ConversationAccordionDetail = ({
  conversation,
}: PropsWithChildren<{ conversation: TConversation }>) => {
  return (
    <Stack gap="xs">
      {/* {!conversation.is_processed && conversation.processing_error == null && (
        <Text size="xs">
          <Trans>Document is being processed</Trans>
        </Text>
      )}
      {conversation.processing_error && (
        <Text size="xs" c="red">
          {conversation.processing_error}
        </Text>
      )}
      {conversation.title !== conversation.original_filename && (
        <>
          <Text size="sm">
            <Trans>Original filename</Trans>
          </Text>
          <Text size="xs">{conversation.original_filename}</Text>
        </>
      )} */}
      <Box>
        <Text size="sm">
          <Trans>Created on</Trans>
        </Text>
        <Text size="xs">
          {new Date(conversation.created_at).toLocaleString()}
        </Text>
      </Box>
      {conversation.title && (
        <Box>
          <Text size="sm">
            <Trans>Title</Trans>
          </Text>
          <Text size="xs">{conversation.title}</Text>
        </Box>
      )}
      {conversation.description && (
        <Box>
          <Text size="sm">
            <Trans>Description</Trans>
          </Text>
          <Text size="xs">{conversation.description}</Text>
        </Box>
      )}
      <Link
        to={`/projects/${conversation.project_id}/conversation/${conversation.id}/overview`}
      >
        <Button component="a" fullWidth autoContrast>
          <Trans>Open</Trans>
        </Button>
      </Link>
    </Stack>
  );
};

const ProjectAccordion = ({ projectId }: { projectId: string }) => {
  const resourcesQuery = useResourcesByProjectId(projectId);
  const resources = resourcesQuery.data;

  const conversationsQuery = useConversationsByProjectId(projectId);
  const conversations = conversationsQuery.data;

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
            <LoadingOverlay visible={resourcesQuery.isLoading} />
            <div ref={parent}>
              {resources?.length === 0 && (
                <Text size="sm" px="md">
                  <Trans>
                    No resources found. Add resources using the button above.
                  </Trans>
                </Text>
              )}
              {resources?.map((item: TResource) => (
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
              ))}
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
          </Group>
        </Accordion.Control>

        <Accordion.Panel>
          <Accordion variant="separated" radius="md">
            <LoadingOverlay visible={conversationsQuery.isLoading} />
            <div ref={parent2}>
              {conversations?.length === 0 && (
                <Text size="sm" px="md">
                  <Trans>
                    No conversations found. Start a conversation using the
                    participation invite link from the{" "}
                    <Link to={`/projects/${projectId}/overview`}>
                      <Anchor>project overview.</Anchor>
                    </Link>
                  </Trans>
                </Text>
              )}
              {conversations?.map((item: TConversation) => (
                <Accordion.Item
                  key={item.id}
                  value={item.id}
                  className="overflow-hidden"
                >
                  <Accordion.Control>
                    <ConversationAccordionLabel conversation={item} />
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ConversationAccordionDetail conversation={item} />
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </div>
          </Accordion>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

type ProjectSidebarButtonProps = {
  icon?: React.ReactNode
} & UnstyledButtonProps

export const ProjectSidebarButton = ({ children, icon, ...props }: PropsWithChildren<ProjectSidebarButtonProps>) => {
  return <UnstyledButton
    component="a"
    className="shadow-md"
    {...props}
  >
    <Group className="w-full justify-between px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
      <Text size="lg" className="font-semibold">
        {children}
      </Text>
      {
        !!icon && icon
      }
    </Group>
  </UnstyledButton>
}

export const ProjectSidebar = () => {
  const projectId = useParams().projectId;

  const projectQuery = useProjectById(projectId ?? "");

  if (!projectId) {
    return null;
  }

  return (
    <Stack className="h-full py-6 px-2">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Group justify="space-between">
        <Breadcrumbs>
          <Link to="/projects/home">
            <ActionIcon
              component="a"
              aria-label="Projects Home"
              variant="transparent"
            >
              <Icons.Home />
            </ActionIcon>
          </Link>
          <Link to={`/projects/${projectId}/overview`}>
            <Title order={2} size="20">
              {projectQuery.data?.name}
            </Title>
          </Link>
        </Breadcrumbs>
        <Tooltip label={t`Project Overview`}>
          <Link to={`/projects/${projectId}/overview`}>
            <ActionIcon
              component="a"
              variant="transparent"
              aria-label="Project Oveview and Edit"
            >
              <Icons.Gear />
            </ActionIcon>
          </Link>
        </Tooltip>
      </Group>
      <Link to="#">
        <ProjectSidebarButton icon={<Icons.Stars className="fill-black" />}>
          Analysis
        </ProjectSidebarButton>
      </Link>
      {
        ENABLE_EXPERIMENTAL_FEATURES &&
        <Link to={`/projects/${projectId}/library`}>
          <ProjectSidebarButton icon={<Icons.LightBulb />}>
            Library
          </ProjectSidebarButton>
        </Link>
      }
      <ProjectAccordion projectId={projectId} />
    </Stack>
  );
};
