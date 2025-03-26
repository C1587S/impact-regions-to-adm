# Link each Impact Region (IR) with ADM2/ADM1 regions using the hierarchy and GADM tables

import pandas as pd

# Load hierarchy file (skip metadata header)
hierarchy_df = pd.read_csv("./data/hierarchy.csv", skiprows=31)
gadm_df = pd.read_csv("./data/gadm2.csv")  # Contains OBJECTID, ID_1, ID_2, NAME_1, NAME_2, ISO

# Filter terminal IRs that contain GADM regions
irs = hierarchy_df[
    (hierarchy_df["is_terminal"] == True) &
    (hierarchy_df["gadmid"].notnull()) &
    (hierarchy_df["gadmid"].str.strip() != "")
].copy()

# Expand gadmid strings to rows
irs["gadmid_list"] = irs["gadmid"].str.split()
irs_expanded = irs.explode("gadmid_list").rename(columns={"gadmid_list": "OBJECTID"})

# Match OBJECTIDs with GADM table
irs_expanded["OBJECTID"] = irs_expanded["OBJECTID"].astype(str)
gadm_df["OBJECTID"] = gadm_df["OBJECTID"].astype(str)

# Merge to attach ADM info
merged = pd.merge(irs_expanded, gadm_df, on="OBJECTID", how="left")

# Select relevant columns
final = merged[[
    "agglomid", "region-key", "OBJECTID", "ISO", "ID_1", "NAME_1", "ID_2", "NAME_2"
]]

# Save result
final.to_csv("./outputs/ir_to_adm2_adm1.csv", index=False)
print("Output saved: ir_to_adm2_adm1.csv")
