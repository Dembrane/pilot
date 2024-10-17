import {
  Alert,
  Box,
  Button,
  InputLabel,
  PinInput,
  Stack,
  TextInput,
  MultiSelect,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useInitiateConversationMutation } from "@/lib/query";
import { AxiosError } from "axios";
import { Trans, t } from "@lingui/macro";
import { useLanguage } from "@/lib/useLanguage";
import { usei18nNavigate } from "@/lib/usei18nNavigate";

const FormSchema = z.object({
  name: z.string().optional(),
  tagIdList: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof FormSchema>;

export const ParticipantInitiateForm = ({ project }: { project: Project }) => {
  const navigate = usei18nNavigate();

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const { isSuccess, isError, ...initiateConversationMutation } =
    useInitiateConversationMutation();

  const onSubmit = (data: FormValues) => {
    initiateConversationMutation.mutate({
      projectId: project.id,
      name: data.name ?? t`Anonymous Participant`,
      pin: project.pin ?? "",
      tagIdList: data.tagIdList,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      if (initiateConversationMutation.data?.id) {
        navigate(
          `/${project.id}/conversation/${initiateConversationMutation.data?.id}`,
        );
      } else {
        reset();
      }
    }
  }, [isSuccess, reset, initiateConversationMutation.data?.id, navigate]);

  useEffect(() => {
    if (isError) {
      reset();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <Stack className="relative">
        {initiateConversationMutation.error && (
          <Box>
            <Alert color="red" variant="light">
              {(initiateConversationMutation.error instanceof AxiosError &&
                initiateConversationMutation.error.response?.data.detail) ??
                t`Something went wrong`}
            </Alert>
          </Box>
        )}

        {project.default_conversation_ask_for_participant_name && (
          <TextInput
            autoFocus
            required
            size="md"
            label={t`Name`}
            placeholder="John Doe, Group 1, etc."
            {...register("name")}
            error={errors.name?.message}
          />
        )}
        {project.tags.length > 0 && (
          <Box className="relative">
            <MultiSelect
              label={t`Tags`}
              description={t`Add all that apply`}
              size="md"
              comboboxProps={{
                position: "top",
                middlewares: { flip: false, shift: false },
                offset: 0,
                withinPortal: false,
              }}
              data={project.tags.map((tag) => ({
                value: tag.id,
                label: tag.text,
              }))}
              onChange={(value) => {
                setValue("tagIdList", value);
              }}
            />
          </Box>
        )}
        <Button
          type="submit"
          size="lg"
          loading={initiateConversationMutation.isPending}
        >
          <Trans>Begin!</Trans>
        </Button>
      </Stack>
    </form>
  );
};
