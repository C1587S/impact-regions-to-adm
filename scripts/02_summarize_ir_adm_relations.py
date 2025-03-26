# Compute summary statistics about how Impact Regions relate to ADM2 units

import pandas as pd

df = pd.read_csv("../outputs/ir_to_adm2_adm1.csv")

# Total counts
total_irs = df["agglomid"].nunique()
total_adm2 = df[["ISO", "ID_1", "ID_2"]].drop_duplicates().shape[0]

# ADM2s that contain multiple IRs
adm2_grouped = df.groupby(["ISO", "ID_1", "ID_2"])["agglomid"].nunique().reset_index()
adm2_multi_ir = adm2_grouped[adm2_grouped["agglomid"] > 1].shape[0]

# IRs that contain multiple ADM2s
ir_grouped = df.groupby("agglomid")[["ID_2"]].nunique().reset_index()
ir_multi_adm2 = ir_grouped[ir_grouped["ID_2"] > 1].shape[0]

# Save summary
summary_df = pd.DataFrame({
    "metric": [
        "Total IRs",
        "Total ADM2s",
        "ADM2s with multiple IRs",
        "IRs covering multiple ADM2s"
    ],
    "count": [
        total_irs,
        total_adm2,
        adm2_multi_ir,
        ir_multi_adm2
    ]
})
summary_df.to_csv("../outputs/ir_adm_stats.csv", index=False)
print("Summary saved: ir_adm_stats.csv")
