import React, { useState, useEffect } from 'react';
import { Truck, X, Loader2, Eye, Package, AlertTriangle, Hash, MapPin, Wrench, Fuel, Gauge, Shield, Info, Boxes } from 'lucide-react';

interface EquipmentItem {
  id: number;
  vin: string;
  dot_number: string;
  last_inspection_date: string | null;
  license_plate_state: string;
  license_plate_number: string;
  equipment_type: string;
  equipment_sub_type: string;
  categories: string;
  company_vehicle_number: string;
  vin_errors: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  classified_at: string | null;
  vin_detail: VinDetail | null;
}

interface VinDetail {
  id?: number;
  vin?: string;
  make?: string | null;
  model?: string | null;
  model_year?: string | null;
  body_class?: string | null;
  body_cab_type?: string | null;
  drive_type?: string | null;
  fuel_type_primary?: string | null;
  vehicle_type?: string | null;
  manufacturer?: string | null;
  plant_country?: string | null;
  plant_state?: string | null;
  plant_city?: string | null;
  plant_company_name?: string | null;
  series?: string | null;
  series2?: string | null;
  trim?: string | null;
  trim2?: string | null;
  doors?: string | null;
  engine_model?: string | null;
  engine_configuration?: string | null;
  displacement_l?: number | string | null;
  displacement_cc?: number | string | null;
  displacement_ci?: number | string | null;
  transmission_style?: string | null;
  transmission_speeds?: string | null;
  valve_train_design?: string | null;
  engine_cylinders?: number | string | null;
  engine_hp?: string | null;
  fuel_injection_type?: string | null;
  turbo?: string | null;
  air_bag_loc_curtain?: string | null;
  air_bag_loc_front?: string | null;
  air_bag_loc_knee?: string | null;
  air_bag_loc_side?: string | null;
  air_bag_loc_seat_cushion?: string | null;
  abs?: string | null;
  tpms?: string | null;
  gvwr?: string | null;
  length?: string | null;
  top_speed_mph?: string | null;
  curb_weight_lb?: string | null;
  battery_type?: string | null;
  battery_kwh?: string | null;
  electrification_level?: string | null;
  ev_drive_unit?: string | null;
  seat_belts_all?: string | null;
  seat_rows?: string | null;
  trailer_body_type?: string | null;
  trailer_type?: string | null;
  error_code?: string | null;
  error_text?: string | null;
}

/**
 * Raw shape returned by the upstream `/company/{dot}/equipment` endpoint.
 * The endpoint has two known variants:
 *  - the "flat" variant: { type, sub_type, vin, license_state, make, ... }
 *  - the "expanded" variant: { equipment_type, equipment_sub_type, vin_detail, ... }
 * Every field can be `null`, so nothing here may be assumed to exist.
 */
type RawEquipmentItem = Record<string, any>;

interface EquipmentApiResponse {
  current_page?: number;
  data?: RawEquipmentItem[];
  last_page?: number;
  total?: number;
  per_page?: number;
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
}

interface EquipmentPanelProps {
  dotNumber: string;
}

const MAX_PAGES = 50;
const UNKNOWN_TYPE = 'UNKNOWN';

const val = (v: any): string => {
  if (v === undefined || v === null) return '–';
  const s = String(v).trim();
  return s ? s : '–';
};

/** Null-safe string coercion — never throws on null/undefined values. */
const str = (v: any): string => (v === undefined || v === null ? '' : String(v).trim());

/** Null-safe uppercase — replaces every direct `.toUpperCase()` on API data. */
const upper = (v: any): string => str(v).toUpperCase();

const isTruckLike = (type: any): boolean => {
  const u = upper(type);
  return u.includes('TRUCK') || u.includes('TRACTOR');
};

const isTrailerLike = (type: any): boolean => upper(type).includes('TRAILER');

const getEquipmentIcon = (type: any) => {
  if (isTruckLike(type)) return <Truck size={16} className="text-[#7C5CFC]" />;
  if (isTrailerLike(type)) return <Package size={16} className="text-amber-500" />;
  return <Boxes size={16} className="text-slate-500" />;
};

