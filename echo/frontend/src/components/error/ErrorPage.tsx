import { Box, Button, Text, Title } from "@mantine/core";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { BaseLayout } from "../layout/BaseLayout";

export const ErrorPage = () => {
  const error = useRouteError();

  return (
    <BaseLayout>
      <Box className="flex h-[calc(100vh-60px)] flex-col items-center justify-center gap-4 p-4">
        <Title order={1}>
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : "Oops!"}
        </Title>
        <Text>
          {isRouteErrorResponse(error)
            ? error.data?.message || "Page not found"
            : "Sorry, an unexpected error has occurred."}
        </Text>
        <Button onClick={() => (window.location.href = "/")}>
          Return to Home
        </Button>
      </Box>
    </BaseLayout>
  );
};
