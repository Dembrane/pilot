import { BaseMessage } from "@/components/BaseMessage";
import { useConversationQuotes } from "@/lib/query";
import { Stack, Title, Text, Skeleton, Anchor } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { Quote } from "../../components/quote/Quote";

export const ProjectConversationAnalysis = () => {
  const { conversationId, projectId, sessionId } = useParams();
  const quotesQuery = useConversationQuotes(conversationId ?? "");

  return (
    <Stack>
      <Title order={2}>Quotes</Title>
      {quotesQuery.error && (
        <Text className="text-red-500">Error loading quotes</Text>
      )}
      {quotesQuery.isLoading && (
        <>
          <Skeleton height={150} />
          <Skeleton height={150} />
          <Skeleton height={150} />
        </>
      )}
      {quotesQuery.data &&
        quotesQuery.data.map((quote) => (
          <Quote key={quote.id} data={quote as Quote} />
        ))}
      {quotesQuery.data && quotesQuery.data.length === 0 && (
        <Text>
          No quotes available. Generate quotes for this conversation by visiting{" "}
          <Link to={`/workspaces/${sessionId}/projects/${projectId}/library`}>
            <Anchor>the project library.</Anchor>
          </Link>
        </Text>
      )}
    </Stack>
  );
};
