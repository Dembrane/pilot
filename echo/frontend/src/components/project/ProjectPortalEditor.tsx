import React, { useEffect, useRef, useState } from "react";
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
  Box,
  Pill,
  Text,
  Paper,
} from "@mantine/core";
import { ProjectTagsInput } from "./ProjectTagsInput";
import { MarkdownWYSIWYG } from "../common/MarkdownWYSIWYG/MarkdownWYSIWYG";
import { Trans, t } from "@lingui/macro";
import { Controller, useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX, IconEye, IconEyeOff, IconRefresh } from "@tabler/icons-react";
import { UnsavedChanges } from "../form/UnsavedChanges";
import { CloseableAlert } from "../common/ClosableAlert";
import { useProjectSharingLink } from "./ProjectQRCode";
import { Resizable } from "re-resizable";

type ProjectPortalFormValues = {
  default_conversation_tutorial_slug: string;
  default_conversation_ask_for_participant_name: boolean;
  default_conversation_title: string;
  default_conversation_description: string;
  default_conversation_finish_text: string;
  language: "en" | "nl" | "de" | "fr" | "es";
  default_conversation_transcript_prompt: string;
};

export const ProperNounInput = ({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}) => {
  const splitValue = (value: string) => value.split(", ").filter(Boolean);

  const [nouns, setNouns] = useState<string[]>(splitValue(value));

  useEffect(() => {
    setNouns(splitValue(value));
  }, [value]);

  const [nounInput, setNounInput] = useState("");

  const handleAddNoun = () => {
    if (nounInput.trim()) {
      const updatedNouns = [...nouns, nounInput.trim()];
      setNouns(updatedNouns);
      setValue(updatedNouns.join(", "));
    }
  };

  const handleRemoveNoun = (noun: string) => {
    const updatedNouns = nouns.filter((n) => n !== noun);
    setNouns(updatedNouns);
    setValue(updatedNouns.join(", "));
  };

  return (
    <Stack gap="md">
      <TextInput
        label={<Trans>Specific Context</Trans>}
        description={
          <Trans>
            Add key terms or proper nouns to improve transcript quality and
            accuracy.
          </Trans>
        }
        value={nounInput}
        onChange={(e) => setNounInput(e.currentTarget.value)}
        placeholder={t`Enter a key term or proper noun`}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddNoun();
          }
        }}
      />
      <Group gap="xs">
        {nouns.map((noun, index) => (
          <Pill
            key={index}
            withRemoveButton
            onRemove={() => handleRemoveNoun(noun)}
          >
            {noun}
          </Pill>
        ))}
      </Group>
    </Stack>
  );
};

