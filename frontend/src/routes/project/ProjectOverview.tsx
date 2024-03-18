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
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { IconCheck, IconCopy, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

type ProjectEditFormValues = {
  name: string;
  context: string;
  language: "en" | "nl";
};

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

const ProjectEdit = ({ project }: { project: TProject }) => {
  const defaultValues: ProjectEditFormValues = {
    name: project.name ?? "",
    context: project.context ?? "",
    language: (project.language as ProjectEditFormValues["language"]) ?? "en",
  };

  const { register, handleSubmit, formState, reset } =
    useForm<ProjectEditFormValues>({
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
    if (isSuccess) {
      reset();
    }
  }, [isSuccess, reset]);

  return (
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Edit Project</Trans>
        </Title>
        {formState.isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            {...register("name")}
            defaultValue={project.name}
          />
          <Textarea
            label="Additional Context"
            rows={5}
            {...register("context")}
            defaultValue={project.context}
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
            ]}
          />

          <Group>
            <Button
              type="submit"
              loading={updateProjectMutation.isPending}
              disabled={!formState.isDirty}
            >
              <Trans>Save</Trans>
            </Button>
            <Button
              type="reset"
              variant="outline"
              onClick={() => reset(defaultValues)}
              disabled={!formState.isDirty}
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

  const baseUrl = window.location.origin;
  const sharingLink = `${baseUrl}/participant/${projectId}/login?pin=${projectQuery.data?.pin}`;

  return (
    <Stack className="py-6 px-2">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Title order={1}>
        <Trans>Overview</Trans>
      </Title>
      <Divider />
      {/* Status */}
      <SimpleGrid
        cols={{
          sm: 1,
          md: 3,
        }}
      >
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
        <Paper p="md" shadow="0">
          <Stack>
            <Icons.Signal />
            <span>
              <Trans>Inactive</Trans>
            </span>
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
              <Title order={3}>
                <Trans>Access Code</Trans>
              </Title>
              <Text size="lg">
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
            </Box>
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
