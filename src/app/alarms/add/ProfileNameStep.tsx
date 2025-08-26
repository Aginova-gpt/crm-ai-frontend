import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { useProfile } from "@/contexts/ProfileContext";
import { Autocomplete, Box, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAlarmProfileContext } from "@/contexts/AlarmProfileContext";

export type CoalitionGroup = {
  id: string;
  name: string;
};

export type Coalition = {
  id: string;
  name: string;
  groups: CoalitionGroup[];
};

export default function ProfileNameStep({}: {}) {
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const { isAdmin, profileData } = useProfile();
  const {
    profileName,
    setProfileName,
    coalition,
    setCoalition,
    group,
    setGroup,
  } = useAlarmProfileContext();

  const { data: coalitions, isLoading } = useQuery({
    queryKey: ["coalitions"],
    queryFn: async () => {
      const url = apiURL("management/coalitions", "coalitions/list");
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch coalitions");
      }

      return response.json();
    },
    enabled: isAdmin === true,
  });

  const { data: coalitionsWithGroups, isLoading: groupsAreLoading } = useQuery({
    queryKey: [
      "coalitionsWithGroups",
      coalition?.id,
      profileData?.coalition?.id,
    ],
    queryFn: async () => {
      const coalitionId = coalition?.id || profileData?.coalition?.id;
      const url = apiURL(
        `management/coalitions?coalition_id=${coalitionId}&fetch_groups=yes`,
        `coalitions/list?coalition_id=${coalitionId}&fetch_groups=yes`
      );
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch coalitions");
      }

      return response.json();
    },
    enabled:
      coalition !== null ||
      (isAdmin === false && profileData?.coalition?.id !== undefined),
  });

  useEffect(() => {
    if (coalitionsWithGroups?.length > 0) {
      setCoalition(coalitionsWithGroups[0]);
    }
  }, [coalitionsWithGroups]);

  return (
    <Box
      sx={{
        marginLeft: "60px",
        marginRight: "60px",
        marginTop: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <TextField
        label="Profile Name"
        value={profileName}
        onChange={(e) => setProfileName(e.target.value)}
        sx={{
          minWidth: "40%",
        }}
      />
      {isAdmin && (
        <Autocomplete
          disablePortal
          options={coalitions || []}
          value={coalition}
          onChange={(_, newValue) => {
            setCoalition(newValue || null);
            setGroup(null);
          }}
          getOptionLabel={(option) => option.name}
          loading={isLoading}
          loadingText="Loading coalitions..."
          sx={{
            minWidth: "40%",
            marginTop: "20px",
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Coalition" />
          )}
        />
      )}
      {coalition && (
        <Autocomplete
          disablePortal
          options={coalition.groups || []}
          value={group}
          onChange={(_, newValue) => setGroup(newValue || null)}
          getOptionLabel={(option) => option.name}
          sx={{
            minWidth: "40%",
            marginTop: "20px",
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Group" />
          )}
        />
      )}
    </Box>
  );
}
