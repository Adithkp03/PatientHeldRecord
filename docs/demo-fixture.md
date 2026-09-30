# Public demo fixture

`fixtures/synthetic-generic-demo.json` is independently authored. It demonstrates three sections without copied clinical terminology, source IDs, patient demographics, contact fields, billing, drug schedules or diagnoses. The Synthea/Kaggle exploration informed the table-join review, but this is **not a Kaggle data import** and no source timestamps are copied. Each record explicitly says fictional and not for clinical use.

Run `node scripts/validate-demo-fixture.mjs` for schema checks only. It does not write to a database. Loading a future demo account must be separate, explicit and must not overwrite current QA fixtures.

The originally selected Kaggle version 1 archive (SHA256 0ac5aa6b42a904fa6b775bcb0630865137acaad95a64dd0e7e4e81c6153ee6c4) and its tiny extracted fixture stay private/local pending terminology-rights review. Public card Apache 2.0 does not erase upstream SNOMED obligations. No archive or copied clinical fixture is in this repo.

Research references:
- https://www.kaggle.com/datasets/rajasbamb14/synthea-mimic-clinical-ehr-dataset
- https://raw.githubusercontent.com/synthetichealth/synthea/master/NOTICE
- https://docs.snomed.org/snomed-ct-practical-guides/vendor-introduction-to-snomed-ct/7-licensing

Limit: deliberately generic examples demonstrate consent behavior, not realistic medical knowledge or dataset coverage. Do not claim dataset integration, clinical review or model accuracy from this file.