const getEquipmentBadgeClass = (type: any) => {
  if (isTruckLike(type)) return 'bg-[#F5F3FF] text-[#7C5CFC] border-[#DDD6FE]';
  if (isTrailerLike(type)) return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

/** Builds a VinDetail from the flat variant fields when no nested `vin_detail` exists. */
const buildVinDetailFromFlat = (raw: RawEquipmentItem): VinDetail | null => {
  const make = str(raw.make);
  const model = str(raw.model);
  const year = str(raw.year ?? raw.model_year);
  const gvwr = str(raw.gvwr);
  const trim = str(raw.trim);
  const length = str(raw.length);

  if (!make && !model && !year && !gvwr && !trim && !length) return null;

  return {
    vin: str(raw.vin),
    make: make || null,
    model: model || null,
    model_year: year || null,
    trim: trim || null,
    gvwr: gvwr || null,
    length: length || null,
  };
};

/** Normalizes any upstream variant into the internal EquipmentItem shape. */
const normalizeEquipmentItem = (raw: RawEquipmentItem, index: number, dotNumber: string): EquipmentItem => {
  const nestedVinDetail =
    raw.vin_detail && typeof raw.vin_detail === 'object' ? (raw.vin_detail as VinDetail) : null;

  return {
    id: typeof raw.id === 'number' ? raw.id : index + 1,
    vin: str(raw.vin),
    dot_number: str(raw.dot_number) || dotNumber,
    last_inspection_date: str(raw.last_inspection_date) || null,
    license_plate_state: str(raw.license_plate_state ?? raw.license_state),
    license_plate_number: str(raw.license_plate_number ?? raw.license_number),
    // `type` is the flat-variant key, `equipment_type` the expanded one.
    equipment_type: str(raw.equipment_type ?? raw.type) || UNKNOWN_TYPE,
    equipment_sub_type: str(raw.equipment_sub_type ?? raw.sub_type),
    categories: Array.isArray(raw.categories) ? raw.categories.filter(Boolean).join(', ') : str(raw.categories),
    company_vehicle_number: str(raw.company_vehicle_number),
    vin_errors: raw.vin_errors === true,
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
    deleted_at: str(raw.deleted_at) || null,
    classified_at: str(raw.classified_at) || null,
    vin_detail: nestedVinDetail ?? buildVinDetailFromFlat(raw),
  };
};

/** Human-readable title for a unit, falling back to its type when no VIN details exist. */
const getEquipmentTitle = (item: EquipmentItem): string => {
  const vd = item.vin_detail;
  const parts = [str(vd?.model_year), str(vd?.make), str(vd?.model)].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return item.equipment_type || UNKNOWN_TYPE;
};

/**
 * Deduplicates equipment by VIN, keeping the most recently updated entry.
 * Records without a VIN (common in the flat variant) are always kept as-is,
 * otherwise every VIN-less unit would collapse into a single row.
 */
const deduplicateEquipment = (items: EquipmentItem[]): EquipmentItem[] => {
  const vinMap = new Map<string, EquipmentItem>();
  const withoutVin: EquipmentItem[] = [];

  for (const item of items) {
    if (!item.vin) {
      withoutVin.push(item);
      continue;
    }
    const existing = vinMap.get(item.vin);
    if (!existing) {
      vinMap.set(item.vin, item);
      continue;
    }
    const existingDate = new Date(existing.updated_at).getTime() || 0;
    const currentDate = new Date(item.updated_at).getTime() || 0;
    if (currentDate > existingDate) {
      vinMap.set(item.vin, item);
    }
  }

  return [...Array.from(vinMap.values()), ...withoutVin];
};

const EquipmentDetailModal: React.FC<{ item: EquipmentItem; onClose: () => void }> = ({ item, onClose }) => {
  const vd = item.vin_detail;
  const equipmentType = item.equipment_type || UNKNOWN_TYPE;

  const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px] break-words">{val(value)}</span>
    </div>
  );

  const hasSpecs = Boolean(
    vd && (vd.make || vd.model || vd.model_year || vd.body_class || vd.vehicle_type || vd.manufacturer || vd.series)
  );
  const hasEngine = Boolean(
    vd &&
      (vd.fuel_type_primary ||
        vd.engine_configuration ||
        vd.engine_cylinders ||
        vd.displacement_l ||
        vd.engine_hp ||
        vd.drive_type ||
        vd.transmission_style ||
        vd.turbo)
  );
  const hasWeight = Boolean(
    vd &&
      (vd.gvwr ||
        vd.length ||
        vd.curb_weight_lb ||
        vd.abs ||
        vd.tpms ||
        vd.seat_belts_all ||
        vd.air_bag_loc_front ||
        vd.air_bag_loc_side)
  );
  const hasManufacturing = Boolean(
    vd && (vd.plant_country || vd.plant_state || vd.plant_city || vd.plant_company_name)
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-[#F8FAFC] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 bg-white flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isTruckLike(equipmentType)
                ? 'bg-gradient-to-br from-[#7C5CFC] to-purple-600 shadow-[#7C5CFC]/20'
                : isTrailerLike(equipmentType)
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
                  : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
            }`}>
              {isTruckLike(equipmentType)
                ? <Truck size={20} className="text-white" />
                : isTrailerLike(equipmentType)
                  ? <Package size={20} className="text-white" />
                  : <Boxes size={20} className="text-white" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  {getEquipmentTitle(item)}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEquipmentBadgeClass(equipmentType)}`}>
                  {equipmentType}
                </span>
              </div>
              <p className="text-slate-500 text-sm font-mono">{item.vin || 'VIN NOT REPORTED'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-75">
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Identification — always available */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Hash size={14} className="text-[#7C5CFC]" /> Vehicle Identification
              </h3>
              <div className="space-y-0">
                <InfoRow label="VIN" value={item.vin} />
                <InfoRow label="Equipment Type" value={equipmentType} />
                <InfoRow label="Sub Type" value={item.equipment_sub_type} />
                <InfoRow label="Categories" value={item.categories} />
                <InfoRow label="Unit Number" value={item.company_vehicle_number} />
                <InfoRow
                  label="License Plate"
                  value={item.license_plate_number ? `${item.license_plate_state} - ${item.license_plate_number}`.replace(/^ - /, '') : ''}
                />
                <InfoRow label="Last Inspection" value={item.last_inspection_date} />
                <InfoRow label="VIN Errors" value={item.vin_errors ? 'YES' : 'NO'} />
              </div>
            </div>

            {/* Vehicle Specs */}
            {hasSpecs && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Wrench size={14} className="text-[#7C5CFC]" /> Vehicle Specifications
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Make" value={vd?.make} />
                  <InfoRow label="Model" value={vd?.model} />
                  <InfoRow label="Year" value={vd?.model_year} />
                  <InfoRow label="Trim" value={vd?.trim} />
                  <InfoRow label="Body Class" value={vd?.body_class} />
                  <InfoRow label="Vehicle Type" value={vd?.vehicle_type} />
                  <InfoRow label="Manufacturer" value={vd?.manufacturer} />
                  <InfoRow label="Series" value={vd?.series} />
                </div>
              </div>
            )}

            {/* Engine & Drivetrain */}
            {hasEngine && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Fuel size={14} className="text-[#7C5CFC]" /> Engine &amp; Drivetrain
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Fuel Type" value={vd?.fuel_type_primary} />
                  <InfoRow label="Engine Config" value={vd?.engine_configuration} />
                  <InfoRow label="Cylinders" value={vd?.engine_cylinders} />
                  <InfoRow label="Displacement" value={vd?.displacement_l ? `${vd.displacement_l}L` : ''} />
                  <InfoRow label="Horsepower" value={vd?.engine_hp} />
                  <InfoRow label="Drive Type" value={vd?.drive_type} />
                  <InfoRow label="Transmission" value={vd?.transmission_style} />
                  <InfoRow label="Turbo" value={vd?.turbo} />
                </div>
              </div>
            )}

            {/* Weight & Safety */}
            {hasWeight && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Gauge size={14} className="text-[#7C5CFC]" /> Weight &amp; Safety
                </h3>
                <div className="space-y-0">
                  <InfoRow label="GVWR" value={vd?.gvwr} />
                  <InfoRow label="Length" value={vd?.length} />
                  <InfoRow label="Curb Weight" value={vd?.curb_weight_lb ? `${vd.curb_weight_lb} lb` : ''} />
                  <InfoRow label="ABS" value={vd?.abs} />
                  <InfoRow label="TPMS" value={vd?.tpms} />
                  <InfoRow label="Seat Belts" value={vd?.seat_belts_all} />
                  <InfoRow label="Front Airbags" value={vd?.air_bag_loc_front} />
                  <InfoRow label="Side Airbags" value={vd?.air_bag_loc_side} />
                </div>
              </div>
            )}

            {/* Manufacturing */}
            {hasManufacturing && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <MapPin size={14} className="text-[#7C5CFC]" /> Manufacturing
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Plant Country" value={vd?.plant_country} />
                  <InfoRow label="Plant State" value={vd?.plant_state} />
                  <InfoRow label="Plant City" value={vd?.plant_city} />
                  <InfoRow label="Plant Company" value={vd?.plant_company_name} />
                </div>
              </div>
            )}

            {/* Trailer Info (only for trailers) */}
            {(vd?.trailer_body_type || vd?.trailer_type) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Package size={14} className="text-amber-500" /> Trailer Details
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Trailer Body Type" value={vd?.trailer_body_type} />
                  <InfoRow label="Trailer Type" value={vd?.trailer_type} />
                </div>
              </div>
            )}

            {/* EV Info (if applicable) */}
            {(vd?.battery_type || vd?.battery_kwh || vd?.electrification_level || vd?.ev_drive_unit) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Shield size={14} className="text-emerald-500" /> Electric Vehicle
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Battery Type" value={vd?.battery_type} />
                  <InfoRow label="Battery kWh" value={vd?.battery_kwh} />
                  <InfoRow label="Electrification" value={vd?.electrification_level} />
                  <InfoRow label="EV Drive Unit" value={vd?.ev_drive_unit} />
                </div>
              </div>
            )}

            {/* Shown when the upstream record only reports an equipment type */}
            {!hasSpecs && !hasEngine && !hasWeight && !hasManufacturing && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-10">
                <Info size={28} className="text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-500 mb-1">No VIN Details Available</p>
                <p className="text-xs text-slate-400">
                  This carrier reported the equipment type only, without VIN or vehicle specifications.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ dotNumber }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;

    const fetchEquipment = async () => {
      setIsLoading(true);
      setError(null);
      setActiveFilter('ALL');

      try {
        const rawItems: RawEquipmentItem[] = [];
        let page = 1;
        let lastPage = 1;

        do {
          const response = await fetch(`/api/equipment?dotNumber=${encodeURIComponent(dotNumber)}&page=${page}&perPage=100`);
          if (!response.ok) throw new Error('Failed to fetch equipment data');

          const payload: EquipmentApiResponse = await response.json();
          const pageItems = Array.isArray(payload?.data) ? payload.data : [];
          rawItems.push(...pageItems);

          // Pagination metadata lives either at the root or under `meta`.
          const reportedLastPage = Number(payload?.last_page ?? payload?.meta?.last_page ?? 1);
          lastPage = Number.isFinite(reportedLastPage) && reportedLastPage > 0 ? Math.min(reportedLastPage, MAX_PAGES) : 1;
          page++;
        } while (page <= lastPage);

        if (cancelled) return;

        const normalized = rawItems
          .filter((raw) => raw && typeof raw === 'object')
          .map((raw, index) => normalizeEquipmentItem(raw, index, dotNumber));
        const deduplicated = deduplicateEquipment(normalized);

        setEquipment(deduplicated);
        setTotalCount(deduplicated.length);
      } catch (err: any) {
        if (!cancelled) {
          setEquipment([]);
          setTotalCount(0);
          setError(err?.message || 'Failed to load equipment');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchEquipment();

    return () => {
      cancelled = true;
    };
  }, [dotNumber]);

  // Unique equipment types for the filter tabs
  const equipmentTypes = ['ALL', ...Array.from(new Set(equipment.map((e) => e.equipment_type || UNKNOWN_TYPE)))];

  const filteredEquipment =
    activeFilter === 'ALL' ? equipment : equipment.filter((e) => (e.equipment_type || UNKNOWN_TYPE) === activeFilter);

  const typeCounts = equipment.reduce((acc, item) => {
    const key = item.equipment_type || UNKNOWN_TYPE;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Truck size={16} className="text-slate-400" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Equipment</h4>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-[#7C5CFC] mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Equipment Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Truck size={16} className="text-slate-400" />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Equipment</h4>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle size={32} className="text-amber-400 mb-3" />
          <p className="text-sm font-bold text-slate-500 mb-1">Unable to Load Equipment</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-slate-400" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Equipment</h4>
          </div>
          <span className="bg-[#F5F3FF] text-[#7C5CFC] border border-[#DDD6FE] px-3 py-1 rounded-full text-xs font-bold">
            {totalCount} Unit{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Summary Stats */}
        {totalCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <div className="flex items-center justify-center mb-1.5">{getEquipmentIcon(type)}</div>
                <span className="text-lg font-extrabold text-slate-900 block">{count}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {equipmentTypes.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {equipmentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  activeFilter === type
                    ? 'bg-[#7C5CFC] text-white border-[#7C5CFC] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {type === 'ALL' ? `All (${totalCount})` : `${type} (${typeCounts[type] || 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Equipment List */}
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Info size={36} className="text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-1">No Equipment Records</p>
            <p className="text-xs text-slate-400">No equipment data found for this carrier.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {filteredEquipment.map((item, index) => (
              <div
                key={`${item.id}-${item.vin || item.equipment_type}-${index}`}
                onClick={() => setSelectedItem(item)}
                className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-[#F5F3FF] border border-slate-200 hover:border-[#DDD6FE] rounded-xl cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isTruckLike(item.equipment_type)
                      ? 'bg-[#F5F3FF] border-[#DDD6FE]'
                      : isTrailerLike(item.equipment_type)
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-100 border-slate-200'
                  }`}>
                    {getEquipmentIcon(item.equipment_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-[#7C5CFC] transition-colors">
                        {getEquipmentTitle(item)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getEquipmentBadgeClass(item.equipment_type)}`}>
                        {item.equipment_type || UNKNOWN_TYPE}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">{item.vin || 'VIN not reported'}</span>
                      {item.license_plate_number && (
                        <span className="text-[10px] text-slate-400">
                          {item.license_plate_state ? `${item.license_plate_state} · ` : ''}
                          {item.license_plate_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                  className="p-2 bg-white hover:bg-[#7C5CFC] text-slate-400 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-slate-200 hover:border-[#7C5CFC] opacity-0 group-hover:opacity-100"
                >
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment Detail Modal */}
      {selectedItem && (
        <EquipmentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};
