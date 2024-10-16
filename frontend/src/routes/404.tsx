import { Button, Center, Stack, Title } from "@mantine/core";
import { usei18nNavigate } from "@/lib/usei18nNavigate";

export const NotFoundRoute = () => {
  const navigate = usei18nNavigate();

  return (
    <Center className="flex h-[60vh] flex-col items-center justify-center">
      <Stack>
        <Title order={1}>Page not found</Title>
        <Button onClick={() => navigate("/")}>Go home</Button>
      </Stack>
    </Center>
  );
};
