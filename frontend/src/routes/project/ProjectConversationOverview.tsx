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
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { IconCheck, IconCopy, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  useConversationById,
  useDeleteConversationByIdMutation,
  useUpdateConversationByIdMutation,
} from "@/lib/query";

const ConversationDangerZone = ({
  conversation,
}: {
  conversation: TConversation;
}) => {
  const deleteConversationByIdMutation = useDeleteConversationByIdMutation();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteConversationByIdMutation.mutate(conversation.id);
      navigate("/projects/" + projectId + "/overview");
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
          Delete Conversation
        </Button>
      </Box>
    </Stack>
  );
};

type ConversationEditFormValues = {
  title: string;
  description: string;
  context: string;
};

const ConversationEdit = ({
  conversation,
}: {
  conversation: TConversation;
}) => {
  const { isSuccess, ...updateConversationMutation } =
    useUpdateConversationByIdMutation();

  const defaultValues: ConversationEditFormValues = {
    title: conversation.title ?? "",
    description: conversation.description ?? "",
    context: conversation.context ?? "",
  };

  const { register, handleSubmit, formState, reset } =
    useForm<ConversationEditFormValues>({
      defaultValues,
    });

  useEffect(() => {
    if (isSuccess) {
      reset({
        title: conversation.title,
        description: conversation.description,
        context: conversation.context,
      });
    }
  }, [isSuccess, reset]);

  const onSubmit = (data: ConversationEditFormValues) => {
    updateConversationMutation.mutate({
      id: conversation.id,
      update: data,
    });
  };

  return (
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Edit Conversation</Trans>
        </Title>
        {formState.isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="Conversation Title"
            description="This is shown to participants"
            {...register("title")}
            defaultValue={conversation.title}
          />
          <Textarea
            label="Description"
            placeholder="Conversation Description"
            description="This is shown to participants"
            rows={6}
            {...register("description")}
            defaultValue={conversation.description}
          />
          <Divider />
          <Textarea
            label="Additional Context"
            description="This is hidden from participants"
            placeholder="Additional Context for the Conversation"
            rows={6}
            {...register("context")}
            defaultValue={conversation.context}
          />

          <Group>
            <Button
              type="submit"
              loading={updateConversationMutation.isPending}
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

export const ProjectConversationOverviewRoute = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById(conversationId ?? "");

  return (
    <Stack className="relative">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      <Box>
        <Text size="md">Email</Text>
        <Text size="sm">{conversationQuery.data?.participant_email}</Text>
      </Box>
      <Box>
        <Text size="md">Created on</Text>
        <Text size="sm">
          {conversationQuery.data?.created_at.toLocaleString()}
        </Text>
      </Box>
      <Divider />
      {conversationQuery.data && (
        <>
          <ConversationEdit conversation={conversationQuery.data} />
          <Divider />
          <ConversationDangerZone conversation={conversationQuery.data} />
        </>
      )}
    </Stack>
  );
};
