import { Text, Box, Progress, Stack, Tooltip } from "@mantine/core";

export const ChatContextProgress = () => {
  return (
    <Box>
      <Text className="text-right text-xs !text-black">87% full</Text>
      <Progress.Root size={8}>
        <Tooltip label="Resources – 33%">
          <Progress.Section value={33} color="primary.3" />
        </Tooltip>

        <Tooltip label="Conversations – 54%">
          <Progress.Section value={54} color="teal.3" />
        </Tooltip>
      </Progress.Root>
    </Box>
  );
};
