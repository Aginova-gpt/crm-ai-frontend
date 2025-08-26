import crypto from "crypto";
import { MINT, INDIGO, YELLOW, ORANGE, BLUE2 } from "@/styles/colors";
import { Group, Person, Mail, WbTwilight } from "@mui/icons-material";

export type ReceiverType = "list" | "relay" | "individual" | "user";
export interface Receiver {
  label: string;
  receiver_type: ReceiverType;
  count: number;
}

export const colorForReceiverType = (receiverType: ReceiverType | "group") => {
  if (receiverType === "group") {
    return BLUE2;
  }
  switch (receiverType) {
    case "list":
      return YELLOW;
    case "relay":
      return INDIGO;
    case "individual":
      return MINT;
    case "user":
      return ORANGE;
  }
};

export const iconForReceiverType = (receiverType: ReceiverType | "group") => {
  const color = colorForReceiverType(receiverType);
  if (receiverType === "group") {
    return <Group sx={{ color }} />;
  }
  switch (receiverType) {
    case "list":
      return <Group sx={{ color }} />;
    case "relay":
      return <WbTwilight sx={{ color }} />;
    case "individual":
      return <Mail sx={{ color }} />;
    case "user":
      return <Person sx={{ color }} />;
  }
};

export const emailIsValid = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getCurrentHourHash = () => {
  const currentHour = new Date().getHours().toString();
  return crypto.createHash("md5").update(currentHour).digest("hex");
};

export const isLocalHost = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "localhost";
  return backendUrl.includes("localhost") || backendUrl.includes("127.0.0");
};

export const formatReadingDate = (date: string) => {
  const now = new Date();

  // Handle different date formats
  let localDateObj: Date;
  if (date.endsWith("Z")) {
    // Already UTC format ending with Z
    localDateObj = new Date(date);
  } else if (
    date.includes("+") ||
    (date.includes("-") && date.lastIndexOf("-") > 10)
  ) {
    // ISO 8601 format with timezone offset (e.g., 2025-07-18T11:34:16.527165+00:00)
    localDateObj = new Date(date);
  } else {
    // Legacy format without timezone info, assume UTC
    localDateObj = new Date(`${date}Z`);
  }

  const diffInMinutes = Math.floor(
    (now.getTime() - localDateObj.getTime()) / (1000 * 60)
  );
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInMinutes < 2) {
    return "just now";
  } else if (diffInMinutes < 6) {
    return "few min ago";
  } else if (diffInMinutes < 59) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 23) {
    return `${diffInHours} hrs ago`;
  }

  return localDateObj.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const readableUnit = (unit: string) => {
  switch (unit) {
    case "celsius":
      return "°C";
    case "fahrenheit":
      return "°F";
    case "percentage":
      return "%";
    case "millivolt":
      return "mV";
    case "milliampere":
      return "mA";
    case "binary":
      return "";
    case "seconds":
      return "s";
    case "minutes":
      return "min";
    case "hours":
      return "h";
  }
  return unit;
};

export const dateForGraph = (date: Date) => {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  return isToday
    ? date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export const accountIsSonitor = (email: string) => {
  const sonitorAccounts = [
    "george.lopez@cshs.org",
    "brian.bass@sonitor.com",
    "erin.richmond@sonitor.com",
    "stuart.ronk@cshs.org",
  ];
  console.log(email);
  const cleanEmail = email.trim().toLowerCase();
  console.log(cleanEmail);
  return sonitorAccounts.includes(cleanEmail);
};

export const emptyString = "\u00A0";
