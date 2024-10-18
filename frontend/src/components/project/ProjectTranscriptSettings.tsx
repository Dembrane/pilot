import { Trans, t } from "@lingui/macro";
import {
  Stack,
  Text,
  Title,
  Group,
  Button,
  TextInput,
  Pill,
  Box,
  Alert,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX } from "@tabler/icons-react";
import React, { useState, useEffect, useRef } from "react";
import { UnsavedChanges } from "../form/UnsavedChanges";

type ProjectTranscriptSettingsFormValues = {
  default_conversation_transcript_prompt: string;
};

export const ProjectTranscriptSettings = ({
  project,
}: {
  project: Project;
}) => {
  const [properNouns, setProperNouns] = useState<string[]>(
    project.default_conversation_transcript_prompt
      ? project.default_conversation_transcript_prompt
          .split(", ")
          .filter(Boolean)
      : [],
  );
  const [nounInput, setNounInput] = useState("");

  const defaultValues: ProjectTranscriptSettingsFormValues = {
    default_conversation_transcript_prompt:
      project.default_conversation_transcript_prompt ?? "",
  };

  const {
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
  } = useForm<ProjectTranscriptSettingsFormValues>({
    defaultValues,
  });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSubmit = () => {
    const updatedPrompt = properNouns.join(", ");
    updateProjectMutation.mutateAsync({
      id: project.id,
      payload: {
        default_conversation_transcript_prompt: updatedPrompt,
      },
    });
  };

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleAddNoun = () => {
    if (nounInput.trim()) {
      setProperNouns([...properNouns, nounInput.trim()]);
      setNounInput("");
      onSubmit();
    }
  };

  const handleRemoveNoun = (noun: string) => {
    const updatedNouns = properNouns.filter((n) => n !== noun);
    setProperNouns(updatedNouns);
    onSubmit();
  };

  const handleFormBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    if (event.relatedTarget !== cancelButtonRef.current) {
      onSubmit();
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
          <Box>
            <Group align="end">
              <TextInput
                label={t`Specific Context`}
                description={
                  <Trans>
                    Add key terms or proper nouns to improve transcript quality
                    and accuracy.
                  </Trans>
                }
                value={nounInput}
                onChange={(e) => setNounInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNoun();
                  }
                }}
                placeholder={t`Enter a key term or proper noun`}
              />
              <Button
                onClick={handleAddNoun}
                variant="outline"
                disabled={!nounInput.trim()}
              >
                <Trans>Add</Trans>
              </Button>
            </Group>
            <Group mt="sm" gap="xs">
              {properNouns.map((noun, index) => (
                <Pill
                  key={index}
                  withRemoveButton
                  onRemove={() => handleRemoveNoun(noun)}
                >
                  {noun}
                </Pill>
              ))}
            </Group>
            {properNouns.length === 0 && (
              <Alert mt="sm">
                <Text size="sm">
                  <Trans>
                    No key terms or proper nouns have been added yet. Add them
                    using the input above to improve transcript accuracy.
                  </Trans>
                </Text>
              </Alert>
            )}
          </Box>
        </Stack>
      </form>
      <Group>
        {isDirty && (
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={() => {
              reset(defaultValues);
              setProperNouns(
                defaultValues.default_conversation_transcript_prompt
                  .split(", ")
                  .filter(Boolean),
              );
            }}
            rightSection={<IconX />}
          >
            <Trans>Cancel</Trans>
          </Button>
        )}
      </Group>
    </Stack>
  );
};
