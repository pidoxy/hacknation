import json
import math
import random
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple

from models.facility import Facility, RegionStats, DataQualityStats


DATA_DIR = Path(__file__).parent.parent / "data"

# Key capability categories for medical desert analysis
CAPABILITY_CATEGORIES = [
    "Emergency Care",
    "Surgery",
    "Maternal/Obstetric",
    "Pediatrics",
    "Internal Medicine",
    "Dental",
    "Infectious Disease",
    "Cardiology",
    "Imaging/Radiology",
    "Laboratory",
]

CAPABILITY_KEYWORDS = {
    "Emergency Care": ["emergency", "trauma", "accident", "urgent care", "casualty", "er ", "a&e"],
    "Surgery": ["surgery", "surgical", "operating", "theatre", "theater", "operation"],
    "Maternal/Obstetric": ["maternal", "obstetric", "maternity", "delivery", "antenatal", "prenatal",
                           "postnatal", "midwife", "midwifery", "gynecol", "labour", "labor",
                           "c-section", "cesarean", "caesarean", "neonatal"],
    "Pediatrics": ["pediatric", "paediatric", "child", "children", "neonatal", "nicu", "newborn"],
    "Internal Medicine": ["internal medicine", "general medicine", "medical ward", "physician"],
    "Dental": ["dental", "dentist", "dentistry", "orthodont", "oral health", "tooth", "teeth"],
    "Infectious Disease": ["infectious", "hiv", "aids", "tuberculosis", "tb ", "malaria",
                           "hepatitis", "tropical", "communicable"],
    "Cardiology": ["cardio", "cardiac", "heart", "cardiovascular", "ecg", "echo"],
    "Imaging/Radiology": ["x-ray", "xray", "ultrasound", "ct scan", "mri", "imaging",
                          "radiolog", "radiology", "scan", "sonograph"],
    "Laboratory": ["laboratory", "lab ", "pathology", "blood test", "diagnostic test",
                   "microbiology", "hematology", "biochemistry"],
}

# Ghana estimated regional populations (2024 projections)
REGION_POPULATIONS = {
    "Greater Accra": 5_450_000,
    "Ashanti": 5_800_000,
    "Western": 2_950_000,
    "Eastern": 3_050_000,
    "Central": 2_600_000,
    "Northern": 2_900_000,
    "Volta": 1_900_000,
    "Bono": 1_250_000,
    "Bono East": 1_200_000,
    "Upper East": 1_300_000,
    "Upper West": 900_000,
    "Oti": 760_000,
    "Ahafo": 600_000,
    "Western North": 850_000,
    "North East": 600_000,
    "Savannah": 600_000,
}


