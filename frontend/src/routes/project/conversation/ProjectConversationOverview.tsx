import { Trans } from "@lingui/macro";
import {
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  TextInput,
  Textarea,
  Title,
  Text,
  Tooltip,
  ActionIcon,
  Anchor,
  Pill,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import {
  useConversationById,
  useConversationChunks,
  useDeleteConversationByIdMutation,
  useUpdateConversationByIdMutation,
} from "@/lib/query";
import { apiCommonConfig } from "@/lib/api";

const ConversationDangerZone = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const deleteConversationByIdMutation = useDeleteConversationByIdMutation();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteConversationByIdMutation.mutate(conversation.id);
      navigate(`/projects/` + projectId + "/overview");
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

const ConversationEdit = ({ conversation }: { conversation: Conversation }) => {
  const updateConversationMutation = useUpdateConversationByIdMutation();

  const defaultValues: ConversationEditFormValues = {
    title: conversation.title ?? "",
    description: conversation.description ?? "",
    context: conversation.context ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { isDirty, isSubmitSuccessful },
    reset,
    getValues,
  } = useForm<ConversationEditFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(getValues());
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = (data: ConversationEditFormValues) => {
    updateConversationMutation.mutate({
      id: conversation.id,
      payload: data,
    });
  };

  return (
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Edit Conversation</Trans>
        </Title>
        {isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            {...register("title")}
            placeholder="Conversation Title"
          />

          <Textarea
            label="Description"
            description="Markdown is allowed here."
            rows={5}
            {...register("description")}
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

          <Box>
            <Textarea
              label="Context"
              description={
                <Text size="xs">
                  Use this field to add context about the session. You may
                  choose to include proper nouns, names, or other information
                  that may be relevant to the conversation. This will be used to
                  improve the quality of the transcripts.{" "}
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
              {...register("context")}
              placeholder="Conversation Additional Context"
            />
          </Box>
          <Group>
            <Button
              type="submit"
              loading={updateConversationMutation.isPending}
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

export const ProjectConversationOverviewRoute = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
  });
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");

  return (
    <Stack className="relative">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      {conversationChunksQuery.data &&
        conversationChunksQuery.data?.length > 0 && (
          <Stack>
            {conversationQuery.data?.summary && (
              <>
                <Title order={2}>Summary</Title>

                <Text>{conversationQuery.data?.summary}</Text>
                <Divider />
              </>
            )}

            <Group align="center">
              <Title order={2}>Audio Recording</Title>
              <Tooltip label="Download audio">
                <a
                  href={
                    apiCommonConfig.baseURL +
                    "/conversations/" +
                    conversationId +
                    "/content"
                  }
                  download={
                    conversationQuery.data?.title ?? "Conversation" + ".webm"
                  }
                >
                  <ActionIcon size="md" variant="subtle" color="gray">
                    <IconDownload size={48} />
                  </ActionIcon>
                </a>
              </Tooltip>
            </Group>
            <audio
              className="w-full"
              src={
                apiCommonConfig.baseURL +
                "/conversations/" +
                conversationId +
                "/content"
              }
              controls
              crossOrigin="anonymous"
            />
          </Stack>
        )}
      <Divider />

      <Box>
        <Text size="md">Name</Text>
        <Text size="sm">{conversationQuery.data?.participant_name}</Text>
      </Box>
      {conversationQuery.data?.participant_email && (
        <Box>
          <Text size="md">Email</Text>
          <Text size="sm">{conversationQuery.data?.participant_email}</Text>
        </Box>
      )}

      <Box>
        <Text size="md">Created on</Text>
        <Text size="sm">
          {new Date(conversationQuery.data?.created_at ?? 0).toLocaleString()}
        </Text>
      </Box>
      {conversationQuery.data?.tags &&
        conversationQuery.data.tags.filter(
          (t) => !!(t.project_tag_id as ProjectTag)?.text,
        ).length > 0 && (
          <Box>
            <Text size="md">Tags</Text>
            <Group gap="sm" pr="sm">
              {conversationQuery.data?.tags &&
                conversationQuery.data?.tags.length > 0 &&
                conversationQuery.data?.tags.map((tag) =>
                  (tag.project_tag_id as ProjectTag)?.text ? (
                    <Pill key={tag.id} size="sm">
                      {(tag.project_tag_id as ProjectTag)?.text}
                    </Pill>
                  ) : null,
                )}
            </Group>
          </Box>
        )}
      <Divider />
      {conversationQuery.data && (
        <>
          {/* <ConversationEdit conversation={conversationQuery.data} />
          <Divider /> */}
          <ConversationDangerZone conversation={conversationQuery.data} />
        </>
      )}
    </Stack>
  );
};