export const ProjectPortalEditor = ({ project }: { project: Project }) => {
  const [showPreview, setShowPreview] = useState(true);
  const link = useProjectSharingLink(project);

  const [previewKey, setPreviewKey] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(400);
  const [previewHeight, setPreviewHeight] = useState(300);

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
    default_conversation_transcript_prompt:
      project.default_conversation_transcript_prompt ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
    control,
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
    console.log("handleFormBlur", event.relatedTarget);
    if (isDirty && event.relatedTarget !== cancelButtonRef.current) {
      handleSubmit(onSubmit)(event);
    }
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(getValues());
    }
  }, [isSubmitSuccessful, getValues, reset]);

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Stack gap="3rem" px="2rem" pt="4rem" pb="4rem">
        <Group justify="space-between">
          <Group>
            <Title order={2}>
              <Trans>Portal Editor</Trans>
            </Title>
            <UnsavedChanges isDirty={isDirty} />
          </Group>
          <Button
            variant="subtle"
            onClick={() => setShowPreview(!showPreview)}
            leftSection={
              showPreview ? <IconEyeOff size={16} /> : <IconEye size={16} />
            }
          >
            <Trans>{showPreview ? "Hide Preview" : "Show Preview"}</Trans>
          </Button>

          <div className="w-full">
            <CloseableAlert>
              <Trans>
                The Portal is the website that loads when participants scan the
                QR code.
              </Trans>
            </CloseableAlert>
          </div>
        </Group>

        <div className="relative flex h-auto flex-col gap-8 lg:flex-row lg:justify-start">
          <div className="max-w-[800px] flex-1">
            <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
              <Stack gap="3rem">
                <Stack gap="1.5rem">
                  <Title order={3}>Basic Settings</Title>
                  <Stack gap="2rem">
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
                          Ask participants to provide their name when they start
                          a conversation
                        </Trans>
                      }
                      {...register(
                        "default_conversation_ask_for_participant_name",
                      )}
                    />
                    <NativeSelect
                      label={<Trans>Select tutorial</Trans>}
                      description={
                        <Trans>
                          Select the instructions that will be shown to
                          participants when they start a conversation
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
                  </Stack>
                </Stack>

                <Divider />

                <Stack gap="1.5rem">
                  <Title order={3}>Portal Content</Title>
                  <Stack gap="2rem">
                    <TextInput
                      label={
                        <Text size="sm" fw={500}>
                          Page Title
                        </Text>
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
                      <Text size="sm" fw={500}>
                        Page Content
                      </Text>
                      <InputDescription>
                        <Trans>
                          This page is shown to participants when they start a
                          conversation after they successfully complete the
                          tutorial.
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
                      <Text size="sm" fw={500}>
                        Thank You Page Content
                      </Text>
                      <InputDescription>
                        <Trans>
                          This page is shown after the participant has completed
                          the conversation.
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
                </Stack>

                <Divider />

                <Stack gap="1.5rem">
                  <Title order={3}>Advanced Settings</Title>
                  <Controller
                    control={control}
                    name="default_conversation_transcript_prompt"
                    render={({ field }) => (
                      <ProperNounInput
                        value={field.value}
                        setValue={field.onChange}
                      />
                    )}
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
          </div>

          {showPreview && link && (
            <div className="relative">
              <div className="sticky top-4 min-h-[60vh]">
                <Resizable
                  size={{ width: previewWidth, height: previewHeight }}
                  minWidth={300}
                  maxWidth={500}
                  minHeight="70vh"
                  maxHeight="100vh"
                  onResizeStop={(_e, _direction, _ref, d) => {
                    setPreviewWidth(previewWidth + d.width);
                    setPreviewHeight(previewHeight + d.height);
                  }}
                  enable={{
                    left: true,
                    bottom: true,
                    right: false,
                    bottomLeft: false,
                    bottomRight: false,
                    top: false,
                    topLeft: false,
                    topRight: false,
                  }}
                  handleStyles={{
                    left: {
                      width: "8px",
                      left: "-4px",
                      cursor: "col-resize",
                    },
                    bottom: {
                      height: "8px",
                      bottom: "-4px",
                      cursor: "row-resize",
                    },
                  }}
                  handleClasses={{
                    left: "hover:bg-blue-500/20",
                    bottom: "hover:bg-blue-500/20",
                  }}
                >
                  <Paper
                    shadow="sm"
                    withBorder
                    className="flex h-full flex-col"
                  >
                    <Stack gap="xs" px="md" py="md">
                      <Group justify="space-between">
                        <Title order={4}>
                          <Trans>Live Preview</Trans>
                        </Title>
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          onClick={refreshPreview}
                          leftSection={<IconRefresh size={16} />}
                        >
                          <Trans>Refresh</Trans>
                        </Button>
                      </Group>
                      <Text size="sm" c="dimmed">
                        <Trans>
                          This is a live preview of the participant's portal.
                          You will need to refresh the page to see the latest
                          changes.
                        </Trans>
                      </Text>
                    </Stack>

                    <Divider />

                    <iframe
                      key={previewKey}
                      src={link}
                      className="h-full w-full flex-1 bg-white"
                      title="Portal Preview"
                    />
                  </Paper>
                </Resizable>
              </div>
            </div>
          )}
        </div>
      </Stack>
    </Box>
  );
};