class DataStore:
    """In-memory data store for all facility data and pre-computed analytics."""

    def __init__(self):
        self.facilities: List[Facility] = []
        self.facilities_df: Optional[pd.DataFrame] = None
        self.region_stats: Dict[str, RegionStats] = {}
        self.data_quality: Optional[DataQualityStats] = None
        self.desert_matrix: List[dict] = []
        self.anomalies: List[dict] = []
        self._region_map: dict = {}
        self._city_coords: dict = {}
        self._city_to_region: dict = {}
        self._region_centroids: dict = {}

    def load(self, csv_path: str = None):
        """Load and process all data."""
        if csv_path is None:
            csv_path = str(DATA_DIR / "ghana_facilities.csv")

        # Load reference data
        self._load_reference_data()

        # Load and clean CSV
        df = pd.read_csv(csv_path)
        original_count = len(df)

        # Parse JSON array fields
        json_fields = ["specialties", "phone_numbers", "websites", "procedure",
                       "equipment", "capability", "affiliationTypeIds", "countries"]
        for field in json_fields:
            if field in df.columns:
                df[field] = df[field].apply(self._parse_json_array)

        # Normalize regions
        region_fixes = 0
        if "address_stateOrRegion" in df.columns:
            df["normalized_region"] = df.apply(self._normalize_region, axis=1)
            region_fixes = df["normalized_region"].notna().sum() - df["address_stateOrRegion"].notna().sum()

        # Deduplicate by pk_unique_id
        if "pk_unique_id" in df.columns:
            df_deduped = self._deduplicate(df)
        else:
            df_deduped = df

        unique_count = len(df_deduped)

        # Add geocoding
        df_deduped["lat"] = None
        df_deduped["lng"] = None
        df_deduped = df_deduped.apply(self._geocode_row, axis=1)

        # Calculate data completeness per row
        df_deduped["data_completeness"] = df_deduped.apply(self._calc_completeness, axis=1)

        # Detect anomalies
        df_deduped["anomalies"] = df_deduped.apply(self._detect_row_anomalies, axis=1)

        # Convert to Facility objects
        self.facilities = [self._row_to_facility(row) for _, row in df_deduped.iterrows()]
        self.facilities_df = df_deduped

        # Compute region stats and desert matrix
        self._compute_region_stats()
        self._compute_desert_matrix()

        # Compute data quality stats
        self.data_quality = DataQualityStats(
            total_facilities=original_count,
            unique_facilities=unique_count,
            duplicates_found=original_count - unique_count,
            enrichment_rate=round(df_deduped["data_completeness"].mean() * 100, 1),
            fields_normalized=region_fixes,
            region_variants_fixed=abs(region_fixes) if region_fixes < 0 else region_fixes,
            avg_completeness=round(df_deduped["data_completeness"].mean() * 100, 1),
            completeness_by_region=self._completeness_by_region(df_deduped),
            completeness_by_field=self._completeness_by_field(df_deduped),
        )

        return self

    def _load_reference_data(self):
        with open(DATA_DIR / "ghana_regions.json") as f:
            self._region_map = json.load(f)
        with open(DATA_DIR / "city_coords.json") as f:
            coords_data = json.load(f)
            self._city_coords = coords_data["cities"]
            self._region_centroids = coords_data["region_centroids"]
            self._city_to_region = coords_data["city_to_region"]

    def _parse_json_array(self, val) -> list:
        if pd.isna(val) or val == "" or val == "[]":
            return []
        if isinstance(val, list):
            return val
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return parsed
            return [str(parsed)]
        except (json.JSONDecodeError, TypeError):
            return [str(val)] if val else []

    def _normalize_region(self, row) -> Optional[str]:
        region = row.get("address_stateOrRegion")
        if pd.notna(region) and str(region).strip():
            key = str(region).strip().lower()
            if key in self._region_map:
                return self._region_map[key]
            # Fuzzy match: try without "region" suffix
            for map_key, map_val in self._region_map.items():
                if key in map_key or map_key in key:
                    return map_val

        # Try inferring from city
        city = row.get("address_city")
        if pd.notna(city) and str(city).strip():
            city_key = str(city).strip().lower()
            if city_key in self._city_to_region:
                return self._city_to_region[city_key]

        return str(region).strip() if pd.notna(region) and str(region).strip() else None

    def _deduplicate(self, df: pd.DataFrame) -> pd.DataFrame:
        """Merge duplicate rows by pk_unique_id, keeping the most complete data."""
        groups = df.groupby("pk_unique_id")
        merged_rows = []

        for uid, group in groups:
            if len(group) == 1:
                merged_rows.append(group.iloc[0])
            else:
                # Merge: for each column, pick the most informative value
                merged = group.iloc[0].copy()
                for col in group.columns:
                    values = group[col].dropna()
                    if len(values) == 0:
                        continue
                    # For list fields, merge unique items
                    if col in ["specialties", "procedure", "equipment", "capability",
                               "phone_numbers", "websites", "affiliationTypeIds"]:
                        all_items = []
                        for v in values:
                            if isinstance(v, list):
                                all_items.extend(v)
                        merged[col] = list(set(all_items))
                    else:
                        # Pick longest non-null string value
                        str_vals = [str(v) for v in values if pd.notna(v) and str(v).strip()]
                        if str_vals:
                            merged[col] = max(str_vals, key=len)
                merged_rows.append(merged)

        return pd.DataFrame(merged_rows).reset_index(drop=True)

    def _geocode_row(self, row):
        city = row.get("address_city")
        region = row.get("normalized_region")

        if pd.notna(city) and str(city).strip():
            city_key = str(city).strip().lower()
            if city_key in self._city_coords:
                coords = self._city_coords[city_key]
                row["lat"] = coords[0] + random.uniform(-0.01, 0.01)
                row["lng"] = coords[1] + random.uniform(-0.01, 0.01)
                return row

        if pd.notna(region) and str(region) in self._region_centroids:
            coords = self._region_centroids[str(region)]
            row["lat"] = coords[0] + random.uniform(-0.05, 0.05)
            row["lng"] = coords[1] + random.uniform(-0.05, 0.05)
            return row

        # Default: Ghana center with jitter
        row["lat"] = 7.9465 + random.uniform(-0.1, 0.1)
        row["lng"] = -1.0232 + random.uniform(-0.1, 0.1)
        return row

    def _calc_completeness(self, row) -> float:
        key_fields = ["name", "address_city", "address_stateOrRegion", "facilityTypeId",
                      "specialties", "capability", "procedure", "equipment", "description",
                      "phone_numbers", "email", "websites"]
        filled = 0
        for f in key_fields:
            val = row.get(f)
            # pd.notna can return an array for array-like values; coerce to scalar
            try:
                not_null = bool(pd.notna(val))
            except ValueError:
                not_null = True  # array-like means data is present
            if not_null:
                if isinstance(val, (list, np.ndarray)) and len(val) > 0:
                    filled += 1
                elif isinstance(val, str) and val.strip():
                    filled += 1
                elif isinstance(val, (int, float)) and not math.isnan(val):
                    filled += 1
        return round(filled / len(key_fields), 2)

    def _detect_row_anomalies(self, row) -> list:
        anomalies = []
        specialties = row.get("specialties", [])
        capabilities = row.get("capability", [])
        procedures = row.get("procedure", [])
        equipment = row.get("equipment", [])
        facility_type = row.get("facilityTypeId", "")
        cap_text = " ".join(capabilities).lower() if capabilities else ""
        proc_text = " ".join(procedures).lower() if procedures else ""
        equip_text = " ".join(equipment).lower() if equipment else ""

        # Clinic claiming surgical capabilities
        if facility_type == "clinic" and ("surgery" in cap_text or "surgical" in proc_text):
            anomalies.append("Clinic claims surgical capabilities — verify")

        # Claims MRI/CT but no imaging equipment listed
        if ("mri" in cap_text or "ct scan" in cap_text) and not any(
            k in equip_text for k in ["mri", "ct ", "scanner"]
        ):
            if equip_text:
                anomalies.append("Claims imaging capability but no imaging equipment listed")

        # Large specialty count for facility type
        if isinstance(specialties, list) and len(specialties) > 8 and facility_type in ["clinic", "dentist"]:
            anomalies.append(f"Unusually high specialty count ({len(specialties)}) for {facility_type}")

        # Many procedures but no equipment
        if isinstance(procedures, list) and len(procedures) > 5 and (not equipment or len(equipment) == 0):
            anomalies.append("Multiple procedures listed but no equipment data")

        return anomalies

    def _row_to_facility(self, row) -> Facility:
        def safe_list(val):
            if isinstance(val, list):
                return [str(item) for item in val if item is not None and str(item).strip()]
            return []

        def safe_str(val):
            if pd.isna(val):
                return None
            return str(val).strip() if str(val).strip() else None

        def safe_int(val):
            if pd.isna(val):
                return None
            try:
                return int(float(val))
            except (ValueError, TypeError):
                return None

        def safe_float(val):
            if pd.isna(val):
                return None
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        return Facility(
            unique_id=str(row.get("pk_unique_id", "")),
            content_table_id=safe_str(row.get("content_table_id")),
            name=safe_str(row.get("name")) or "Unknown Facility",
            facility_type=safe_str(row.get("facilityTypeId")),
            operator_type=safe_str(row.get("operatorTypeId")),
            description=safe_str(row.get("description")),
            specialties=safe_list(row.get("specialties")),
            capabilities=safe_list(row.get("capability")),
            procedures=safe_list(row.get("procedure")),
            equipment=safe_list(row.get("equipment")),
            address_city=safe_str(row.get("address_city")),
            address_region=safe_str(row.get("address_stateOrRegion")),
            address_country="Ghana",
            phone_numbers=safe_list(row.get("phone_numbers")),
            email=safe_str(row.get("email")),
            websites=safe_list(row.get("websites")),
            year_established=safe_int(row.get("yearEstablished")),
            number_doctors=safe_int(row.get("numberDoctors")),
            capacity=safe_int(row.get("capacity")),
            lat=safe_float(row.get("lat")),
            lng=safe_float(row.get("lng")),
            data_completeness=float(row.get("data_completeness", 0)),
            anomalies=safe_list(row.get("anomalies")),
            normalized_region=safe_str(row.get("normalized_region")),
        )

    def _compute_region_stats(self):
        for region in REGION_POPULATIONS:
            region_facilities = [f for f in self.facilities if f.normalized_region == region]
            hospitals = [f for f in region_facilities if f.facility_type == "hospital"]
            clinics = [f for f in region_facilities if f.facility_type == "clinic"]

            # Gather all specialties in the region
            all_specialties = set()
            for f in region_facilities:
                all_specialties.update(f.specialties)

            # Compute capability coverage
            coverage = {}
            for cat, keywords in CAPABILITY_KEYWORDS.items():
                count = 0
                for f in region_facilities:
                    text = " ".join(f.capabilities + f.procedures + f.equipment).lower()
                    if any(kw in text for kw in keywords):
                        count += 1
                coverage[cat] = count

            # Determine desert gaps
            gaps = [cat for cat, count in coverage.items() if count == 0]
            anomaly_count = sum(len(f.anomalies) for f in region_facilities)

            self.region_stats[region] = RegionStats(
                region=region,
                total_facilities=len(region_facilities),
                hospitals=len(hospitals),
                clinics=len(clinics),
                specialties_available=sorted(all_specialties),
                capabilities_coverage=coverage,
                avg_data_completeness=round(
                    sum(f.data_completeness for f in region_facilities) / max(len(region_facilities), 1) * 100, 1
                ),
                anomaly_count=anomaly_count,
                is_medical_desert=len(gaps) >= 3,
                desert_gaps=gaps,
            )

    def _compute_desert_matrix(self):
        self.desert_matrix = []
        for region in REGION_POPULATIONS:
            stats = self.region_stats.get(region)
            if not stats:
                continue
            for cap in CAPABILITY_CATEGORIES:
                count = stats.capabilities_coverage.get(cap, 0)
                if count == 0:
                    status = "critical"
                elif count <= 2:
                    status = "underserved"
                else:
                    status = "adequate"
                self.desert_matrix.append({
                    "region": region,
                    "capability": cap,
                    "facility_count": count,
                    "status": status,
                })

    def _completeness_by_region(self, df) -> dict:
        result = {}
        for region in REGION_POPULATIONS:
            region_df = df[df["normalized_region"] == region]
            if len(region_df) > 0:
                result[region] = round(region_df["data_completeness"].mean() * 100, 1)
            else:
                result[region] = 0.0
        return result

    def _completeness_by_field(self, df) -> dict:
        fields = ["name", "address_city", "address_stateOrRegion", "facilityTypeId",
                  "specialties", "capability", "procedure", "equipment", "description",
                  "phone_numbers", "email", "websites"]
        result = {}
        for f in fields:
            if f not in df.columns:
                result[f] = 0.0
                continue
            col = df[f]
            non_empty = col.apply(
                lambda v: bool(v) if isinstance(v, list) else (pd.notna(v) and str(v).strip() != "")
            ).sum()
            result[f] = round(non_empty / len(df) * 100, 1)
        return result

    def get_facility(self, unique_id: str) -> Optional[Facility]:
        for f in self.facilities:
            if f.unique_id == unique_id:
                return f
        return None

    def search_facilities(self, region: str = None, facility_type: str = None,
                          specialty: str = None, has_anomalies: bool = None) -> List[Facility]:
        results = self.facilities
        if region:
            results = [f for f in results if f.normalized_region and
                       f.normalized_region.lower() == region.lower()]
        if facility_type:
            results = [f for f in results if f.facility_type and
                       f.facility_type.lower() == facility_type.lower()]
        if specialty:
            results = [f for f in results
                       if any(specialty.lower() in s.lower() for s in f.specialties)]
        if has_anomalies is not None:
            if has_anomalies:
                results = [f for f in results if len(f.anomalies) > 0]
            else:
                results = [f for f in results if len(f.anomalies) == 0]
        return results


# Global data store instance
data_store = DataStore()
