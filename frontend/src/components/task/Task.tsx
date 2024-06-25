import { useTaskStatus } from "@/lib/query";
import { Box, LoadingOverlay } from "@mantine/core";

export const Task = ({ task }: { task: TTask }) => {
  const query = useTaskStatus(task.id);

  return (
    <Box className="relative">
      <LoadingOverlay visible={query.isLoading} />
      <h2>{query.data?.state}</h2>
      <p>{query.data?.meta}</p>
    </Box>
  );
};
