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
import { I18nLink } from "@/components/common/i18nLink";

export const AspectCard = ({
  data,
  className,
}: {
  data: Aspect;
  className?: string;
}) => {
  const { projectId } = useParams();

  return (
    <Box className="place-self-stretch">
      <I18nLink
        to={`/projects/${projectId}/library/views/${data.view_id}/aspects/${data.id}`}
      >
        <Paper
          bg="white"
          shadow="sm"
          className={cn(
            "group my-1 flex h-full w-[320px] flex-col overflow-hidden rounded-md text-left transition hover:-translate-y-1",
            className,
          )}
        >
          <Box className="relative w-full overflow-hidden rounded-t-md bg-slate-500">
            <Box className="absolute right-0 top-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="default"
                leftSection={<IconArrowsDiagonal size="14" />}
              >
                Open
              </Button>
            </Box>
            <img
              src={data.image_url ?? "/placeholder.png"}
              alt={data.name ?? ""}
              className="h-[200px] w-full object-cover"
            />
          </Box>

          <Box p="md" className="flex-grow justify-between">
            <Box className="flex h-full flex-col">
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
                        {data.quotes_count ?? 0} Quotes
                      </Text>
                    </Group>
                  </Pill>
                </Group>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </I18nLink>
    </Box>
  );
};
