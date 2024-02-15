import { Anchor, Center, Stack, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export const NotFoundRoute = () => {
  return (
    <Center className="h-[60vh] flex flex-col justify-center items-center">
      <Stack>
        <Title>Page not found! 💀</Title>
        <Link to="/">
          <Anchor>Go back to the home page</Anchor>
        </Link>
      </Stack>
    </Center>
  );
};
