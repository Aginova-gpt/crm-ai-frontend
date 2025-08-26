import { NextResponse } from "next/server";

// Mock data for coalitions with groups
const mockCoalitions = [
  {
    id: "1",
    name: "Sonitor",
    users_count: 10,
    groups_count: 3,
    alarm_profiles_count: 3,
    groups: [
      { id: "1", name: "Sonitor Group 1" },
      { id: "2", name: "Sonitor Group 2" },
      { id: "3", name: "Sonitor Group 3" },
    ],
  },
  {
    id: "2",
    name: "Cedar",
    users_count: 10,
    groups_count: 2,
    alarm_profiles_count: 2,
    groups: [
      { id: "4", name: "Cedar Group 1" },
      { id: "5", name: "Cedar Group 2" },
    ],
  },
  {
    id: "3",
    name: "Aginova",
    users_count: 10,
    groups_count: 4,
    alarm_profiles_count: 4,
    groups: [
      { id: "6", name: "Aginova Group 1" },
      { id: "7", name: "Aginova Group 2" },
      { id: "8", name: "Aginova Group 3" },
      { id: "9", name: "Aginova Group 4" },
    ],
  },
  {
    id: "4",
    name: "Coalition 4",
    users_count: 10,
    groups_count: 2,
    alarm_profiles_count: 2,
    groups: [
      { id: "10", name: "Coalition 4 Group 1" },
      { id: "11", name: "Coalition 4 Group 2" },
    ],
  },
  {
    id: "5",
    name: "Coalition 5",
    users_count: 10,
    groups_count: 1,
    alarm_profiles_count: 1,
    groups: [{ id: "12", name: "Coalition 5 Group 1" }],
  },
  {
    id: "6",
    name: "Coalition 6",
    users_count: 10,
    groups_count: 3,
    alarm_profiles_count: 3,
    groups: [
      { id: "13", name: "Coalition 6 Group 1" },
      { id: "14", name: "Coalition 6 Group 2" },
      { id: "15", name: "Coalition 6 Group 3" },
    ],
  },
  {
    id: "7",
    name: "Coalition 7",
    users_count: 10,
    groups_count: 2,
    alarm_profiles_count: 2,
    groups: [
      { id: "16", name: "Coalition 7 Group 1" },
      { id: "17", name: "Coalition 7 Group 2" },
    ],
  },
  {
    id: "8",
    name: "Coalition 8",
    users_count: 10,
    groups_count: 1,
    alarm_profiles_count: 1,
    groups: [{ id: "18", name: "Coalition 8 Group 1" }],
  },
  {
    id: "9",
    name: "Coalition 9",
    users_count: 10,
    groups_count: 3,
    alarm_profiles_count: 3,
    groups: [
      { id: "19", name: "Coalition 9 Group 1" },
      { id: "20", name: "Coalition 9 Group 2" },
      { id: "21", name: "Coalition 9 Group 3" },
    ],
  },
  {
    id: "10",
    name: "Coalition 10",
    users_count: 10,
    groups_count: 2,
    alarm_profiles_count: 2,
    groups: [
      { id: "22", name: "Coalition 10 Group 1" },
      { id: "23", name: "Coalition 10 Group 2" },
    ],
  },
  {
    id: "26",
    name: "Pediatrics and Adolescents",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "90",
    name: "Edifice",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "161",
    name: "Army National Guard",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "102",
    name: "Buck Institute",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "123",
    name: "Dock Medical",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "242",
    name: "HOLLBROOK",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "82",
    name: "TCURO TX",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "191",
    name: "Lehigh Valley",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "175",
    name: "Back Bay Net",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "189",
    name: "Bio-Options",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "145",
    name: "National Institute of Health",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "228",
    name: "Edison Township BoE",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "77",
    name: "Hackensack Univ Med Ctr",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "184",
    name: "NBN Powder Packaging",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "163",
    name: "RMA Lubbock",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "190",
    name: "Shrewsbury",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "154",
    name: "Heisenberg",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "171",
    name: "Arnold Becker",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "148",
    name: "Mason Test Bed 2",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "180",
    name: "Florida A-M University",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "147",
    name: "Mason Test Bed",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    id: "210",
    name: "University of RI",
    users_count: 10,
    groups_count: 0,
    alarm_profiles_count: 0,
  },
  {
    alarm_profiles_count: 81,
    groups: [
      {
        id: "47",
        locations: [
          {
            assets: [
              {
                id: "23",
                name: "Pune Asset",
                sensors_count: 4,
              },
            ],
            id: "67",
            name: "Pune",
          },
        ],
        name: "Pune Group",
      },
      {
        id: "45",
        locations: [
          {
            assets: [
              {
                id: "1060",
                name: "Test Bed at Mason",
                sensors_count: 0,
              },
            ],
            id: "856",
            name: "Test Bed",
          },
          {
            assets: [
              {
                id: "26",
                name: "Laussane Asset",
                sensors_count: 1,
              },
            ],
            id: "66",
            name: "Lausanne",
          },
        ],
        name: "Lausanne Group",
      },
      {
        id: "75",
        locations: [
          {
            assets: [
              {
                id: "189",
                name: "Demo Asset",
                sensors_count: 0,
              },
            ],
            id: "197",
            name: "Demo Location",
          },
          {
            assets: [
              {
                id: "190",
                name: "GE Test Fridge",
                sensors_count: 0,
              },
            ],
            id: "198",
            name: "MVH Office",
          },
        ],
        name: "Demo Group",
      },
      {
        id: "133",
        locations: [],
        name: "STI1234",
      },
      {
        id: "755",
        locations: [
          {
            assets: [
              {
                id: "2033",
                name: "Specialty Probes Mason Asset",
                sensors_count: 10,
              },
            ],
            id: "1287",
            name: "Specialty Probes Mason",
          },
        ],
        name: "Specialty Probes",
      },
      {
        id: "46",
        locations: [
          {
            assets: [
              {
                id: "1122",
                name: "AUG23B",
                sensors_count: 0,
              },
            ],
            id: "914",
            name: "AUG23B",
          },
          {
            assets: [
              {
                id: "1234",
                name: "IAQ Long Term",
                sensors_count: 0,
              },
            ],
            id: "980",
            name: "IAQ Long Term",
          },
          {
            assets: [],
            id: "1195",
            name: "Delete",
          },
          {
            assets: [
              {
                id: "25",
                name: "Mason Asset",
                sensors_count: 14,
              },
              {
                id: "990",
                name: "Microbiology\u00a0Laboratory",
                sensors_count: 1,
              },
            ],
            id: "68",
            name: "Mason",
          },
          {
            assets: [
              {
                id: "1121",
                name: "AUG23A",
                sensors_count: 0,
              },
            ],
            id: "913",
            name: "AUG23A",
          },
          {
            assets: [],
            id: "1268",
            name: "BB 1645",
          },
          {
            assets: [
              {
                id: "1235",
                name: "Sentinel 1S LTE Reserve",
                sensors_count: 0,
              },
            ],
            id: "981",
            name: "Sentinel 1S LTE Reserve",
          },
          {
            assets: [
              {
                id: "1265",
                name: "IAQ KC",
                sensors_count: 0,
              },
            ],
            id: "995",
            name: "IAQ KC testing",
          },
          {
            assets: [
              {
                id: "724",
                name: "Ashok Home",
                sensors_count: 1,
              },
            ],
            id: "524",
            name: "Ashok House",
          },
        ],
        name: "Mason Group",
      },
      {
        id: "468",
        locations: [
          {
            assets: [
              {
                id: "1054",
                name: "Alex Test for edit",
                sensors_count: 3,
              },
            ],
            id: "839",
            name: "Alex Test",
          },
        ],
        name: "Alex Test (_)",
      },
      {
        id: "590",
        locations: [
          {
            assets: [
              {
                id: "1367",
                name: "Family Room Ambient",
                sensors_count: 0,
              },
            ],
            id: "1027",
            name: "MH First Story",
          },
        ],
        name: "Matt's House",
      },
      {
        id: "204",
        locations: [
          {
            assets: [
              {
                id: "747",
                name: "SandFTest",
                sensors_count: 0,
              },
            ],
            id: "538",
            name: "SandFTest",
          },
        ],
        name: "StoreAndForwardTest",
      },
    ],
    groups_count: 9,
    id: "14",
    name: "Aginova Testing",
    users_count: 23,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fetchGroups = searchParams.get("fetch_groups");
  const coalitionId = searchParams.get("coalition_id");

  if (coalitionId) {
    return NextResponse.json([
      mockCoalitions.find((coalition) => coalition.id === coalitionId),
    ]);
  }

  const responseData =
    fetchGroups === "yes"
      ? mockCoalitions
      : mockCoalitions.map(
          ({ id, name, users_count, groups_count, alarm_profiles_count }) => ({
            id,
            name,
            users_count,
            groups_count,
            alarm_profiles_count,
          })
        );

  return NextResponse.json(responseData);
}
