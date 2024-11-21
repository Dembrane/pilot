import React, { useEffect, useRef } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Group,
  InputDescription,
  NativeSelect,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { ProjectTagsInput } from "./ProjectTagsInput";
import { MarkdownWYSIWYG } from "../common/MarkdownWYSIWYG/MarkdownWYSIWYG";
import { Trans, t } from "@lingui/macro";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX } from "@tabler/icons-react";
import { UnsavedChanges } from "../form/UnsavedChanges";
import { CloseableAlert } from "../common/ClosableAlert";

type ProjectPortalFormValues = {
  default_conversation_tutorial_slug: string;
  default_conversation_ask_for_participant_name: boolean;
  default_conversation_title: string;
  default_conversation_description: string;
  default_conversation_finish_text: string;
  language: "en" | "nl" | "de" | "fr" | "es";
};

export const ProjectPortalEditor = ({ project }: { project: Project }) => {
  const defaultValues: ProjectPortalFormValues = {
    default_conversation_tutorial_slug:
      project.default_conversation_tutorial_slug ?? "none",
    default_conversation_ask_for_participant_name:
      project.default_conversation_ask_for_participant_name ?? false,
    default_conversation_title: project.default_conversation_title ?? "",
    default_conversation_description:
      project.default_conversation_description ?? "",
    default_conversation_finish_text:
      project.default_conversation_finish_text ?? "",
    language: (project.language as "en" | "nl" | "de" | "fr" | "es") ?? "en",
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
    setValue,
  } = useForm<ProjectPortalFormValues>({
    defaultValues,
  });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectPortalFormValues) => {
    if (isDirty) {
      updateProjectMutation.mutateAsync({
        id: project.id,
        payload: data,
      });
    }
  };

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleFormBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    if (isDirty && event.relatedTarget !== cancelButtonRef.current) {
      handleSubmit(onSubmit)(event);
    }
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(getValues());
    }
  }, [isSubmitSuccessful, getValues, reset]);

  return (
    <Stack gap="lg">
      <Group>
        <Title order={2}>
          <Trans>Portal Editor</Trans>
        </Title>
        {isDirty && <UnsavedChanges />}
      </Group>
      <CloseableAlert>
        <Trans>
          The Portal is the website that loads when participants scan the QR
          code.
        </Trans>
      </CloseableAlert>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack gap="lg">
          <NativeSelect
            label={t`Language`}
            description={t`This language will be used for the Participant's Portal and transcription. To change the language of this application, please use the language picker through the settings in the header.`}
            {...register("language")}
            data={[
              { label: t`English`, value: "en" },
              { label: t`Dutch`, value: "nl" },
              { label: t`German`, value: "de" },
              { label: t`Spanish`, value: "es" },
              { label: t`French`, value: "fr" },
            ]}
          />
          <Checkbox
            label={<Trans>Ask for Name?</Trans>}
            description={
              <Trans>
                Ask participants to provide their name when they start a
                conversation
              </Trans>
            }
            {...register("default_conversation_ask_for_participant_name")}
          />
          <NativeSelect
            label={<Trans>Select tutorial</Trans>}
            description={
              <Trans>
                Select the instructions that will be shown to participants when
                they start a conversation
              </Trans>
            }
            data={[
              {
                label: t`No tutorial (only Privacy statements)`,
                value: "none",
              },
              {
                label: t`Basic (Essential tutorial slides)`,
                value: "basic",
              },
              {
                label: t`Advanced (Tips and tricks)`,
                value: "advanced",
              },
            ]}
            {...register("default_conversation_tutorial_slug")}
          />

          <ProjectTagsInput project={project} />

          <Divider />
          <TextInput
            label={
              <Title order={3}>
                <Trans>Page Title</Trans>
              </Title>
            }
            description={
              <Trans>
                This title is shown to participants when they start a
                conversation
              </Trans>
            }
            {...register("default_conversation_title")}
          />
          <Stack gap="xs">
            <Title order={3}>
              <Trans>Page Content</Trans>
            </Title>
            <InputDescription>
              <Trans>
                This page is shown to participants when they start a
                conversation after they successfully complete the tutorial.
              </Trans>
            </InputDescription>
            <MarkdownWYSIWYG
              markdown={getValues("default_conversation_description")}
              onChange={(value) =>
                setValue("default_conversation_description", value, {
                  shouldDirty: true,
                })
              }
            />
          </Stack>
          <Stack gap="xs">
            <Title order={3}>
              <Trans>Thank You Page Content</Trans>
            </Title>
            <InputDescription>
              <Trans>
                This page is shown after the participant has completed the
                conversation.
              </Trans>
            </InputDescription>
            <MarkdownWYSIWYG
              markdown={getValues("default_conversation_finish_text")}
              onChange={(value) =>
                setValue("default_conversation_finish_text", value, {
                  shouldDirty: true,
                })
              }
            />
          </Stack>
        </Stack>
      </form>
      <Group>
        {isDirty && (
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={() => reset(defaultValues)}
            rightSection={<IconX />}
          >
            <Trans>Cancel</Trans>
          </Button>
        )}
      </Group>
    </Stack>
  );
};
