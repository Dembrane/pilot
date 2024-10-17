import React, { useEffect, useRef } from "react";
import {
  Stack,
  Group,
  Title,
  Divider,
  Button,
  NativeSelect,
  Checkbox,
  InputDescription,
  Alert,
  TextInput,
} from "@mantine/core";
import { ProjectTagsInput } from "./ProjectTagsInput";
import { MarkdownWYSIWYG } from "../common/MarkdownWYSIWYG/MarkdownWYSIWYG";
import { t, Trans } from "@lingui/macro";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX } from "@tabler/icons-react";
import DembraneLoadingSpinner from "../common/DembraneLoadingSpinner";
import { UnsavedChanges } from "../form/UnsavedChanges";

type ProjectPortalFormValues = {
  default_conversation_tutorial_slug: string;
  default_conversation_ask_for_participant_name: boolean;
  default_conversation_title: string;
  default_conversation_description: string;
  default_conversation_finish_text: string;
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
      <Alert withCloseButton>
        <Trans>
          The Portal is the website that loads when participants scan the QR
          code.
        </Trans>
      </Alert>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack gap="lg">
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
                value: "none",
                label: t`No tutorial (only Privacy statements)`,
              },
              {
                value: "basic",
                label: t`Basic (Essential tutorial slides)`,
              },
              {
                value: "advanced",
                label: t`Advanced (Tips and tricks)`,
              },
            ]}
            {...register("default_conversation_tutorial_slug")}
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
