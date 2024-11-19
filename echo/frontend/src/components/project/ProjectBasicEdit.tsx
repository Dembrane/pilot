import React, { useEffect, useRef } from "react";
import {
  Button,
  Group,
  NativeSelect,
  Stack,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { Trans, t } from "@lingui/macro";
import { useForm } from "react-hook-form";
import { useUpdateProjectByIdMutation } from "@/lib/query";
import { IconX } from "@tabler/icons-react";
import { UnsavedChanges } from "../form/UnsavedChanges";

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
        {isDirty && <UnsavedChanges />}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)} onBlur={handleFormBlur}>
        <Stack className="relative">
          <TextInput label={t`Name`} {...register("name")} />
          <Textarea
            label={t`Context`}
            rows={4}
            {...register("context")}
            placeholder={t`How would you describe to a colleague what are you trying to accomplish with this project?

* What is the north star goal or key metric
* What does success look like`}
          />
          <NativeSelect
            label={t`Language`}
            description={t`This language will be used for the Participant's Portal, transcription and analysis. To change the language of this application, please use the language picker in the header user menu instead.`}
            {...register("language")}
            data={[
              { label: t`English`, value: "en" },
              { label: t`Dutch`, value: "nl" },
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
