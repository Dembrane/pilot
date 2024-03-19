import { Anchor, Button, Center, Stack, Title } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";

export const NotFoundRoute = () => {
  const navigate = useNavigate();

  return (
    <Center className="h-[60vh] flex flex-col justify-center items-center">
      <Stack>
        <Title order={1}>Page not found!</Title>
        <Button onClick={() => navigate(-1)}>Go back</Button>
      </Stack>
    </Center>
  );
};
