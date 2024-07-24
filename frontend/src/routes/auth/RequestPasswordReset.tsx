import { useRequestPasswordResetMutation } from "@/lib/query";
import {
  Alert,
  Button,
  Container,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";

export const RequestPasswordResetRoute = () => {
  useDocumentTitle("Request Password Reset | Dembrane");
  const { register, handleSubmit } = useForm<{ email: string }>();

  const requestPasswordResetMutation = useRequestPasswordResetMutation();

  const onSubmit = handleSubmit(async (data) => {
    requestPasswordResetMutation.mutate(data.email);
  });

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow">
          <Title order={1}>Request Password Reset</Title>

          <form onSubmit={onSubmit}>
            <Stack>
              <TextInput
                size="lg"
                label="Email"
                {...register("email")}
                placeholder="Email"
                required
                type="email"
              />
              <Button
                size="lg"
                type="submit"
                loading={requestPasswordResetMutation.isPending}
              >
                Submit
              </Button>
            </Stack>
          </form>
        </Stack>
      </Stack>
    </Container>
  );
};
