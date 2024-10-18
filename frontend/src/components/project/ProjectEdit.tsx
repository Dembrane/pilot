import { ProjectTagsInput } from "@/components/project/ProjectTagsInput";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Stack,
  Group,
  Text,
  Title,
  TextInput,
  Textarea,
  NativeSelect,
  Divider,
  Box,
  Anchor,
  Button,
} from "@mantine/core";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type ProjectEditFormValues = {
  name: string;
  context: string;
  language: "en" | "nl" | "multi";
  default_conversation_title?: string;
  default_conversation_description?: string;
  default_conversation_context?: string;
  default_conversation_finish_text?: string;
};

export const ProjectEdit = ({ project }: { project: Project }) => {
  const defaultValues: ProjectEditFormValues = {
    name: project.name ?? "",
    context: project.context ?? "",
    language: (project.language as ProjectEditFormValues["language"]) ?? "en",
    default_conversation_title: project.default_conversation_title ?? "",
    default_conversation_description:
      project.default_conversation_description ?? "",
    default_conversation_context:
      project.default_conversation_transcript_prompt ?? "",
    default_conversation_finish_text:
      project.default_conversation_finish_text ?? "",
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

  useEffect(() => {
    const updatedValues = {
      name: project.name ?? "",
      context: project.context ?? "",
      language: (project.language as ProjectEditFormValues["language"]) ?? "en",
      default_conversation_title: project.default_conversation_title ?? "",
      default_conversation_description:
        project.default_conversation_description ?? "",
      default_conversation_context:
        project.default_conversation_transcript_prompt ?? "",
      default_conversation_finish_text:
        project.default_conversation_finish_text ?? "",
    };

    reset(updatedValues);
  }, [project]);

  const { isSuccess, ...updateProjectMutation } =
    useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectEditFormValues) => {
    updateProjectMutation.mutate({
      id: project.id,
      payload: data,
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
            description="Changing this will affect the language of transcripts for new conversations"
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

          <ProjectTagsInput project={project} />

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

          <Textarea
            label="Post Conversation Text"
            description="This will be shown to participants after they finish a conversation. Markdown is allowed here. The following variables are supported. {{CONVERSATION_ID}}, {{PROJECT_ID}}"
            rows={5}
            {...register("default_conversation_finish_text")}
            placeholder="Post Conversation Text"
          />

          <Box>
            <Title order={4}>Advanced Settings</Title>
            <Text size="sm">
              These are not exposed to participants but will be used to improve
              the quality of the transcripts for new conversations
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
