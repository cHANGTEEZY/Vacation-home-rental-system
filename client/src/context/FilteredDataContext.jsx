import { createContext, useState, useContext } from "react";

const FilteredDataContext = createContext();

export const FilteredDataProvider = ({ children }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchState, setSearchState] = useState(false);

  return (
    <FilteredDataContext.Provider
      value={{ filteredData, setFilteredData, searchState, setSearchState }}
    >
      {children}
    </FilteredDataContext.Provider>
  );
};

export const useFilteredData = () => useContext(FilteredDataContext);
