import { Group, Paper, Pill, Text } from "@mantine/core";
import { useParams } from "react-router-dom";
import { I18nLink } from "../common/i18nLink";
import { cn } from "@/lib/utils";
import { useCopyQuote } from "@/hooks/useCopyQuote";
import { CopyIconButton } from "../common/CopyIconButton";

export const Quote = ({
  data,
  className,
}: {
  data: Quote;
  className?: string;
}) => {
  const { projectId } = useParams();
  const { copyQuote, copied } = useCopyQuote();

  return (
    <Paper
      p="sm"
      className={cn(data.conversation_id ? "border" : "", className)}
    >
      <Text size="sm" pb="xs">
        "{data.text}"
      </Text>
      {data.conversation_id && (
        <Group>
          <I18nLink
            to={`/projects/${projectId}/conversation/${(data.conversation_id as unknown as Conversation).id}/analysis`}
          >
            <Pill>
              {((data as any).conversation_id as Conversation)
                .participant_name ?? ""}
            </Pill>
          </I18nLink>

          <CopyIconButton
            onCopy={() => copyQuote(data.id)}
            copied={copied}
            size={18}
          />
        </Group>
      )}
    </Paper>
  );
};
