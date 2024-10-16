import {
  useCreateProjectTagMutation,
  useDeleteTagByIdMutation,
  useProjectById,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { t, Trans } from "@lingui/macro";
import {
  Alert,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Pill,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";

export const ProjectTagPill = ({ tag }: { tag: ProjectTag }) => {
  const deleteTagMutation = useDeleteTagByIdMutation();

  if (!tag || !tag.text) {
    return null;
  }

  return (
    <Pill
      size="md"
      withRemoveButton
      disabled={deleteTagMutation.isPending}
      onRemove={() => {
        deleteTagMutation.mutate(tag.id);
      }}
    >
      {tag.text}
    </Pill>
  );
};

export const ProjectTagsInput = (props: { project: Project }) => {
  const projectQuery = useProjectById({ projectId: props.project.id });
  const createTagMutation = useCreateProjectTagMutation();

  const [tagInput, setTagInput] = useState("");

  const [parent] = useAutoAnimate();

  const handleSubmit = () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    tags.forEach((tag) => {
      createTagMutation.mutate({
        project_id: {
          id: props.project.id,
          directus_user_id: (props.project.directus_user_id as string) ?? "",
        },
        text: tag,
      });
    });
    setTagInput("");
  };

  if (projectQuery.isLoading) {
    return (
      <Stack>
        <Skeleton height={30} />
      </Stack>
    );
  }

  return (
    <Stack className="relative">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Box>
        {createTagMutation.isError && (
          <Text c="red" size="sm">
            {createTagMutation.error.message}
          </Text>
        )}
        <Stack gap="sm">
          <Group align="end">
            <TextInput
              label={t`Tags`}
              description={t`Participants will be able to select tags when creating conversations`}
              value={tagInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              onChange={(e) => setTagInput(e.currentTarget.value)}
            />
            <Button
              loading={createTagMutation.isPending}
              onClick={handleSubmit}
              variant="outline"
              disabled={!tagInput.trim()}
            >
              {tagInput.includes(",") ? t`Add Tags` : t`Add Tag`}
            </Button>
          </Group>
          <Group gap="sm" ref={parent}>
            {(projectQuery.data?.tags?.length ?? 0) === 0 && (
              <Alert>
                <Text size="sm">
                  <Trans>
                    No tags have been added to this project yet. Add a tag using
                    the text input above to get started.
                  </Trans>
                </Text>
              </Alert>
            )}
            {projectQuery.data?.tags?.map((tag) => (
              <ProjectTagPill key={tag.id} tag={tag} />
            ))}
          </Group>
        </Stack>
      </Box>
    </Stack>
  );
};