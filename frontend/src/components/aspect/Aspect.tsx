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
  data: TAspect;
  className?: string;
}) => {
  const { projectId } = useParams();

  return (
    <Box className="place-self-stretch">
      <Link
        to={`/projects/${projectId}/library/views/${data.view_id}/aspects/${data.id}`}
      >
        <Paper
          className={cn(
            "rounded-md overflow-hidden hover:bg-opacity-75 transition group h-full w-[300px] text-left flex flex-col",
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
              src={
                data.image_url ??
                "https://loremflickr.com/320/240/" +
                  "nature" +
                  "?random=" +
                  data.id // data.image_url
              }
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
                  <Pill bg="rgba(35, 131, 226, 0.102)" c="#152652">
                    <Group>
                      <Text className="font-semibold">
                        {data.quotes?.length ?? 0} Quotes
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
