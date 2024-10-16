import { Trans, t } from "@lingui/macro";
import {
  Stack,
  Textarea,
  Text,
  Title,
  Group,
  Button,
  Tooltip,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import React, { useEffect, useRef } from "react";
import { UnsavedChanges } from "../form/UnsavedChanges";

type ProjectTranscriptSettingsFormValues = {
  default_conversation_transcript_prompt: string;
};

export const ProjectTranscriptSettings = ({
  project,
}: {
  project: Project;
}) => {
  const defaultValues: ProjectTranscriptSettingsFormValues = {
    default_conversation_transcript_prompt:
      project.default_conversation_transcript_prompt ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty, dirtyFields },
    reset,
    getValues,
  } = useForm<ProjectTranscriptSettingsFormValues>({
    defaultValues,
  });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectTranscriptSettingsFormValues) => {
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
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Transcript Settings</Trans>
        </Title>
        {isDirty && <UnsavedChanges />}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack className="relative">
          <Textarea
            label={t`Specific Context`}
            description={
              <Trans>
                Provide specific context to improve transcript quality and
                accuracy. This may include key terms, specific instructions, or
                other relevant information.
              </Trans>
            }
            {...register("default_conversation_transcript_prompt")}
            autosize
            minRows={4}
            placeholder={t`Example: This conversation is about [topic]. Key terms include [term1], [term2]. Please pay special attention to [specific aspect].`}
          />
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
