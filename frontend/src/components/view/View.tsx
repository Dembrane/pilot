import { Icons } from "@/icons";
import {
  Paper,
  Stack,
  Group,
  Pill,
  ActionIcon,
  Text,
  Spoiler,
} from "@mantine/core";
import { IconArrowsDiagonal } from "@tabler/icons-react";
import { AspectCard } from "../aspect/Aspect";
import { Link, useParams } from "react-router-dom";
import { Markdown } from "../Markdown";

export const ViewCard = ({ data }: { data: TView }) => {
  return (
    <Paper bg="white" p="md">
      <Stack gap="sm">
        <Text size="xl">{data.name}</Text>
        <Group>
          <Pill>
            <Group>
              <Text className="font-semibold">
                {data.aspects?.length ?? 0} Aspects
              </Text>
            </Group>
          </Pill>
        </Group>
      </Stack>
    </Paper>
  );
};

export const ViewExpandedCard = ({ data }: { data: View }) => {
  const { projectId } = useParams();

  return (
    <Paper p="md">
      <Stack>
        <Group justify="space-between">
          <Group c="gray">
            <Icons.View />
            <Text className="font-semibold">View</Text>
          </Group>

          <Link to={`/projects/${projectId}/library/views/${data.id}`}>
            <ActionIcon component="a" variant="transparent" c="gray">
              <IconArrowsDiagonal />
            </ActionIcon>
          </Link>
        </Group>

        {data.processing_status !== "DONE" && (
          <Text className="text-gray-700 italic">
            {data.processing_status}: {data.processing_message}
          </Text>
        )}

        <Text className="text-2xl font-semibold">{data.name}</Text>
        <Group>
          <Pill>
            <Group>
              <Text className="font-semibold">
                {data.aspects?.length ?? 0} Aspects
              </Text>
            </Group>
          </Pill>
        </Group>
        <Spoiler maxHeight={120} showLabel="Show more" hideLabel="Show less">
          <Markdown content={data.summary ?? ""} />
        </Spoiler>

        <div className="snap-x pb-2 flex w-full overflow-x-auto">
          {data.aspects?.map((a) => (
            <div className="scroll-ml-4 ml-4 snap-start grid" key={a.id}>
              <AspectCard data={a} />
            </div>
          ))}
        </div>
      </Stack>
    </Paper>
  );
};
