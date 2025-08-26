import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Mock profile data
  const mockProfileData = {
    email: "john.doe@example.com",
    role_level: 0,
    // coalition: {
    //   id: 14,
    //   name: "Aginova Testing"
    // }
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json(mockProfileData);
}
