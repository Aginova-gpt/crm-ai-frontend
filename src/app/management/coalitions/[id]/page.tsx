"use client";
import BackgroundBox from "@/components/BackgroundBox";
import Navbar from "@/components/Navbar";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  TableSortLabel,
  AlertColor,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { BACKGROUND, PRIMARY_LIGHT, YELLOW } from "@/styles/colors";
import AutocompleteField from "@/components/AutocompleteField/AutocompleteField";
import { styles } from "./styles";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/contexts/BackendContext";
import { useApi } from "@/utils/api";
import { SortDirection } from "@/utils/sensorHelpers";
import { useMutation } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  ArrowBack,
  AddCircleOutline,
  DeleteOutline,
} from "@mui/icons-material";
import { useState, useMemo, useEffect } from "react";
import SnackView from "@/components/SnackView";

type ListObject = {
  id: string;
  name: string;
  extra: number;
};

type SortKey = "name" | "extra";

interface ObjectsListProps {
  objects: ListObject[];
  tableTitle: string;
  column1Title: string;
  column2Title: string;
  addButtonText: string;
  onAddClick?: () => void;
  onDeleteClick?: () => void;
  onSelectionChange?: (selectedId: string) => void;
  selectedId?: string;
  isRefetching?: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isDeleting: boolean;
  parentEntity?: string;
}

type CoalitionData = {
  id: string;
  name: string;
  groups?: {
    id: string;
    name: string;
    locations?: {
      id: string;
      name: string;
      assets?: {
        id: string;
        name: string;
        sensors_count: number;
      }[];
    }[];
  }[];
};

