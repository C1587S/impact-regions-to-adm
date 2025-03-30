import geopandas as gpd
import pandas as pd
from shapely.ops import unary_union
import os

# === Test mode setup ===
test_mode = False
target_countries = ["USA", "IND", "MEX", "CHN", "COL"]

# === Create output subfolder ===
os.makedirs("adm2-geojson-dataset", exist_ok=True)

# === Load IR shapefile ===
print("Loading IR shapefile...")
shapefile_path = "./data/world-combo-new/agglomerated-world-new.shp"
gdf_ir = gpd.read_file(shapefile_path)
gdf_ir["agglomid"] = gdf_ir["color"].astype(float)

# === Load IR ↔ ADM2 mapping ===
print("Loading IR-to-ADM2 mapping...")
df_link = pd.read_csv("./outputs/ir_to_adm2_adm1.csv")
df_link["agglomid"] = df_link["agglomid"].astype(float)
df_link["adm2_id"] = df_link["ISO"] + "_" + df_link["ID_1"].astype(str) + "_" + df_link["ID_2"].astype(str)

if test_mode:
    df_link = df_link[df_link["ISO"].isin(target_countries)]
    print(f"Filtered to {len(df_link)} rows for test countries.")

# === Step 1: Clean problematic IRs (case 4) ===
print("Identifying problematic IRs crossing multiple ADM1...")
irs_multi_adm1 = (
    df_link.groupby("agglomid")["ID_1"].nunique()
    .reset_index(name="n_adm1")
    .query("n_adm1 > 1")["agglomid"]
)
df_link_clean = df_link[~df_link["agglomid"].isin(irs_multi_adm1)].copy()

# === Load GADM shapefile ===
print("Loading GADM shapefile...")
gdf_gadm = gpd.read_file("./data/gadm36_shp/gadm36.shp")
# Ensure ISO column is properly set and no duplicates
if "ISO" in gdf_gadm.columns and "GID_0" in gdf_gadm.columns:
    gdf_gadm.drop(columns=["GID_0"], inplace=True)
elif "ISO" not in gdf_gadm.columns and "GID_0" in gdf_gadm.columns:
    gdf_gadm.rename(columns={"GID_0": "ISO"}, inplace=True)

gdf_gadm = gdf_gadm[gdf_gadm["ID_1"].notna() & gdf_gadm["ID_2"].notna()].copy()
gdf_gadm["ID_1"] = gdf_gadm["ID_1"].astype(int)
gdf_gadm["ID_2"] = gdf_gadm["ID_2"].astype(int)
gdf_gadm["adm2_id"] = (
    gdf_gadm["ISO"] + "_" +
    gdf_gadm["ID_1"].astype(str) + "_" +
    gdf_gadm["ID_2"].astype(str)
)

# === Check and fix GADM column names if needed ===
expected_cols = ["ID_1", "NAME_1", "ID_2", "NAME_2"]
rename_map = {}

if "NAME_1" not in gdf_gadm.columns and "NAME_1_EN" in gdf_gadm.columns:
    rename_map["NAME_1_EN"] = "NAME_1"
if "NAME_2" not in gdf_gadm.columns and "NAME_2_EN" in gdf_gadm.columns:
    rename_map["NAME_2_EN"] = "NAME_2"

if rename_map:
    gdf_gadm.rename(columns=rename_map, inplace=True)

for col in expected_cols:
    if col not in gdf_gadm.columns:
        raise ValueError(f"Missing column '{col}' in GADM shapefile.")

# === Apply test mode filtering ===
if test_mode:
    print("Test mode is ON — filtering to selected countries only.")
    gdf_gadm = gdf_gadm.reset_index(drop=True)
    gdf_gadm = gdf_gadm[gdf_gadm["ISO"].isin(target_countries)].copy()
    df_link_clean = df_link_clean[df_link_clean["ISO"].isin(target_countries)].copy()
    gdf_ir = gdf_ir[gdf_ir["ISO"].isin(target_countries)].copy()

    print(f"→ GADM filtered to: {gdf_gadm['ISO'].unique().tolist()}")
    print(f"→ IRs remaining: {len(gdf_ir)}")
    print(f"→ Link table entries: {len(df_link_clean)}")
else:
    print("Test mode is OFF — processing all countries.")

# === Classify ADM2 cases ===
print("Classifying cases...")
adm2_ir_counts = df_link_clean.groupby("adm2_id")["agglomid"].nunique().reset_index(name="n_irs")
ir_adm2_counts = df_link_clean.groupby("agglomid")["adm2_id"].nunique().reset_index(name="n_adm2")

case1 = df_link_clean.merge(adm2_ir_counts, on="adm2_id")
case1 = case1[case1["n_irs"] == 1]

