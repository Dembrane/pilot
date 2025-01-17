export const dedupeQuotes = (quotes: QuoteAspect[]): QuoteAspect[] => {
  const seen = new Set();
  return quotes.filter((quote) => {
    if (seen.has((quote.quote_id as Quote).id)) {
      return false;
    }
    seen.add((quote.quote_id as Quote).id);
    return true;
  });
};
