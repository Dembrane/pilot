import {
  useConversationById,
  useConversationsByProjectId,
  useProjectById,
  useUpdateProjectByIdMutation,
} from "@/lib/query";
import {
  Box,
  Button,
  Text,
  Checkbox,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  rem,
  SimpleGrid,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import { TabsWithRouter } from "./TabsWithRouter";
import { PARTICIPANT_BASE_URL } from "@/config";
import { Icons } from "@/icons";
import { useDocumentTitle } from "@mantine/hooks";
import {
  IconUsersGroup,
  IconShare,
  IconCheck,
  IconCopy,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { SummaryCard } from "../common/SummaryCard";

import useSessionStorageState from "use-session-storage-state";
import { QRCode } from "../common/QRCode";

export const ProjectOverviewLayout = () => {
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
      icon: <Icons.Phone width="24px" />,
      label: "Open for Participation?",
      value: (
        <Tooltip
          position="bottom"
          label="Allow participants using the link to start new conversations"
        >
          <Checkbox
            size="md"
            checked={projectQuery.data?.is_conversation_allowed}
            disabled={
              updateProjectMutation.isPending || projectQuery.isFetching
            }
            onChange={handleOpenForParticipationCheckboxChange}
          />
        </Tooltip>
      ),
    },
    {
      loading: conversationsQuery.isLoading,
      icon: <IconUsersGroup size={24} />,
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
    <Stack className="relative px-2 py-4">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <SimpleGrid
        cols={{
          sm: 1,
          md: 3,
        }}
      >
        <Paper p="md">
          {projectQuery.data && projectQuery.data.is_conversation_allowed ? (
            <Group>
              <Box className="h-auto w-full max-w-[300px] rounded-lg bg-white md:max-w-36">
                <QRCode value={sharingLink} />
              </Box>
              <Stack gap="sm">
                {/* <Text>Share</Text> */}
                {
                  // if sharing is enabled, show the share button
                  navigator.canShare({
                    title: `Join ${projectQuery.data?.default_conversation_title} on Dembrane`,
                    url: sharingLink,
                  }) && (
                    <Button
                      rightSection={<IconShare style={{ width: rem(16) }} />}
                      variant="outline"
                      onClick={async () => {
                        await navigator.share({
                          title: `Join ${projectQuery.data?.default_conversation_title} on Dembrane`,
                          url: sharingLink,
                        });
                      }}
                    >
                      Share
                    </Button>
                  )
                }
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
      {/* <Tabs variant="default" defaultValue="participation">
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
            <Title order={2}>Participation</Title>
            <Box>
              <Checkbox
                label="Open for Participation?"
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
                  <Box className="h-auto w-full max-w-32">
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
      </Tabs> */}
      <TabsWithRouter
        basePath="/projects/:projectId"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "portal-editor", label: "Portal Editor" },
          { value: "transcript-settings", label: "Transcript Settings" },
        ]}
        loading={projectQuery.isLoading}
      />
    </Stack>
  );
};
