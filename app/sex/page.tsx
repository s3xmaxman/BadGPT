"use client";
import { duckGoSearch } from "@/lib/utils";
import { useState } from "react";

type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    try {
      const data = await duckGoSearch(query);
      setResults(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>DuckDuckGo Scraper</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {results.map((result, index) => (
          <li key={index}>
            <a href={result.link} target="_blank" rel="noopener noreferrer">
              title:{result.title}
            </a>
            <p>snippet:{result.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
