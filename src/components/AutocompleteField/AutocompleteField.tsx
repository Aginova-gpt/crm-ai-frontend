import { Autocomplete, InputAdornment, TextField, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { Search, Close } from "@mui/icons-material";

export default function AutocompleteField(props: {
  placeholder: string;
  storageOptions?: string[];
  storageKey?: string;
  searchText: string;
  setSearchText: (searchText: string) => void;
  tags?: { label: string; enabled: boolean; delete: () => void }[];
}) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (props.storageOptions) {
      setSearchHistory(props.storageOptions);
    } else if (props.storageKey) {
      const savedHistory = localStorage.getItem(props.storageKey);
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setSearchHistory(Array.isArray(history) ? history : []);
        } catch (error) {
          console.error("Error loading search history:", error);
          setSearchHistory([]);
        }
      }
    }
  }, []);

  // Save search to history when a search is performed
  const saveToHistory = (searchTerm: string) => {
    if (!props.storageKey) return;
    if (!searchTerm.trim()) return;

    const updatedHistory = [
      searchTerm,
      ...searchHistory.filter((item) => item !== searchTerm),
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(updatedHistory);
    localStorage.setItem(props.storageKey, JSON.stringify(updatedHistory));
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    props.setSearchText(value);
  };

  // Handle search selection from autocomplete
  const handleSearchSelect = (value: string | null) => {
    if (value) {
      // Call setSearchText first, then let the parent handle the logic
      props.setSearchText(value);
      saveToHistory(value);
    }
  };

  // Handle search on enter or blur
  const handleSearchConfirm = () => {
    if (props.searchText.trim()) {
      saveToHistory(props.searchText.trim());
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={searchHistory}
      value={props.searchText}
      onChange={(_, newValue) => handleSearchSelect(newValue)}
      onBlur={handleSearchConfirm}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSearchConfirm();
        }
      }}
      inputValue={props.searchText}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === "reset") {
          return;
        }
        handleSearchChange(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={props.placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                  {props.tags?.map((tag) => (
                    <Chip
                      key={tag.label}
                      label={tag.label}
                      size="small"
                      disabled={!tag.enabled}
                      onDelete={() => {
                        tag.delete();
                      }}
                      deleteIcon={<Close />}
                      sx={{
                        marginLeft: "8px",
                        height: "24px",
                        fontSize: "12px",
                      }}
                    />
                  ))}
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              height: "40px",
              marginTop: "4px",
              marginLeft: "14px",
            },
          }}
        />
      )}
      sx={{
        "& .MuiAutocomplete-inputRoot": {
          height: "40px",
          marginTop: "4px",
          marginLeft: "14px",
          marginRight: "14px",
        },
      }}
    />
  );
}