case2 = df_link_clean.merge(ir_adm2_counts, on="agglomid")
case2 = case2[case2["n_adm2"] > 1]

# Case 3: ADM2 has multiple IRs (but each IR only belongs to one ADM2)
case3 = df_link_clean.merge(adm2_ir_counts, on="adm2_id")
case3 = case3[case3["n_irs"] > 1]

# Remove overlaps (avoid duplication of rows in case1 or case2)
case3 = case3[~case3["adm2_id"].isin(case1["adm2_id"])]
case3 = case3[~case3["agglomid"].isin(case2["agglomid"])]

print(f"Case 1: {len(case1)} rows")
print(f"Case 2: {len(case2)} rows")
print(f"Case 3: {len(case3)} rows")

# === Case 1: Use geometry from IR ===
print("Processing Case 1 (single IR per ADM2)...")
case1_with_geom = case1.merge(
    gdf_ir[["agglomid", "geometry"]],
    on="agglomid",
    how="left"
)

# Group by ADM2 to keep schema consistent
gdf_case1_grouped = (
    case1_with_geom
    .groupby("adm2_id")
    .agg({
        "agglomid": lambda x: list(x.unique()),
        "geometry": "first",
        "ID_1": "first",
        "ID_2": "first",
        "NAME_1": "first",
        "NAME_2": "first"
    })
    .reset_index()
)

gdf_case1_grouped["geom_source"] = "IR"
gdf_case1_grouped["case_type"] = "Case 1: IR = ADM2"
gdf_case1 = gpd.GeoDataFrame(gdf_case1_grouped, geometry="geometry", crs=gdf_ir.crs)
gdf_case1 = gdf_case1[[
    "adm2_id", "agglomid", "ID_1", "NAME_1", "ID_2", "NAME_2",
    "geometry", "geom_source", "case_type"
]]

# === Case 2: Use geometry from GADM ===
print("Processing Case 2 (grouping by ADM2)...")
case2_with_geom = case2.merge(
    gdf_gadm[[
        "adm2_id", "geometry", "ID_1", "ID_2", "NAME_1", "NAME_2"
    ]],
    on="adm2_id",
    how="left"
)

# Ensure required columns are present (fallback if missing from merge)
for col in ["ID_1", "ID_2", "NAME_1", "NAME_2"]:
    if col not in case2_with_geom.columns:
        case2_with_geom[col] = None  # Fill with None if not merged properly

# Group by ADM2 and aggregate agglomids as lists
gdf_case2_grouped = (
    case2_with_geom
    .groupby("adm2_id")
    .agg({
        "agglomid": lambda x: list(x.unique()),
        "geometry": "first",  # geometry from GADM
        "ID_1": "first",
        "ID_2": "first",
        "NAME_1": "first",
        "NAME_2": "first"
    })
    .reset_index()
)

gdf_case2_grouped["geom_source"] = "GADM"
gdf_case2_grouped["case_type"] = "Case 2: IR covers multiple ADM2s"

# Handle missing geometries
missing_case2 = gdf_case2_grouped[gdf_case2_grouped["geometry"].isna()].copy()
missing_case2.to_csv("outputs/geometries/missing_case2_geometries.csv", index=False)
print(f"Saved {len(missing_case2)} missing geometries for Case 2")

gdf_case2 = gdf_case2_grouped[~gdf_case2_grouped["geometry"].isna()].copy()
gdf_case2 = gpd.GeoDataFrame(gdf_case2, geometry="geometry", crs=gdf_gadm.crs)
gdf_case2 = gdf_case2[[
    "adm2_id", "agglomid", "ID_1", "NAME_1", "ID_2", "NAME_2",
    "geometry", "geom_source", "case_type"
]]
# === Case 3: Union of multiple IRs assigned to the same ADM2 ===
print("Processing Case 3 (union of IRs per ADM2)...")
gdf_case3_parts = case3.merge(
    gdf_ir[["agglomid", "geometry"]],
    on="agglomid",
    how="left"
)

gdf_case3_grouped = (
    gdf_case3_parts
    .groupby("adm2_id")
    .agg({
        "agglomid": lambda x: list(x.unique()),
        "geometry": lambda x: unary_union([geom for geom in x if geom is not None])
    })
    .reset_index()
)

# Avoid duplicates before merging GADM info
gadm_subset = (
    gdf_gadm[["adm2_id", "ID_1", "NAME_1", "ID_2", "NAME_2"]]
    .drop_duplicates(subset="adm2_id")
)

gdf_case3_grouped = gdf_case3_grouped.merge(
    gadm_subset,
    on="adm2_id",
    how="left"
)

