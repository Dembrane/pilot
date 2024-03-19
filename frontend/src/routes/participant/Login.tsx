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
  email: z.string().email("Must be a valid email address."),
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
      participantEmail: data.email,
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
            {...register("email")}
            error={errors.email?.message}
            size="lg"
            label="Enter e-mail address"
            placeholder="me@example.com"
          />
          <Box>
            <InputLabel size="lg">Enter conversation access code</InputLabel>
            {searchParams.get("pin") ? (
              <PinInput
                error={!!errors.pin?.message}
                defaultValue={searchParams.get("pin") ?? ""}
                size="lg"
                inputMode="numeric"
                length={4}
                disabled
              />
            ) : (
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
            )}
          </Box>
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
