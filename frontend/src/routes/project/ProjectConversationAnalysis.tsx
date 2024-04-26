import { BaseMessage } from "@/components/BaseMessage";
import { useConversationQuotes } from "@/lib/query";
import { Stack, Title, Text, Skeleton, Anchor } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { Quote } from "./ProjectLibraryInsight";

export const ProjectConversationAnalysis = () => {
  const { conversationId, projectId } = useParams();
  const quotesQuery = useConversationQuotes(conversationId ?? "");

  console.log(quotesQuery.data);

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
        quotesQuery.data.map((quote) => <Quote key={quote.id} data={quote} />)}
      {quotesQuery.data && quotesQuery.data.length === 0 && (
        <Text>
          No quotes available. Generate quotes for this conversation by visiting{" "}
          <Link to={`/projects/${projectId}/library`}>
            <Anchor>the project library.</Anchor>
          </Link>
        </Text>
      )}
    </Stack>
  );
};
