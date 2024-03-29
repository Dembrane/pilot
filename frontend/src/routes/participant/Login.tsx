import { Logo } from "@/components/Logo";
import {
  Alert,
  Box,
  Button,
  Group,
  InputLabel,
  PinInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useInitiateConversationMutation } from "@/lib/query";
import { AxiosError } from "axios";

const FormSchema = z.object({
  // email: z.string().email("Must be a valid email address.").optional(),
  name: z.string(),
  pin: z.string().min(4),
});

type FormValues = z.infer<typeof FormSchema>;

export const ParticipantLoginRoute = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
      projectId: projectId as string,
      // email: data.email,
      name: data.name,
      pin: data.pin,
    });
  };

  useEffect(() => {
    if (searchParams.get("pin")) {
      setValue("pin", searchParams.get("pin") ?? "");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSuccess) {
      if (initiateConversationMutation.data?.id) {
        navigate(
          `/${projectId}/conversation/${initiateConversationMutation.data?.id}`,
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
    <Stack className="h-full" p="md" justify="center">
      <Group justify="center" className="pb-8">
        <Logo hideTitle h="64px" />
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack className="relative">
          {initiateConversationMutation.error && (
            <Box>
              <Alert color="red" variant="light">
                {(initiateConversationMutation.error instanceof AxiosError &&
                  initiateConversationMutation.error.response?.data.detail) ??
                  "Something went wrong"}
              </Alert>
            </Box>
          )}

          <TextInput
            autoFocus
            required
            size="lg"
            label="Transcript Name"
            placeholder="John Doe, Group 1, etc."
            {...register("name")}
            error={errors.name?.message}
          />
          {!searchParams.get("pin") && (
            <Box>
              <InputLabel size="lg">Enter your access code</InputLabel>
              <PinInput
                {...register("pin")}
                error={!!errors.pin?.message}
                size="lg"
                inputMode="numeric"
                length={4}
                onChange={(value: string) => {
                  setValue("pin", value);
                }}
              />
            </Box>
          )}
          <Button
            type="submit"
            size="lg"
            loading={initiateConversationMutation.isPending}
          >
            Join
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};
