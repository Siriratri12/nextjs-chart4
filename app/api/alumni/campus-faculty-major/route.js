import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api2.oas.psu.ac.th/api/count-alumni-major",
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Upstream API error: Status ${response.status}, Details: ${errorText}`
      );
      throw new Error(
        `Failed to fetch data from external API: Status ${response.status}. Details: ${errorText.substring(0, 100)}...`
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.faculty_major_counts)) {
        console.warn("External API response does not contain expected 'faculty_major_counts' array.");
        return NextResponse.json(
          { error: "Invalid data format from external API", faculty_major_counts: [] },
          { status: 500 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route error:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}`, faculty_major_counts: [] },
      { status: 500 }
    );
  }
}
