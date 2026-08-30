"use server";

export async function getSpellcheckSuggestion(query: string): Promise<string | null> {
  try {
    const res = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[1] && data[1].length > 0) {
      const suggestion = data[1][0];
      if (suggestion.toLowerCase() !== query.toLowerCase()) {
        return suggestion;
      }
    }
  } catch (error) {
    console.error("Spellcheck error:", error);
  }
  return null;
}