gdf_case3_grouped["geom_source"] = "IR union"
gdf_case3_grouped["case_type"] = "Case 3: ADM2 = multiple IRs"
gdf_case3 = gpd.GeoDataFrame(gdf_case3_grouped, geometry="geometry", crs=gdf_ir.crs)
gdf_case3 = gdf_case3[[
    "adm2_id", "agglomid", "ID_1", "NAME_1", "ID_2", "NAME_2",
    "geometry", "geom_source", "case_type"
]]

# Check and export missing or empty geometries
missing_case3 = gdf_case3[gdf_case3["geometry"].is_empty | gdf_case3["geometry"].isna()].copy()
if not missing_case3.empty:
    missing_case3.to_csv("outputs/geometries/missing_case3_geometries.csv", index=False)
    print(f"Saved {len(missing_case3)} missing or empty geometries for Case 3")

# Keep only valid geometries
gdf_case3 = gdf_case3[~(gdf_case3["geometry"].is_empty | gdf_case3["geometry"].isna())].copy()
# === Combine all cases into a single GeoDataFrame ===
print("Merging all cases into a single GeoDataFrame...")
gdf_all_cases = pd.concat([gdf_case1, gdf_case2, gdf_case3], ignore_index=True)

# Final consistency check: ensure adm2_id is unique
duplicates = gdf_all_cases["adm2_id"].duplicated()
if duplicates.any():
    print(f"Warning: {duplicates.sum()} duplicated adm2_id entries found.")
    gdf_all_cases = gdf_all_cases[~duplicates].copy()

# === Export one GeoJSON per country ===
output_folder = "adm2-geojson-dataset"
os.makedirs(output_folder, exist_ok=True)


# === Identify missing countries and create fallback Case 4 ===
existing_isos = set(gdf_all_cases["adm2_id"].str.split("_").str[0])
all_isos = set(df_link["ISO"].unique())
isos_missing = sorted(all_isos - existing_isos)

print(f"Adding fallback Case 4 for {len(isos_missing)} countries without any ADM2 processed...")

gdf_case4 = gdf_gadm[gdf_gadm["ISO"].isin(isos_missing)].copy()

if not gdf_case4.empty:
    gdf_case4["agglomid"] = None
    gdf_case4["geom_source"] = "GADM fallback"
    gdf_case4["case_type"] = "Case 4: ADM2 with no IR assigned"
    gdf_case4 = gdf_case4[[
        "adm2_id", "agglomid", "ID_1", "NAME_1", "ID_2", "NAME_2",
        "geometry", "geom_source", "case_type"
    ]]
    
    gdf_case4 = gpd.GeoDataFrame(gdf_case4, geometry="geometry", crs=gdf_gadm.crs)

    # Add to all cases
    gdf_all_cases = pd.concat([gdf_all_cases, gdf_case4], ignore_index=True)


gdf_all_cases["ISO"] = gdf_all_cases["adm2_id"].str.split("_").str[0]

for iso, group in gdf_all_cases.groupby("ISO"):
    country_path = os.path.join(output_folder, f"{iso}_adm2.geojson")
    if os.path.exists(country_path):
        print(f"Skipped {iso} — GeoJSON already exists.")
        continue
    group.to_file(country_path, driver="GeoJSON")
    print(f"Saved {len(group)} ADM2s for {iso} to: {country_path}")
    
# Check which countries do not have geojson
log_path = os.path.join(output_folder, "export_log.txt")
with open(log_path, "w") as log_file:
    for iso in df_link["ISO"].unique():
        country_path = os.path.join(output_folder, f"{iso}_adm2.geojson")
        if not os.path.exists(country_path):
            log_file.write(f"[WARNING] {iso}: ADM2 GeoJSON was not generated.\n")


# === Export problematic IRs (those crossing multiple ADM1 units) ===
print("Exporting problematic IRs (crossing multiple ADM1s)...")
output_problematic = os.path.join(output_folder, "ir_problematic")
os.makedirs(output_problematic, exist_ok=True)

# Merge to get ISO information for each problematic agglomid
problematic_irs = pd.DataFrame({"agglomid": irs_multi_adm1})
problematic_irs = problematic_irs.merge(df_link[["agglomid", "ISO"]], on="agglomid", how="left").drop_duplicates()

# Merge with geometry
gdf_problematic = problematic_irs.merge(
    gdf_ir[["agglomid", "geometry"]],
    on="agglomid",
    how="left"
)
gdf_problematic = gpd.GeoDataFrame(gdf_problematic, geometry="geometry", crs=gdf_ir.crs)

# Export one GeoJSON per country
for iso, group in gdf_problematic.groupby("ISO"):
    path = os.path.join(output_problematic, f"{iso}_ir_problematic.geojson")
    group.to_file(path, driver="GeoJSON")
    print(f"Saved {len(group)} problematic IRs for {iso} to: {path}")

