import React, { useEffect, useRef } from "react";
import {
  Stack,
  Group,
  Title,
  TextInput,
  Textarea,
  NativeSelect,
  Button,
} from "@mantine/core";
import { Trans } from "@lingui/macro";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX } from "@tabler/icons-react";

type ProjectEditFormValues = {
  name: string;
  context: string;
  language: "en" | "nl";
};

type ProjectBasicEditProps = {
  project: Project;
};

export const ProjectBasicEdit: React.FC<ProjectBasicEditProps> = ({
  project,
}) => {
  const defaultValues: ProjectEditFormValues = {
    name: project.name ?? "",
    context: project.context ?? "",
    language: (project.language as ProjectEditFormValues["language"]) ?? "en",
  };

  const {
    register,
    handleSubmit,
    formState: { isSubmitSuccessful, isDirty, dirtyFields },
    reset,
    getValues,
  } = useForm<ProjectEditFormValues>({
    defaultValues,
  });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectEditFormValues) => {
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
          <Trans>Edit Project</Trans>
        </Title>
        {isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack className="relative">
          <TextInput label="Title" {...register("name")} />
          <Textarea
            label="Description"
            rows={4}
            {...register("context")}
            placeholder="How would you describe to a colleague what are you trying to accomplish with this project?

* What is the north star goal or key metric
* What does success look like"
          />
          <NativeSelect
            label="Language"
            {...register("language")}
            data={[
              { label: "English", value: "en" },
              { label: "Dutch", value: "nl" },
            ]}
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

export default ProjectBasicEdit;
