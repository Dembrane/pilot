import { cn } from "@/lib/utils";
import {
  Paper,
  Box,
  Button,
  Stack,
  Group,
  Pill,
  Text,
  Divider,
} from "@mantine/core";
import { IconArrowsDiagonal } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";

export const AspectCard = ({
  data,
  className,
}: {
  data: Aspect;
  className?: string;
}) => {
  const { projectId, sessionId } = useParams();

  return (
    <Box className="place-self-stretch">
      <Link
        to={`/workspaces/${sessionId}/projects/${projectId}/library/views/${data.view_id}/aspects/${data.id}`}
      >
        <Paper
          bg="white"
          shadow="sm"
          className={cn(
            "rounded-md overflow-hidden hover:-translate-y-1 my-1 transition group h-full w-[320px] text-left flex flex-col",
            className,
          )}
        >
          <Box className="w-full relative rounded-t-md overflow-hidden bg-slate-500">
            <Box className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="default"
                leftSection={<IconArrowsDiagonal size="14" />}
              >
                Open
              </Button>
            </Box>
            <img
              src={data.image_url ?? "/placeholder.png"}
              alt={data.name}
              className="w-full h-[200px] object-cover"
            />
          </Box>

          <Box p="md" className="flex-grow justify-between">
            <Box className="flex flex-col h-full">
              <Stack className="flex-grow">
                <Text size="lg" className="font-semibold">
                  {data.name}
                </Text>
                <Text size="sm">
                  {data.short_summary ?? data.description ?? ""}
                </Text>
              </Stack>
              <Stack className="pt-4">
                <Divider />
                <Group>
                  <Pill>
                    <Group>
                      <Text className="font-semibold">
                        {data.quotes_count} Quotes
                      </Text>
                    </Group>
                  </Pill>
                </Group>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Link>
    </Box>
  );
};
