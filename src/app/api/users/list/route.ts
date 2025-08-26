import { NextResponse } from "next/server";

// Mock data generator
const generateMockUsers = (count: number) => {
  const temperatureUnits = ["celsius", "fahrenheit"];
  const pressureUnits = ["inch", "pascal"];
  const co2Units = ["percentage", "ppm"];
  const groups = [
    "Group ABCDE",
    "Group BCDE",
    "Group CDE",
    "Group D",
    "Group EFGHIJ",
    "Group FGHIJ",
    "Group GHIJ",
    "Group HIJ",
    "Group IJ",
    "Group J",
  ];
  const alarmProfiles = [
    "Profile Alpha",
    "Profile Beta",
    "Profile Gamma",
    "Profile Delta",
  ];
  const receivers = ["Receiver 1", "Receiver 2", "Receiver 3", "Receiver 4"];

  return Array.from({ length: count }, (_, i) => {
    const firstName = [
      "John",
      "Jane",
      "Mike",
      "Sarah",
      "David",
      "Lisa",
      "Tom",
      "Emma",
      "Chris",
      "Anna",
    ][Math.floor(Math.random() * 10)];
    const lastName = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ][Math.floor(Math.random() * 10)];
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const name = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`;

    return {
      username,
      is_deactivated: Math.random() < 0.1, // 10% chance of being deactivated
      name,
      initials,
      email: `${username}@example.com`,
      communication: {
        call: `+1-${Math.floor(Math.random() * 900) + 100}-${
          Math.floor(Math.random() * 900) + 100
        }-${Math.floor(Math.random() * 9000) + 1000}`,
        sms: `+1-${Math.floor(Math.random() * 900) + 100}-${
          Math.floor(Math.random() * 900) + 100
        }-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `${username}@example.com`,
        email_to_text: `${username}@text.com`,
      },
      last_active: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // Random activity within last 30 days
      preferences: {
        temperature_unit:
          temperatureUnits[Math.floor(Math.random() * temperatureUnits.length)],
        pressure_unit:
          pressureUnits[Math.floor(Math.random() * pressureUnits.length)],
        co2_unit: co2Units[Math.floor(Math.random() * co2Units.length)],
        tz: [
          "America/New_York",
          "America/Los_Angeles",
          "America/Chicago",
          "America/Denver",
          "America/Phoenix",
          "America/New_York",
          "America/Los_Angeles",
          "America/Chicago",
          "America/Denver",
          "America/Phoenix",
        ][Math.floor(Math.random() * 10)],
        signature_period: 1,
      },
      role_level: Math.floor(Math.random() * 3),
      group_rights: Array.from(
        { length: Math.floor(Math.random() * 6) + 1 },
        () => ({
          group_id: `group-${Math.floor(Math.random() * 10) + 1}`,
          group_name: groups[Math.floor(Math.random() * groups.length)],
          can_read: Math.random() < 0.5,
          can_write: Math.random() < 0.5,
        })
      ),
      alarm_profiles: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => alarmProfiles[Math.floor(Math.random() * alarmProfiles.length)]
      ),
      receivers_list: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => ({
          receiver_list_name:
            receivers[Math.floor(Math.random() * receivers.length)],
          count: Math.floor(Math.random() * 10) + 1,
        })
      ),
    };
  });
};

// Generate 50 mock users
const mockUsers = generateMockUsers(50);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || "";
  const sortKey = searchParams.get("sort_key") || "username";
  const sortOrder = searchParams.get("sort_order") || "asc";

  // Filter users based on search term
  let filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Apply sorting
  filteredUsers.sort((a, b) => {
    let aValue = a[sortKey as keyof typeof a];
    let bValue = b[sortKey as keyof typeof b];

    // Handle string sorting
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate pagination
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginatedUsers,
    total: filteredUsers.length,
    limit,
    offset,
  });
}
