# impact-regions-to-adm

This repository contains scripts and data-processing logic to transform Impact Regions (IRs) into standardized administrative units (ADM2 and ADM1) using GADM version 3.6 and LandScan population rasters. The goal is to facilitate consistent regionalization of climate impact or socioeconomic data for further aggregation, visualization, or policy analysis.

## Repository Structure

```
impact-regions-to-adm/
├── data/
│   ├── gadm36_shp/                  # GADM v3.6 shapefile (ADM-level geometries)
│   ├── landscan-global-2015.tif     # LandScan raster (2015)
│   ├── hierarchy.csv                # Region hierarchy definition
│   ├── gadm2.csv                    # Attributes from GADM2 shapefile (prepared manually)
│   └── example_outputs/             # Sample results for validation
│
├── scripts/
│   ├── 01_link_ir_to_adm.py
│   ├── 02_summarize_ir_adm_relations.py
│   └── 03_extract_population.py
│
├── outputs/
│   ├── ir_to_adm2_adm1.csv
│   ├── ir_adm_stats.csv
│   ├── population_by_adm2_2015.csv
│   └── population_shapefile_2015/
│
├── README.md
└── requirements.txt
```

## Data Notes

### GADM 3.6

The GADM shapefile used in this project corresponds to GADM version 3.6, which includes `ID_1` and `ID_2` fields for identifying ADM1 and ADM2 units. These identifiers are directly compatible with those used in the `gadm2.csv` and `hierarchy.csv` files.

### gadm2.csv

This file provides ADM-level attributes (country, ADM1, ADM2 names and codes) for each spatial unit, and is required to map `OBJECTID`s found in the IR hierarchy. It was prepared manually using QGIS and is referenced as:

```
/shares/gcp/social/processed/gadm2/gadm2.csv
(midway3.rcc.uchicago.edu:/project/cil/sacagawea_shares/gcp/social/processed/gadm2/gadm2.csv)
```

## Scripts

### 01_link_ir_to_adm.py

This script links each Impact Region (`agglomid`) defined in `hierarchy.csv` with the corresponding ADM2 and ADM1 regions from `gadm2.csv`, using `OBJECTID` as the join key. It outputs a file `ir_to_adm2_adm1.csv` that serves as the bridge between IRs and administrative boundaries.

### 02_summarize_ir_adm_relations.py

This script analyzes the relationships between IRs and ADM2s. It calculates how many:

- IRs cover multiple ADM2s (requiring disaggregation)
- ADM2s contain multiple IRs (requiring aggregation)

The results are saved in `ir_adm_stats.csv`.

### 03_extract_population.py

This script extracts total population per ADM2 region using LandScan 2015 raster data. It supports both full and test-mode runs (with only selected countries). It produces a table of population by ADM2 with ISO codes and names, saved as `population_by_adm2_2015.csv`.
