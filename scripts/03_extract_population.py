# Extract population from LandScan raster and assign it to ADM2 units for a given year

import geopandas as gpd
from rasterstats import zonal_stats
import pandas as pd
import os

# Parameters
year = 2015
shapefile_path = "./data/gadm36_shp/gadm36.shp"
raster_path = f"./data/landscan/landscan-global-{year}-assets/landscan-global-{year}.tif"
output_csv = f"./outputs/population_by_adm2_{year}.csv"

# Read GADM shapefile
gdf = gpd.read_file(shapefile_path)

# Optional test mode: process only a subset of countries
test_mode = True
if test_mode:
    target_countries = ["USA", "IND", "MEX", "CHN", "COL"]
    print(f"Using test mode. Only processing: {', '.join(target_countries)}")
    gdf = gdf[gdf["GID_0"].isin(target_countries)]

# Run zonal statistics to extract population sum per geometry
print("Calculating population per geometry...")
stats = zonal_stats(gdf, raster_path, stats="sum")

# Attach population to attribute data
df_ids = gdf[["GID_0", "ID_1", "NAME_1", "ID_2", "NAME_2"]].copy()
df_ids["population"] = [s["sum"] for s in stats]

# Group by ADM2 units and sum population across geometries
print("Aggregating population by ADM2...")
pop_by_adm2 = df_ids.groupby(["GID_0", "ID_1", "NAME_1", "ID_2", "NAME_2"]).agg(
    population=("population", "sum")
).reset_index()

# Add year column
pop_by_adm2["year"] = year

# Save result
pop_by_adm2.to_csv(output_csv, index=False)
print(f"Output saved: {output_csv}")