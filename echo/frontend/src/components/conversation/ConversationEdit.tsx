import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Group,
  MultiSelect,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Trans, t } from "@lingui/macro";
import { Controller, useForm } from "react-hook-form";
import {
  useUpdateConversationByIdMutation,
  useUpdateConversationTagsMutation,
} from "@/lib/query";
import { IconX } from "@tabler/icons-react";
import { UnsavedChanges } from "../form/UnsavedChanges";
import { CloseableAlert } from "../common/ClosableAlert";

type ConversationEditFormValues = {
  participant_name: string;
  tagIdList: string[];
};

export const ConversationEdit = ({
  conversation,
  projectTags,
}: {
  conversation: Conversation;
  projectTags: ProjectTag[];
}) => {
  const defaultValues: ConversationEditFormValues = {
    participant_name: conversation.participant_name ?? "",
    tagIdList:
      conversation.tags
        ?.filter((tag) => tag.project_tag_id != null)
        .map((tag) => tag.project_tag_id.id) ?? [],
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
    setValue,
    control,
  } = useForm<ConversationEditFormValues>({
    defaultValues,
  });

  const updateConversationMutation = useUpdateConversationByIdMutation();
  const updateConversationTagsMutation = useUpdateConversationTagsMutation();

  const onSubmit = useCallback(
    async (data: ConversationEditFormValues) => {
      if (isDirty) {
        await updateConversationMutation.mutateAsync({
          id: conversation.id,
          payload: {
            participant_name: data.participant_name,
          },
        });

        await updateConversationTagsMutation.mutateAsync({
          conversationId: conversation.id,
          projectId: conversation.project_id as string,
          projectTagIdList: data.tagIdList,
        });
      }
    },
    [
      isDirty,
      updateConversationMutation,
      conversation.id,
      conversation.project_id,
      updateConversationTagsMutation,
    ],
  );

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleFormBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    if (isDirty && event.relatedTarget !== cancelButtonRef.current) {
      handleSubmit(onSubmit)(event);
    }
  };

  const [lastTagChange, setLastTagChange] = useState<number | null>(null);

  useEffect(() => {
    if (lastTagChange !== null) {
      const timer = setTimeout(() => {
        handleSubmit(onSubmit)();
      }, 250); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [lastTagChange, handleSubmit, onSubmit]);

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(getValues());
    }
  }, [isSubmitSuccessful, getValues, reset]);

  return (
    <Stack key={conversation.id}>
      <Group>
        <Title order={2}>
          <Trans>Edit Conversation</Trans>
        </Title>
        <UnsavedChanges isDirty={isDirty} />
      </Group>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack className="relative">
          {updateConversationMutation.error && (
            <CloseableAlert color="red">
              <Text size="sm">
                <Trans>Something went wrong</Trans>
              </Text>
            </CloseableAlert>
          )}

          <Box>
            <Text size="md">
              <Trans>Created on</Trans>
            </Text>
            <Text size="sm">
              {new Date(conversation.created_at).toLocaleString()}
            </Text>
          </Box>

          <TextInput label={t`Name`} {...register("participant_name")} />

          {projectTags && projectTags.length > 0 ? (
            <Controller
              name="tagIdList"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  label={t`Tags`}
                  data={projectTags
                    .filter((tag) => tag && tag.id != null && tag.text != null)
                    .map((tag) => ({
                      value: tag.id ?? "",
                      label: tag.text ?? "",
                    }))}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("tagIdList", value, { shouldDirty: true });
                    setLastTagChange(Date.now());
                  }}
                />
              )}
            />
          ) : (
            <>
              <CloseableAlert color="blue">
                <Text size="sm">
                  <Trans>
                    To assign a new tag, please create it first in the project
                    overview.
                  </Trans>
                </Text>
              </CloseableAlert>
              <Text>
                <Trans>No tags found</Trans>
              </Text>
            </>
          )}
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
