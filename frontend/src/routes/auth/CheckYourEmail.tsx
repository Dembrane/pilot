import { Text, Container, Stack, Title } from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";

export const CheckYourEmailRoute = () => {
  useDocumentTitle("Check your Email | Dembrane");
  return (
    <Container size="sm">
      <Stack>
        <Title order={1}>Check your email</Title>
        <Text>
          We have sent you an email with next steps. If you don't see it, check
          your spam folder.
        </Text>
      </Stack>
    </Container>
  );
};
