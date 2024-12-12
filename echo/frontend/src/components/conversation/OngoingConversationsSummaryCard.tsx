import { t } from "@lingui/core/macro";
import { IconRefresh, IconUsersGroup } from "@tabler/icons-react";
import { directus } from "@/lib/directus";
import { useQuery } from "@tanstack/react-query";
import { readItems } from "@directus/sdk";
import { AreaChart } from "@mantine/charts";
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";

const TIME_INTERVAL = 5 * 60 * 1000; // 5 min
const MAX_DATA_POINTS = 30; // Store last 30 data points

interface DataPoint {
  timestamp: string;
  conversations: number;
}

export const OngoingConversationsSummaryCard = ({
  projectId,
}: {
  projectId: string;
}) => {
  const theme = useMantineTheme();
  const [timeSeriesData, setTimeSeriesData] = useState<DataPoint[]>([]);

  const conversationChunksQuery = useQuery({
    queryKey: ["conversation_chunks", projectId],
    queryFn: async () => {
      const chunks = await directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              project_id: projectId,
            },
            timestamp: {
              // @ts-expect-error gt is not typed
              _gt: new Date(Date.now() - TIME_INTERVAL).toISOString(),
            },
          },
          fields: ["conversation_id"],
        }),
      );

      const uniqueConversations = new Set(
        chunks.map((chunk) => chunk.conversation_id),
      );

      return uniqueConversations.size;
    },
    refetchInterval: 10000, // Update every 10 seconds
  });

  useEffect(() => {
    if (conversationChunksQuery.data !== undefined) {
      setTimeSeriesData((prevData) => {
        const newData = [
          ...prevData,
          {
            timestamp: new Date().toISOString(),
            conversations: conversationChunksQuery.data,
          },
        ];

        // Keep only the last MAX_DATA_POINTS
        return newData.slice(-MAX_DATA_POINTS);
      });
    }
  }, [conversationChunksQuery.data]);

  return (
    <Paper p="md" shadow="0" className="basis-3/4 overflow-hidden">
      <Stack className="relative h-full">
        <Group gap="md">
          <IconUsersGroup size={24} />
          <Text size="lg">{t`Ongoing Conversations`}</Text>
          {conversationChunksQuery.isFetching && <LoadingSpinner size="xs" />}
        </Group>

        <Text size="2rem" fw={600}>
          {conversationChunksQuery.data ?? 0}
        </Text>

        <Box h={"90%"} className="absolute bottom-0 left-0 right-0 pt-2">
          <AreaChart
            className="mt-4 h-full"
            data={
              timeSeriesData.length
                ? timeSeriesData
                : [{ timestamp: new Date().toISOString(), conversations: 0 }]
            }
            dataKey="timestamp"
            series={[{ name: "conversations", color: theme.colors.blue[6] }]}
            curveType="natural"
            gridAxis="x"
            withDots={false}
            withXAxis={false}
            withYAxis={false}
            opacity={0.3}
            withTooltip={false}
            withLegend={false}
            withPointLabels={false}
            strokeWidth={1}
          />
        </Box>

        <ActionIcon
          variant="transparent"
          className="absolute right-0 top-0"
          c="gray.8"
          opacity={0.6}
          disabled={conversationChunksQuery.isFetching}
          onClick={() => {
            conversationChunksQuery.refetch();
          }}
        >
          <IconRefresh />
        </ActionIcon>
      </Stack>
    </Paper>
  );
};
