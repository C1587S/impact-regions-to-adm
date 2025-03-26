# Extract population from LandScan raster and assign it to ADM2 units for a given year

import geopandas as gpd
from rasterstats import zonal_stats
import pandas as pd
import os

# Parameters
shapefile_path = "../data/gadm36_shp/gadm36.shp"
raster_path = "../data/landscan-global-2015-assets/landscan-global-2015.tif"
output_csv = "../outputs/population_by_adm2_2015.csv"

# Read shapefile
gdf = gpd.read_file(shapefile_path)

# Optional test mode: filter for a few countries
test_mode = True
if test_mode:
    target_countries = ["USA", "IND", "MEX", "CHN", "COL"]
    gdf = gdf[gdf["GID_0"].isin(target_countries)]

# Run zonal stats
print("Calculating population by ADM2...")
stats = zonal_stats(gdf, raster_path, stats="sum", geojson_out=True)

# Combine results
stats_gdf = gpd.GeoDataFrame.from_features(stats)
stats_gdf["population"] = stats_gdf["sum"]
stats_gdf["year"] = 2015

# Add IDs from shapefile
stats_gdf["ID_1"] = gdf["ID_1"].values
stats_gdf["ID_2"] = gdf["ID_2"].values
stats_gdf["ISO"] = gdf["GID_0"].values
stats_gdf["ADM1_NAME"] = gdf["NAME_1"].values
stats_gdf["ADM2_NAME"] = gdf["NAME_2"].values

# Final result
result = stats_gdf[["ISO", "ID_1", "ADM1_NAME", "ID_2", "ADM2_NAME", "population", "year"]]
result.to_csv(output_csv, index=False)
print(f"Output saved: {output_csv}")
