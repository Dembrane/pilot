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
  Paper,
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
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useSessionStorageState from "use-session-storage-state";
import { ProjectDangerZone } from "./ProjectDangerZone";
import { SummaryCard } from "@/components/common/SummaryCard";
import { ProjectEdit } from "./ProjectEdit";
import { QRCode } from "@/components/common/QRCode";
import { useDocumentTitle } from "@mantine/hooks";

export const ProjectOverviewRoute = () => {
  const projectId = useParams().projectId;
  const projectQuery = useProjectById({
    projectId: projectId ?? "",
  });
  const conversationsQuery = useConversationsByProjectId(projectId ?? "");
  const updateProjectMutation = useUpdateProjectByIdMutation();

  const [language, setLanguage] = useSessionStorageState<string>(
    `settings/${projectId}/sharingLanguage`,
    {
      defaultValue: "en",
    },
  );

  const [isTranscriptionLive, setIsTranscriptionLive] =
    useSessionStorageState<boolean>(
      `settings/${projectId}/isTranscriptionLiveDefault`,
      {
        defaultValue: true,
      },
    );

  const getTranscriptionType = (isTranscriptionLive: boolean) =>
    // isTranscriptionLive ? "live" : "async";
    // FIXME: until the issue with async transcription is resolved
    isTranscriptionLive ? "live" : "live";

  const [sharingLink, setSharingLink] = useState(
    `${PARTICIPANT_BASE_URL}/${language}/${projectId}/login?pin=${projectQuery.data?.pin}&transcription=${getTranscriptionType(isTranscriptionLive)}`,
  );

  useDocumentTitle("Project Overview | Dembrane");

  useEffect(() => {
    if (projectQuery.data) {
      document.title = projectQuery.data.name + " | Dembrane";
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
          md: 2,
        }}
      >
        <Paper p="md">
          {projectQuery.data && projectQuery.data.is_conversation_allowed ? (
            <Group>
              <Box className="h-auto max-w-32 w-full p-2 bg-white rounded-lg">
                <QRCode value={sharingLink} />
              </Box>
              <Stack gap="sm">
                <Text>Share</Text>
                <CopyButton value={sharingLink} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : "Copy"}
                      withArrow
                      position="right"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        c="gray"
                        color="gray"
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
              </Stack>
            </Group>
          ) : (
            <Text size="sm">Please enable participation to enable sharing</Text>
          )}
        </Paper>
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
                checked={
                  // FIXME: until the issue with async transcription is resolved
                  true
                  // isTranscriptionLive
                }
                disabled={
                  // FIXME: until the issue with async transcription is resolved
                  true
                  // projectQuery.data?.is_conversation_allowed ||
                  // updateProjectMutation.isPending ||
                  // projectQuery.isFetching
                }
                // onChange={() => setIsTranscriptionLive(!isTranscriptionLive)}
                label="Live Transcription"
                description={
                  // FIXME: until the issue with async transcription is resolved
                  "This option is currently disabled. Select this option for immediate live transcription. If you prefer higher quality transcription, leave this option unchecked."
                  // (projectQuery.data?.is_conversation_allowed
                  //   ? 'Please uncheck the "Open for Participation" to modify this setting as the sharing link will be updated. '
                  //   : "") +
                  // "Select this option for immediate live transcription. If you prefer higher quality transcription, leave this option unchecked."
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
                    <QRCode value={sharingLink} />
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
                Please enable participation to enable sharing
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
