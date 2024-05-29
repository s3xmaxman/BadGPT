"use client";
import React, { useEffect, useState } from "react";
import { SearchResult } from "@/lib/types";

interface DuckGoResultsProps {
  duckGoData: string | undefined;
}

const DuckGoResults: React.FC<DuckGoResultsProps> = ({ duckGoData }) => {
  const [parsedResults, setParsedResults] = useState<SearchResult[]>([]);

  const parseFormattedResults = (formatted: string): SearchResult[] => {
    const resultSections = formatted.trim().split("\n\n");

    return resultSections.map((section) => {
      const [titleLine, linkLine, snippetLine] = section.split("\n");

      const title = titleLine.replace("タイトル: ", "").trim();
      const link = linkLine.replace("リンク: ", "").trim();
      const snippet = snippetLine.replace("スニペット: ", "").trim();

      return { title, link, snippet };
    });
  };

  useEffect(() => {
    if (duckGoData) {
      const results = parseFormattedResults(duckGoData);
      setParsedResults(results);
    }
  }, [duckGoData]);

  return (
    <div>
      {parsedResults.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold mb-2">Web検索結果:</h4>
          <ul className="list-disc list-inside">
            {parsedResults.map((result: SearchResult, index: number) => (
              <li key={index}>
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline font-semibold"
                >
                  {result.title}
                </a>
                <hr className="my-2" />
                <p className="text-sm text-white">{result.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DuckGoResults;
