import { PARTICIPANT_BASE_URL } from "@/config";
import { Icons } from "@/icons";
import { getProjectTranscriptsLink } from "@/lib/api";
import {
  useConversationsByProjectId,
  useProjectById,
  useGenerateProjectLibraryMutation,
  useUpdateProjectByIdMutation,
} from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Box,
  Button,
  Checkbox,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  NativeSelect,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconShare,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useParams } from "react-router-dom";
import useSessionStorageState from "use-session-storage-state";
import { ProjectDangerZone } from "./ProjectDangerZone";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ProjectEdit } from "./ProjectEdit";
import { useDocumentTitle } from "@mantine/hooks";

export const ProjectOverviewRoute = () => {
  const projectId = useParams().projectId;
  const projectQuery = useProjectById({
    projectId: projectId ?? "",
  });
  // const resourcesQuery = useResourcesByProjectId(projectId ?? "");
  const conversationsQuery = useConversationsByProjectId(projectId ?? "");
  const updateProjectMutation = useUpdateProjectByIdMutation();
  const requestProjectAnalysisMutation = useGenerateProjectLibraryMutation();

  const [language, setLanguage] = useSessionStorageState<string>(
    `settings/${projectId}/sharingLanguage`,
    {
      defaultValue: "en",
    },
  );

  // TODO: Move this to server state
  const [isTranscriptionLive, setIsTranscriptionLive] =
    useSessionStorageState<boolean>(
      `settings/${projectId}/isTranscriptionLive`,
      {
        defaultValue: false,
      },
    );

  const getTranscriptionType = (isTranscriptionLive: boolean) =>
    isTranscriptionLive ? "live" : "async";

  const [sharingLink, setSharingLink] = useState(
    `${PARTICIPANT_BASE_URL}/${language}/${projectId}/login?pin=${projectQuery.data?.pin}&transcription=${getTranscriptionType(isTranscriptionLive)}`,
  );

  useDocumentTitle("Dembrane | Project Overview");

  useEffect(() => {
    if (projectQuery.data) {
      document.title = "Dembrane | " + projectQuery.data.name;
      setSharingLink(
        `${PARTICIPANT_BASE_URL}/${language}/${projectId}/login?pin=${projectQuery.data.pin}&transcription=${getTranscriptionType(isTranscriptionLive)}`,
      );
    }
  }, [
    language,
    setSharingLink,
    projectQuery.data,
    projectId,
    isTranscriptionLive,
  ]);

  const handleOpenForParticipationCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateProjectMutation.mutate({
      id: projectId ?? "",
      payload: {
        is_conversation_allowed: e.target.checked,
      },
    });
  };

  const summaryItems = [
    {
      loading: projectQuery.isLoading,
      icon: (
        <Icons.Signal
          fill={projectQuery.data?.is_conversation_allowed ? "green" : "gray"}
        />
      ),
      label: "Open for Participation?",
      value: projectQuery.data?.is_conversation_allowed ? "Yes" : "No",
    },
    {
      loading: false,
      // loading: resourcesQuery.isLoading,
      icon: <Icons.DocumentOutline />,
      label: "Resources",
      // value: `${resourcesQuery.data?.length ?? 0}`,
      value: "0",
    },
    {
      laoding: conversationsQuery.isLoading,
      icon: <Icons.Phone />,
      label: "Total Conversations",
      value: `${conversationsQuery.data?.length ?? 0}`,
    },
    {
      loading: conversationsQuery.isLoading,
      icon: <Icons.Phone fill="green" />,
      label: "Total Conversations with Content",
      value: `${
        conversationsQuery.data?.filter(
          (conversation) =>
            conversation.chunks &&
            conversation.chunks.length > 0 &&
            conversation.chunks[0].transcript != null,
        ).length ?? 0
      }`,
    },
    /**
     * Active conversations = currently receiving data (last chunk.timestamp within 5 mins)
     */
    {
      loading: conversationsQuery.isLoading,
      icon: <Icons.Phone fill="green" />,
      label: "Ongoing Conversations",
      value: `${
        conversationsQuery.data?.filter(
          (conversation) =>
            conversation.chunks &&
            conversation.chunks.length > 0 &&
            conversation.chunks
              .map((chunk) => new Date(chunk.timestamp))
              .filter(
                (timestamp) =>
                  new Date().getTime() - timestamp.getTime() < 5 * 60 * 1000,
              ).length > 0, // last chunk within 5 mins
        ).length ?? 0
      }`,
    },
  ];

  return (
    <Stack className="py-6 px-2 relative">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Title order={1}>
        <Trans>Overview</Trans>
      </Title>
      <Divider />
      <SimpleGrid
        cols={{
          sm: 1,
          md: 3,
        }}
      >
        {summaryItems.map((item, index) => (
          <SummaryCard key={index} {...item} />
        ))}
      </SimpleGrid>
      <Divider />

      {/* Share Section */}
      <Tabs variant="default" defaultValue="participation">
        <Tabs.List grow justify="space-between">
          <Tabs.Tab value="participation">
            <Trans>Participation</Trans>
          </Tabs.Tab>
          <Tabs.Tab value="settings">
            <Trans>Settings</Trans>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="participation">
          <Stack py="md">
            <Title order={2}>
              <Trans>Participation</Trans>
            </Title>
            <Box>
              <Checkbox
                label="Open for Participation"
                description="Allow participants using the link to start new conversations"
                checked={projectQuery.data?.is_conversation_allowed}
                disabled={
                  updateProjectMutation.isPending || projectQuery.isFetching
                }
                onChange={handleOpenForParticipationCheckboxChange}
              />
            </Box>
            <Box>
              <Checkbox
                checked={isTranscriptionLive}
                disabled={
                  projectQuery.data?.is_conversation_allowed ||
                  updateProjectMutation.isPending ||
                  projectQuery.isFetching
                }
                onChange={() => setIsTranscriptionLive(!isTranscriptionLive)}
                label="Live Transcription"
                description={
                  (projectQuery.data?.is_conversation_allowed
                    ? 'Please uncheck the "Open for Participation" to modify this setting as the sharing link will be updated. '
                    : "") +
                  "Select this option for immediate live transcription. If you prefer higher quality transcription, leave this option unchecked."
                }
              />
            </Box>
            <Divider />
            <Title order={2}> Sharing</Title>
            {projectQuery.data?.is_conversation_allowed ? (
              <>
                <Box>
                  <NativeSelect
                    size="md"
                    label="Select Language for Participant Portal"
                    data={[
                      {
                        label: "English",
                        value: "en",
                      },
                      {
                        label: "Dutch",
                        value: "nl",
                      },
                    ]}
                    value={language}
                    onChange={(e) => setLanguage(e.currentTarget.value)}
                  />
                </Box>
                <Box>
                  <Text size="md">
                    <Trans>Access Code</Trans>
                  </Text>
                  <Text size="sm">
                    <Trans>Your code is</Trans>{" "}
                    <strong>{projectQuery.data?.pin}</strong>
                  </Text>
                </Box>
                <Box>
                  <Text size="md">
                    <Trans>Invite Link</Trans>
                  </Text>
                  <Group>
                    <TextInput
                      className="flex-1"
                      size="sm"
                      value={sharingLink}
                      readOnly
                    />
                    <CopyButton value={sharingLink} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip
                          label={copied ? "Copied" : "Copy"}
                          withArrow
                          position="right"
                        >
                          <Button
                            variant="outline"
                            onClick={copy}
                            rightSection={
                              copied ? (
                                <IconCheck style={{ width: rem(16) }} />
                              ) : (
                                <IconCopy style={{ width: rem(16) }} />
                              )
                            }
                          >
                            {copied ? "Copied" : "Copy link"}
                          </Button>
                        </Tooltip>
                      )}
                    </CopyButton>
                    {navigator.canShare &&
                      navigator.canShare({
                        title: `Join ${projectQuery.data?.default_conversation_title} on Dembrane`,
                        url: sharingLink,
                      }) && (
                        <Button
                          rightSection={
                            <IconShare style={{ width: rem(16) }} />
                          }
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.share({
                                title: `Join ${projectQuery.data?.default_conversation_title} on Dembrane`,
                                url: sharingLink,
                              });
                              console.log("Data was shared successfully");
                            } catch (err) {
                              // console.error("Share failed:", err);
                              // alert("Share failed");
                            }
                          }}
                        >
                          Share
                        </Button>
                      )}
                  </Group>
                </Box>{" "}
                <Box>
                  <Text size="md">QR Code</Text>
                  <Box className="h-auto max-w-32 w-full">
                    <QRCode value={sharingLink} className="h-full w-full" />
                  </Box>
                </Box>
                <Divider />
                <Title order={2}>Export</Title>
                <Box>
                  <Button
                    component="a"
                    href={getProjectTranscriptsLink(projectId ?? "")}
                    download={`${projectQuery.data.name ?? "Project"}-Transcripts.zip`}
                    rightSection={<IconDownload />}
                    variant="outline"
                  >
                    Download All Transcripts
                  </Button>
                </Box>
              </>
            ) : (
              <Text size="sm">
                Please enable participation to generate a sharing link
              </Text>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="settings">
          {projectQuery.data && (
            <Stack>
              <Divider />
              <ProjectEdit project={projectQuery.data} />
              <Divider />
              <ProjectDangerZone project={projectQuery.data} />
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