const ObjectsList = ({
  isRefetching,
  objects,
  tableTitle,
  column1Title,
  column2Title,
  addButtonText,
  onAddClick,
  onDeleteClick,
  onSelectionChange,
  selectedId,
  selectedIds,
  setSelectedIds,
  isDeleting,
  parentEntity,
}: ObjectsListProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchText, setSearchText] = useState("");

  const [debouncedSearch] = useDebounce(searchText, 300);

  const handleSelectRow = (id: string) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];

    setSelectedIds(newSelectedIds);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const highlightSearchText = (text: string, searchText: string) => {
    if (!searchText.trim()) return text;

    const regex = new RegExp(
      `(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span
            key={index}
            style={{
              backgroundColor: YELLOW,
              padding: "1px 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Sort objects based on current sort state
  const sortedObjects = useMemo(() => {
    let entities = [...objects];
    if (debouncedSearch.trim()) {
      entities = entities.filter((object: ListObject) =>
        object.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return entities.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      if (sortDirection === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }, [objects, sortKey, sortDirection, debouncedSearch]);

  const toolbar = () => {
    return (
      <Box sx={styles.toolbar}>
        <Box sx={styles.toolbarInner}>
          <Box sx={styles.toolbarContent}>
            {/* Search bar */}
            <Box sx={styles.searchContainer}>
              <AutocompleteField
                placeholder={`Search ${tableTitle}`}
                storageKey={`${tableTitle}SearchHistory`}
                searchText={searchText}
                setSearchText={setSearchText}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(0, 0, 0, 0.12)",
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      {toolbar()}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          height: "53px",
          padding: "0 16px",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: "700", fontSize: "18px" }}>
            {isRefetching ? (
              <CircularProgress size={20} />
            ) : (
              `${objects.length} ${tableTitle}`
            )}
          </Typography>
          {parentEntity && (
            <Typography sx={{ fontSize: "14px", color: "text.secondary" }}>
              {parentEntity}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={onAddClick}
            sx={{ ...styles.button, height: "32px" }}
            startIcon={<AddCircleOutline />}
          >
            {addButtonText}
          </Button>
          <IconButton
            loading={isDeleting}
            onClick={isDeleting ? undefined : onDeleteClick}
            disabled={selectedIds.length === 0}
            sx={{
              color: selectedIds.length === 0 ? "grey.400" : "error.main",
              "&:hover": {
                color: selectedIds.length === 0 ? "grey.400" : "error.dark",
              },
            }}
          >
            <DeleteOutline />
          </IconButton>
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{ ...styles.tableRow, borderBottom: "2px solid white" }}
            >
              <TableCell
                sx={{ ...styles.tableCell, padding: "4px 12px" }}
              ></TableCell>
              <TableCell sx={styles.tableCell}>
                <TableSortLabel
                  active={sortKey === "name"}
                  direction={sortKey === "name" ? sortDirection : "asc"}
                  onClick={() => handleSort("name")}
                >
                  {column1Title}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={styles.tableCell}>
                <TableSortLabel
                  active={sortKey === "extra"}
                  direction={sortKey === "extra" ? sortDirection : "asc"}
                  onClick={() => handleSort("extra")}
                >
                  {column2Title}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedObjects.map((object) => (
              <TableRow
                key={object.id}
                onClick={() => onSelectionChange?.(object.id)}
                sx={{
                  ...styles.tableRow,
                  backgroundColor:
                    selectedId === object.id ? PRIMARY_LIGHT : "inherit",
                  "&:hover": {
                    backgroundColor:
                      selectedId === object.id
                        ? PRIMARY_LIGHT
                        : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <TableCell sx={{ ...styles.tableCell, padding: "4px 12px" }}>
                  <Checkbox
                    disabled={object.extra !== 0}
                    checked={selectedIds.includes(object.id)}
                    onChange={() => handleSelectRow(object.id)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={styles.tableCell}>
                  {highlightSearchText(object.name, debouncedSearch)}
                </TableCell>
                <TableCell sx={styles.tableCell}>{object.extra}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default function CoalitionPage() {
  const params = useParams();
  const coalitionId = params.id as string;
  const { apiURL } = useBackend();
  const { fetchWithAuth } = useApi();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupsToDelete, setGroupsToDelete] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationsToDelete, setLocationsToDelete] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [assetsToDelete, setAssetsToDelete] = useState<string[]>([]);
  const [snackMessage, setSnackMessage] = useState<{
    type: AlertColor;
    message: string;
  } | null>(null);
  const [entityModalOpen, setEntityModalOpen] = useState<
    "group" | "location" | "asset" | null
  >(null);
  const [newEntityName, setNewEntityName] = useState("");

  const visibleLists = 1 + (selectedGroup ? 1 : 0) + (selectedLocation ? 1 : 0);
  const listWidth = `${100 / visibleLists}%`;

  useEffect(() => {
    setLocationsToDelete([]);
    setAssetsToDelete([]);
  }, [selectedGroup]);

  useEffect(() => {
    setAssetsToDelete([]);
  }, [selectedLocation]);

  const { data, isLoading, refetch, isRefetching } = useQuery<CoalitionData[]>({
    queryKey: ["coalition", coalitionId],
    queryFn: async () => {
      const url = apiURL(
        `management/coalitions?coalition_id=${coalitionId}&fetch_groups=yes&fetch_locations=yes&fetch_assets=yes`,
        `coalitions/list?coalition_id=${coalitionId}&fetch_groups=yes&fetch_locations=yes&fetch_assets=yes`
      );

      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.msg || "Failed to fetch coalitions");
      }

      return response.json();
    },
    enabled: !!coalitionId,
  });

  const addGroupMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const response = await fetchWithAuth(
        apiURL(
          `management/groups?coalition_id=${coalitionId}`,
          "management/groups/add"
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: groupName,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add group");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Group added successfully",
      });
      setEntityModalOpen(null);
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to add group",
      });
    },
  });

  const deleteGroupsMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      const response = await fetchWithAuth(
        apiURL(`management/groups/bulk_delete`, "management/groups/delete"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group_ids: groupIds.map((id) => Number(id)),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete groups");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Groups deleted successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to delete groups",
      });
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: async (locationName: string) => {
      const response = await fetchWithAuth(
        apiURL(
          `management/locations?group_id=${selectedGroup}`,
          "management/locations/add"
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: locationName,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add location");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Location added successfully",
      });
      setEntityModalOpen(null);
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to add location",
      });
    },
  });

  const deleteLocationsMutation = useMutation({
    mutationFn: async (locationIds: string[]) => {
      const response = await fetchWithAuth(
        apiURL(
          `management/locations/bulk_delete`,
          "management/locations/delete"
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location_ids: locationIds.map((id) => Number(id)),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete locations");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Locations deleted successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to delete locations",
      });
    },
  });

  const addAssetMutation = useMutation({
    mutationFn: async (assetName: string) => {
      const response = await fetchWithAuth(
        apiURL(
          `management/assets?location_id=${selectedLocation}`,
          "management/assets/add"
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: assetName,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add asset");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Asset added successfully",
      });
      setEntityModalOpen(null);
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to add asset",
      });
    },
  });

  const deleteAssetsMutation = useMutation({
    mutationFn: async (assetIds: string[]) => {
      const response = await fetchWithAuth(
        apiURL(`management/assets/bulk_delete`, "management/assets/delete"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asset_ids: assetIds.map((id) => Number(id)),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete locations");
      }
      return data;
    },
    onSuccess: (data) => {
      setSnackMessage({
        type: "success",
        message: data.msg || "Locations deleted successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      setSnackMessage({
        type: "error",
        message: error.message || "Failed to delete locations",
      });
    },
  });

  if (isLoading) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  const coalition = data?.find((c: CoalitionData) => c.id === coalitionId);
  if (!coalition) {
    return (
      <Box sx={styles.errorContainer}>
        <Typography variant="h6">Coalition not found</Typography>
      </Box>
    );
  }

  // Get selected data
  const selectedGroupData = selectedGroup
    ? coalition.groups?.find((g) => g.id === selectedGroup)
    : null;

  const selectedLocationData =
    selectedLocation && selectedGroupData
      ? selectedGroupData.locations?.find((l) => l.id === selectedLocation)
      : null;

  const handleGroupSelection = (selectedId: string) => {
    if (selectedId) {
      setSelectedGroup(selectedId);
      setSelectedLocation(null); // Reset location selection
      setSelectedAsset(null); // Reset asset selection
    } else {
      setSelectedGroup(null);
      setSelectedLocation(null);
      setSelectedAsset(null);
    }
  };

  const handleLocationSelection = (selectedId: string) => {
    if (selectedId) {
      setSelectedLocation(selectedId);
      setSelectedAsset(null); // Reset asset selection
    } else {
      setSelectedLocation(null);
      setSelectedAsset(null);
    }
  };

  const handleAssetSelection = (selectedId: string) => {
    if (selectedId) {
      setSelectedAsset(selectedId);
    } else {
      setSelectedAsset(null);
    }
  };

  const handleOpenAddEntityModal = (
    entityType: "group" | "location" | "asset"
  ) => {
    setEntityModalOpen(entityType);
    setNewEntityName("");
  };

  const handleCloseAddEntityModal = () => {
    setEntityModalOpen(null);
    setNewEntityName("");
  };

  const handleSaveEntity = () => {
    if (newEntityName.trim()) {
      if (entityModalOpen === "group") {
        addGroupMutation.mutate(newEntityName.trim());
      } else if (entityModalOpen === "location") {
        addLocationMutation.mutate(newEntityName.trim());
      } else if (entityModalOpen === "asset") {
        addAssetMutation.mutate(newEntityName.trim());
      }
    }
  };

  return (
    <BackgroundBox sx={{ backgroundColor: BACKGROUND }}>
      <Navbar />
      <Box sx={styles.container}>
        <Paper elevation={0} sx={styles.paper}>
          <Box sx={styles.header}>
            <Box sx={styles.goBackContainer}>
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  router.push("/management?section=2");
                }}
              >
                <ArrowBack sx={{ color: "black" }} />
              </Button>
            </Box>

            <Box sx={styles.coalitionNameContainer}>
              <Typography sx={styles.coalitionNameLabel}>
                Coalition Name
              </Typography>
              <Typography sx={styles.coalitionName}>
                {coalition.name}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
            }}
          >
            {/* Groups List */}
            <Box
              sx={{
                width: listWidth,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ObjectsList
                isRefetching={isRefetching}
                objects={(coalition.groups || []).map((group) => ({
                  id: group.id,
                  name: group.name,
                  extra: group.locations?.length || 0,
                }))}
                tableTitle="Groups"
                column1Title="Group Name"
                column2Title="Locations"
                addButtonText="Add Group"
                onAddClick={() => handleOpenAddEntityModal("group")}
                onDeleteClick={() =>
                  deleteGroupsMutation.mutate(groupsToDelete)
                }
                onSelectionChange={handleGroupSelection}
                selectedId={selectedGroup || undefined}
                selectedIds={groupsToDelete}
                setSelectedIds={setGroupsToDelete}
                isDeleting={deleteGroupsMutation.isPending}
              />
            </Box>

            {/* Locations List - only show if group is selected */}
            {selectedGroupData && (
              <Box
                sx={{
                  width: listWidth,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ObjectsList
                  isRefetching={isRefetching}
                  objects={(selectedGroupData.locations || []).map(
                    (location) => ({
                      id: location.id,
                      name: location.name,
                      extra: location.assets?.length || 0,
                    })
                  )}
                  tableTitle="Locations"
                  column1Title="Location Name"
                  column2Title="Assets"
                  addButtonText="Add Location"
                  onAddClick={() => handleOpenAddEntityModal("location")}
                  onDeleteClick={() =>
                    deleteLocationsMutation.mutate(locationsToDelete)
                  }
                  onSelectionChange={handleLocationSelection}
                  selectedId={selectedLocation || undefined}
                  selectedIds={locationsToDelete}
                  setSelectedIds={setLocationsToDelete}
                  isDeleting={deleteLocationsMutation.isPending}
                  parentEntity={selectedGroupData.name}
                />
              </Box>
            )}

            {/* Assets List - only show if location is selected */}
            {selectedLocationData && (
              <Box
                sx={{
                  width: listWidth,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <ObjectsList
                  isRefetching={isRefetching}
                  objects={(selectedLocationData.assets || []).map((asset) => ({
                    id: asset.id,
                    name: asset.name,
                    extra: asset.sensors_count,
                  }))}
                  tableTitle="Assets"
                  column1Title="Asset Name"
                  column2Title="Sensors"
                  addButtonText="Add Asset"
                  onAddClick={() => handleOpenAddEntityModal("asset")}
                  onDeleteClick={() =>
                    deleteAssetsMutation.mutate(assetsToDelete)
                  }
                  onSelectionChange={handleAssetSelection}
                  selectedId={selectedAsset || undefined}
                  selectedIds={assetsToDelete}
                  setSelectedIds={setAssetsToDelete}
                  isDeleting={deleteAssetsMutation.isPending}
                  parentEntity={selectedLocationData.name}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Add Group Modal */}
      <Dialog
        open={entityModalOpen !== null}
        onClose={handleCloseAddEntityModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New{" "}
          {entityModalOpen === "group"
            ? "Group"
            : entityModalOpen === "location"
            ? "Location"
            : "Asset"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={
              entityModalOpen === "group"
                ? "Group Name"
                : entityModalOpen === "location"
                ? "Location Name"
                : "Asset Name"
            }
            type="text"
            fullWidth
            variant="outlined"
            value={newEntityName}
            onChange={(e) => setNewEntityName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSaveEntity();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ marginRight: "15px", marginBottom: "10px" }}>
          <Button onClick={handleCloseAddEntityModal} sx={{ color: "black" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEntity}
            variant="contained"
            color="secondary"
            disabled={
              !newEntityName.trim() ||
              addGroupMutation.isPending ||
              addLocationMutation.isPending ||
              addAssetMutation.isPending
            }
          >
            {addGroupMutation.isPending ||
            addLocationMutation.isPending ||
            addAssetMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              "Save"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackView
        snackMessage={snackMessage}
        setSnackMessage={setSnackMessage}
      />
    </BackgroundBox>
  );
}
