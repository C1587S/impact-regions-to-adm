import geopandas as gpd
import os

# === Configuration ===
test_mode = False
target_countries = ["USA", "IND", "MEX", "CHN", "COL"]
input_shapefile = "./data/world-combo-new/agglomerated-world-new.shp"
output_folder = "adm2-geojson-dataset"

# === Create output folder ===
os.makedirs(output_folder, exist_ok=True)

# === Load IR shapefile ===
print("Loading IR shapefile...")
gdf_ir = gpd.read_file(input_shapefile)

# === Identify available ISO column ===
iso_column_candidates = ["ISO", "iso", "GID_0", "country", "COUNTRY"]
iso_column = next((col for col in iso_column_candidates if col in gdf_ir.columns), None)

if not iso_column:
    raise ValueError("Could not find ISO country code column in IR shapefile.")

# === Filter by test_mode if needed ===
if test_mode:
    gdf_ir = gdf_ir[gdf_ir[iso_column].isin(target_countries)].copy()
    print(f"Test mode is ON — processing countries: {sorted(gdf_ir[iso_column].unique())}")
else:
    print(f"Test mode is OFF — processing all countries: {sorted(gdf_ir[iso_column].unique())}")

# === Save one GeoJSON per country ===
for iso_code, country_gdf in gdf_ir.groupby(iso_column):
    output_path = os.path.join(output_folder, f"{iso_code}_ir.geojson")
    country_gdf.to_file(output_path, driver="GeoJSON")
    print(f"Saved {output_path} with {len(country_gdf)} IRs and columns: {list(country_gdf.columns)}")
