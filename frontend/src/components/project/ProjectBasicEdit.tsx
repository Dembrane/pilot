import React, { useEffect } from "react";
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
import { IconDeviceFloppy } from "@tabler/icons-react";

type ProjectEditFormValues = {
  name: string;
  context: string;
  language: "en" | "nl" | "multi";
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
    formState: { isSubmitSuccessful, isDirty },
    reset,
    getValues,
  } = useForm<ProjectEditFormValues>({
    defaultValues,
  });

  const updateProjectMutation = useUpdateProjectByIdMutation();

  const onSubmit = (data: ProjectEditFormValues) => {
    updateProjectMutation.mutateAsync({
      id: project.id,
      payload: data,
    });
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
            description="Changing this will affect the language of transcripts for new conversations"
            {...register("language")}
            data={[
              { label: "English", value: "en" },
              { label: "Dutch", value: "nl" },
              { label: "Multilingual (Experimental)", value: "multi" },
            ]}
          />
          <Group>
            <Button
              type="submit"
              loading={updateProjectMutation.isPending}
              disabled={!isDirty}
            >
              <Trans>Save</Trans>
            </Button>
            {isDirty && (
              <Button
                type="reset"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  reset(defaultValues);
                }}
              >
                <Trans>Cancel</Trans>
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};

export default ProjectBasicEdit;
