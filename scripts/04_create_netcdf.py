# Create a NetCDF4 file with population and IR→ADM2 mapping across multiple years, including ADM metadata

import pandas as pd
import numpy as np
from netCDF4 import Dataset
import glob
import re
import os

# Detect population files by year
population_files = sorted(glob.glob("./outputs/population_by_adm2_*.csv"))
year_pattern = re.compile(r"(\d{4})")

# Load and combine population files
pop_list = []

print(f"Found population files: {population_files}")

for file in population_files:
    year_match = year_pattern.search(file) 
    if not year_match:
        print(f"Warning: Could not find year in filename {file}")
        continue
    year = int(year_match.group(1))
    try:
        df = pd.read_csv(file)
        if not df.empty:
            df["year"] = year
            pop_list.append(df)
        else:
            print(f"Warning: {file} is empty. Skipping.")
    except Exception as e:
        print(f"Error loading {file}: {e}")

if not pop_list:
    raise ValueError("No valid population files found to process.")

population_df = pd.concat(pop_list, ignore_index=True)

# Normalize column names
if "ISO" not in population_df.columns and "GID_0" in population_df.columns:
    population_df["ISO"] = population_df["GID_0"]
if "ADM1_NAME" not in population_df.columns:
    population_df["ADM1_NAME"] = population_df["NAME_1"]
if "ADM2_NAME" not in population_df.columns:
    population_df["ADM2_NAME"] = population_df["NAME_2"]

# Load IR to ADM2 mapping
mapping_df = pd.read_csv("./outputs/ir_to_adm2_adm1.csv")

# Build ADM2 index
adm2_keys = population_df[["ISO", "ID_1", "ID_2", "ADM1_NAME", "ADM2_NAME"]].drop_duplicates().reset_index(drop=True)
adm2_keys["adm2_index"] = np.arange(len(adm2_keys))

# ADM1 index
adm1_keys = adm2_keys[["ISO", "ID_1", "ADM1_NAME"]].drop_duplicates().reset_index(drop=True)
adm1_keys["adm1_index"] = np.arange(len(adm1_keys))

# Add ADM1 index to ADM2
adm2_keys = adm2_keys.merge(adm1_keys, on=["ISO", "ID_1", "ADM1_NAME"], how="left")

# Merge population with indices
pop = population_df.merge(adm2_keys, on=["ISO", "ID_1", "ID_2", "ADM1_NAME", "ADM2_NAME"], how="left")

# Create population matrix
years = sorted(pop["year"].unique())
year_index = {year: i for i, year in enumerate(years)}
population_array = np.full((len(adm2_keys), len(years)), np.nan)

for _, row in pop.iterrows():
    i = row["adm2_index"]
    j = year_index[row["year"]]
    population_array[i, j] = row["population"]

# Build IR→ADM2 matrix
ir_keys = mapping_df[["agglomid"]].drop_duplicates().dropna().reset_index(drop=True)
ir_keys["agglomid_index"] = np.arange(len(ir_keys))

mapping_df = mapping_df.merge(adm2_keys, on=["ISO", "ID_1", "ID_2"], how="left")
mapping_df = mapping_df.merge(ir_keys, on="agglomid", how="left")
mapping_df = mapping_df.dropna(subset=["adm2_index", "agglomid_index"])
mapping_df["adm2_index"] = mapping_df["adm2_index"].astype(int)
mapping_df["agglomid_index"] = mapping_df["agglomid_index"].astype(int)

ir_to_adm2_matrix = np.zeros((len(ir_keys), len(adm2_keys)), dtype=np.uint8)
for _, row in mapping_df.iterrows():
    ir_to_adm2_matrix[row["agglomid_index"], row["adm2_index"]] = 1

# Create adm2_to_adm1
adm2_to_adm1 = adm2_keys["adm1_index"].values.astype(np.int32)

# Create NetCDF
os.makedirs("./outputs", exist_ok=True)
ncfile = Dataset("./outputs/impact_regions.nc", mode="w", format="NETCDF4")

# Dimensions
ncfile.createDimension("adm2", len(adm2_keys))
ncfile.createDimension("adm1", len(adm1_keys))
ncfile.createDimension("year", len(years))
ncfile.createDimension("agglomid", len(ir_keys))

# Variables
years_var = ncfile.createVariable("year", np.int32, ("year",))
years_var[:] = years

population_var = ncfile.createVariable("population", np.float32, ("adm2", "year"))
population_var[:, :] = population_array

adm2_to_adm1_var = ncfile.createVariable("adm2_to_adm1", np.int32, ("adm2",))
adm2_to_adm1_var[:] = adm2_to_adm1

ir_to_adm2_var = ncfile.createVariable("ir_to_adm2", np.uint8, ("agglomid", "adm2"))
ir_to_adm2_var[:, :] = ir_to_adm2_matrix

# Metadata variables
iso_var = ncfile.createVariable("iso", str, ("adm2",))
adm2_id1_var = ncfile.createVariable("adm2_id1", np.int32, ("adm2",))
adm2_id2_var = ncfile.createVariable("adm2_id2", np.int32, ("adm2",))
adm2_name_var = ncfile.createVariable("adm2_name", str, ("adm2",))
adm1_name_var = ncfile.createVariable("adm1_name", str, ("adm1",))
agglomid_var = ncfile.createVariable("agglomid_id", np.float32, ("agglomid",))
region_key_var = ncfile.createVariable("region_key", str, ("agglomid",))

# Fill metadata variables
iso_var[:] = adm2_keys["ISO"].fillna("").astype(str).values
adm2_id1_var[:] = adm2_keys["ID_1"].values
adm2_id2_var[:] = adm2_keys["ID_2"].values
adm2_name_var[:] = adm2_keys["ADM2_NAME"].fillna("").astype(str).values
adm1_name_var[:] = adm1_keys["ADM1_NAME"].fillna("").astype(str).values
agglomid_var[:] = ir_keys["agglomid"].values

# Align region-key correctly using merge
region_key_map = ir_keys.merge(
    mapping_df[["agglomid", "region-key"]].drop_duplicates("agglomid"),
    on="agglomid", how="left"
)
region_key_var[:] = region_key_map["region-key"].fillna("").astype(str).values

# Description
ncfile.description = (
    "This dataset provides total population by ADM2 region across years, a binary mapping from IRs to ADM2s, "
    "IR identifiers, and metadata for ADM2/ADM1. Useful for aggregation, disaggregation, and impact estimation."
)

ncfile.close()
print("NetCDF file created with metadata: ./outputs/impact_regions.nc")
