import { Icons } from "@/icons";
import {
  useConversationsByProjectId,
  useDeleteProjectByIdMutation,
  useProjectById,
  useResourcesByProjectId,
  useUpdateProjectByIdMutation,
} from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Box,
  Button,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  TextInput,
  Textarea,
  Title,
  Text,
  Tooltip,
  rem,
  Tabs,
  Checkbox,
  Anchor,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { PARTICIPANT_BASE_URL } from "@/config";
import { getProjectTranscriptsLink } from "@/lib/api";

const ProjectDangerZone = ({ project }: { project: TProject }) => {
  const deleteProjectByIdMutation = useDeleteProjectByIdMutation();
  const navigate = useNavigate();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProjectByIdMutation.mutate(project.id);
      navigate("/projects/home");
    }
  };

  return (
    <Stack>
      <Title order={2}>Danger Zone</Title>
      <Box>
        <Button
          onClick={handleDelete}
          color="red"
          variant="outline"
          rightSection={<IconTrash />}
        >
          Delete Project
        </Button>
      </Box>
    </Stack>
  );
};

type ProjectEditFormValues = {
  name: string;
  context: string;
  language: "en" | "nl" | "multi";
  default_conversation_title?: string;
  default_conversation_description?: string;
  default_conversation_context?: string;
};

const ProjectEdit = ({ project }: { project: TProject }) => {
  const defaultValues: ProjectEditFormValues = {
    name: project.name ?? "",
    context: project.context ?? "",
    language: (project.language as ProjectEditFormValues["language"]) ?? "en",
    default_conversation_title: project.default_conversation_title ?? "",
    default_conversation_description:
      project.default_conversation_description ?? "",
    default_conversation_context: project.default_conversation_context ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
  } = useForm<ProjectEditFormValues>({
    defaultValues,
  });

  const { isSuccess, ...updateProjectMutation } =
    useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectEditFormValues) => {
    updateProjectMutation.mutate({
      id: project.id,
      update: data,
    });
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(getValues());
    }
  }, [isSubmitSuccessful, getValues, reset]);

  return (
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Edit Project</Trans>
        </Title>
        {isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput label="Title" {...register("name")} />

          <Textarea
            label="Additional Context"
            rows={5}
            {...register("context")}
            placeholder="Additional Context"
          />
          <NativeSelect
            label="Language"
            {...register("language")}
            data={[
              {
                label: "English",
                value: "en",
              },
              {
                label: "Dutch",
                value: "nl",
              },
              {
                label: "Multilingual (Experimental)",
                value: "multi",
              },
            ]}
          />

          <Divider />

          <Box>
            <Title order={3}>Default Conversation Settings</Title>
            <Text size="sm">
              The following settings will be used as defaults for new
              conversations. These can also be changed per conversation using
              the conversation settings. These will be exposed to participants.
            </Text>
          </Box>

          <TextInput
            label="Title"
            {...register("default_conversation_title")}
            placeholder="Conversation Title"
          />

          <Textarea
            label="Description"
            description="Markdown is allowed here."
            rows={5}
            {...register("default_conversation_description")}
            placeholder="Conversation Description"
          />

          <Divider />

          <Box>
            <Title order={4}>Advanced Settings</Title>
            <Text size="sm">
              These are not exposed to participants but will be used to improve
              the quality of the transcripts.
            </Text>
          </Box>

          <Textarea
            label="Context"
            description={
              <Text size="xs">
                Use this field to add context about the session. You may choose
                to include proper nouns, names, or other information that may be
                relevant to the conversation. This will be used to improve the
                quality of the transcripts.{" "}
                <Anchor
                  href="https://cookbook.openai.com/examples/whisper_prompting_guide"
                  target="_blank"
                  rel="noreferrer"
                >
                  Link to Prompting Guide
                </Anchor>
              </Text>
            }
            rows={5}
            {...register("default_conversation_context")}
            placeholder="Conversation Additional Context"
          />

          <Group>
            <Button
              type="submit"
              loading={updateProjectMutation.isPending}
              disabled={!isDirty}
            >
              <Trans>Save</Trans>
            </Button>
            <Button
              type="reset"
              variant="outline"
              onClick={() => reset(defaultValues)}
              disabled={!isDirty}
            >
              <Trans>Cancel</Trans>
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};

export const ProjectOverviewRoute = () => {
  const projectId = useParams().projectId;
  const projectQuery = useProjectById(projectId ?? "");
  const resourcesQuery = useResourcesByProjectId(projectId ?? "");
  const conversationsQuery = useConversationsByProjectId(projectId ?? "");
  const updateProjectMutation = useUpdateProjectByIdMutation();

  const sharingLink = `${PARTICIPANT_BASE_URL}/${projectId}/login?pin=${projectQuery.data?.pin}`;

  const handleOpenForParticipationCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateProjectMutation.mutate({
      id: projectId ?? "",
      update: {
        is_conversation_allowed: e.target.checked,
      },
    });
  };

  return (
    <Stack className="py-6 px-2">
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
        <Paper p="md" shadow="0">
          <LoadingOverlay visible={projectQuery.isLoading} />
          {projectQuery.data?.is_conversation_allowed ? (
            <Stack>
              <Icons.Signal fill="green" />
              <span>
                <Trans>Active</Trans>
              </span>
            </Stack>
          ) : (
            <Stack>
              <Icons.Signal fill="gray" />
              <span>
                <Trans>Inactive</Trans>
              </span>
            </Stack>
          )}
        </Paper>
        <Paper p="md" shadow="0" className="relative">
          <LoadingOverlay visible={resourcesQuery.isLoading} />
          <Stack>
            <Icons.DocumentOutline />
            <span>{resourcesQuery.data?.length ?? 0} Resource(s)</span>
          </Stack>
        </Paper>
        <Paper p="md" shadow="0">
          <Stack>
            <Icons.Phone />
            <span>{conversationsQuery.data?.length ?? 0} Conversation(s)</span>
          </Stack>
        </Paper>
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
                label="Open for participation"
                description="Allow participants using the link to start new conversations"
                checked={projectQuery.data?.is_conversation_allowed}
                disabled={
                  updateProjectMutation.isPending || projectQuery.isFetching
                }
                onChange={handleOpenForParticipationCheckboxChange}
              />
            </Box>
            <Divider />
            <Title order={2}> Sharing</Title>
            {projectQuery.data?.is_conversation_allowed ? (
              <>
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
                  <Text size="md">Invite Link</Text>
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
                  </Group>
                </Box>{" "}
                <Box>
                  <Text size="md">QR Code</Text>
                  <Box className="h-auto max-w-32 w-full">
                    <QRCode value={sharingLink} className="h-full w-full" />
                  </Box>
                </Box>{" "}
                <Divider />
                <Title order={2}>Export</Title>
                <Box>
                  <Button
                    component="a"
                    href={getProjectTranscriptsLink(projectId ?? "")}
                    download={`${projectQuery.data.name ?? "Project"}-Transcripts.zip`}
                    rightSection={<IconDownload />}
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
