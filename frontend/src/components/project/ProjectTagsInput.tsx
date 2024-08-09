import {
  useCreateProjectTagMutation,
  useDeleteTagByIdMutation,
  useProjectById,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Pill,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
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
    createTagMutation.mutate({
      project_id: {
        id: props.project.id,
        directus_user_id: props.project.directus_user_id,
      },
      text: tagInput,
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
        <Title order={4}>Tags</Title>
        <Group gap="sm" ref={parent}>
          {(projectQuery.data?.tags?.length ?? 0) === 0 && (
            <Text size="sm">
              No tags have been added to this project yet. Add a tag using the
              text input below to get started.
            </Text>
          )}
          {projectQuery.data?.tags?.map((tag) => (
            <ProjectTagPill key={tag.id} tag={tag} />
          ))}
        </Group>
      </Box>
      <Box>
        {createTagMutation.isError && (
          <Text c="red" size="sm">
            {createTagMutation.error.message}
          </Text>
        )}
        <Group align="end">
          <TextInput
            label="Add Tag"
            description="Participants will be able to select tags when creating conversations"
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
            Add Tag
          </Button>
        </Group>
      </Box>
    </Stack>
  );
};
