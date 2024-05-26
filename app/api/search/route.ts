"use server";
// import { NextRequest, NextResponse } from "next/server";
// import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";

// export async function GET(req: NextRequest) {
//   const query = req.nextUrl.searchParams.get("q");
//   console.log("Received query:", query);

//   if (!query) {
//     return NextResponse.json(
//       { message: "Query parameter is required" },
//       { status: 400 }
//     );
//   }

//   try {
//     const tool = new DuckDuckGoSearch({ maxResults: 5 });
//     const data = await tool.invoke(query);

//     console.log("Returning data:", data);
//     console.log("Data type:", typeof data);
//     return NextResponse.json(data);
//   } catch (error: any) {
//     console.error("Error occurred:", error);
//     return NextResponse.json(
//       { message: "Internal server error", error: error.message },
//       { status: 500 }
//     );
//   }
// }
