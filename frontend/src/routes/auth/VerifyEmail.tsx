import { useVerifyMutation } from "@/lib/query";
import { Container, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export const VerifyEmailRoute = () => {
  useDocumentTitle("Email Verification | Dembrane");
  const [search, _setSearch] = useSearchParams();

  const verifyMutation = useVerifyMutation();

  const handleVerify = () => {
    const token = search.get("token");
    if (!token) {
      window.alert("Invalid token. Please try again.");
    }

    verifyMutation.mutate({ token: token ?? "" });
  };

  const runOnlyOnce = useRef(true);

  useEffect(() => {
    if (runOnlyOnce.current) {
      runOnlyOnce.current = false;
      handleVerify();
    }
  }, []);

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow">
          <Group>
            <Title order={1}>Email Verification</Title>
            {verifyMutation.isPending && <Loader />}
          </Group>
          {verifyMutation.isPending && (
            <Text>Please wait while we verify your email address.</Text>
          )}
          {verifyMutation.isSuccess && (
            <Text>
              Email verified successfully. You will be redirected to the login
              page in 5 seconds. If you are not redirected, please click{" "}
              <a href="/login?new=true">here</a>.
            </Text>
          )}
          {verifyMutation.isError && (
            <Text>
              There was an error verifying your email. Please try again.
            </Text>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};
