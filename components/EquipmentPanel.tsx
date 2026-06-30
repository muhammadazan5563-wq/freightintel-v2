import React, { useState, useEffect } from 'react';
import { Truck, X, Loader2, ChevronDown, ChevronUp, Eye, Package, AlertTriangle, Hash, Calendar, MapPin, Wrench, Fuel, Gauge, Shield, Info, Boxes } from 'lucide-react';

interface EquipmentItem {
  id: number;
  vin: string;
  dot_number: string;
  last_inspection_date: string | null;
  license_plate_state: string;
  license_plate_number: string;
  equipment_type: string;
  equipment_sub_type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  classified_at: string | null;
  vin_detail: VinDetail | null;
}

interface VinDetail {
  id: number;
  vin: string;
  make: string;
  model: string;
  model_year: string;
  body_class: string;
  body_cab_type: string | null;
  drive_type: string;
  fuel_type_primary: string;
  vehicle_type: string;
  manufacturer: string;
  plant_country: string;
  plant_state: string;
  plant_city: string;
  plant_company_name: string;
  series: string | null;
  series2: string | null;
  trim: string | null;
  trim2: string | null;
  doors: string | null;
  engine_model: string | null;
  engine_configuration: string | null;
  displacement_l: number | null;
  displacement_cc: number | null;
  displacement_ci: number | null;
  transmission_style: string | null;
  transmission_speeds: string | null;
  valve_train_design: string | null;
  engine_cylinders: number | null;
  engine_hp: string | null;
  fuel_injection_type: string | null;
  turbo: string | null;
  air_bag_loc_curtain: string | null;
  air_bag_loc_front: string | null;
  air_bag_loc_knee: string | null;
  air_bag_loc_side: string | null;
  air_bag_loc_seat_cushion: string | null;
  abs: string | null;
  tpms: string | null;
  gvwr: string | null;
  top_speed_mph: string | null;
  curb_weight_lb: string | null;
  battery_type: string | null;
  battery_kwh: string | null;
  electrification_level: string | null;
  ev_drive_unit: string | null;
  seat_belts_all: string | null;
  seat_rows: string | null;
  trailer_body_type: string | null;
  trailer_type: string | null;
  error_code: string | null;
  error_text: string | null;
}

interface EquipmentApiResponse {
  current_page: number;
  data: EquipmentItem[];
  last_page: number;
  total: number;
  per_page: number;
}

interface EquipmentPanelProps {
  dotNumber: string;
}

const val = (v: any): string => {
  if (v === undefined || v === null) return '–';
  const s = String(v).trim();
  return s ? s : '–';
};

const getEquipmentIcon = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes('TRUCK') || upper.includes('TRACTOR')) return <Truck size={16} className="text-[#7C5CFC]" />;
  if (upper.includes('TRAILER')) return <Package size={16} className="text-amber-500" />;
  return <Boxes size={16} className="text-slate-500" />;
};

const getEquipmentBadgeClass = (type: string) => {
  const upper = type.toUpperCase();
  if (upper.includes('TRUCK') || upper.includes('TRACTOR')) return 'bg-[#F5F3FF] text-[#7C5CFC] border-[#DDD6FE]';
  if (upper.includes('TRAILER')) return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

// Deduplicate equipment by VIN, keeping the most recently updated entry
const deduplicateEquipment = (items: EquipmentItem[]): EquipmentItem[] => {
  const vinMap = new Map<string, EquipmentItem>();
  for (const item of items) {
    const existing = vinMap.get(item.vin);
    if (!existing) {
      vinMap.set(item.vin, item);
    } else {
      // Keep the one with the most recent updated_at
      const existingDate = new Date(existing.updated_at).getTime();
      const currentDate = new Date(item.updated_at).getTime();
      if (currentDate > existingDate) {
        vinMap.set(item.vin, item);
      }
    }
  }
  return Array.from(vinMap.values());
};

const EquipmentDetailModal: React.FC<{ item: EquipmentItem; onClose: () => void }> = ({ item, onClose }) => {
  const vd = item.vin_detail;

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px]">{val(value)}</span>
    </div>
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
              item.equipment_type.toUpperCase().includes('TRUCK') || item.equipment_type.toUpperCase().includes('TRACTOR')
                ? 'bg-gradient-to-br from-[#7C5CFC] to-purple-600 shadow-[#7C5CFC]/20'
                : item.equipment_type.toUpperCase().includes('TRAILER')
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
                  : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
            }`}>
              {item.equipment_type.toUpperCase().includes('TRUCK') || item.equipment_type.toUpperCase().includes('TRACTOR')
                ? <Truck size={20} className="text-white" />
                : item.equipment_type.toUpperCase().includes('TRAILER')
                  ? <Package size={20} className="text-white" />
                  : <Boxes size={20} className="text-white" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                  {vd ? `${vd.model_year} ${vd.make} ${vd.model}` : item.equipment_type}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEquipmentBadgeClass(item.equipment_type)}`}>
                  {item.equipment_type}
                </span>
              </div>
              <p className="text-slate-500 text-sm font-mono">{item.vin}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-75">
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Identification */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Hash size={14} className="text-[#7C5CFC]" /> Vehicle Identification
              </h3>
              <div className="space-y-0">
                <InfoRow label="VIN" value={item.vin} />
                <InfoRow label="Equipment Type" value={item.equipment_type} />
                <InfoRow label="Sub Type" value={item.equipment_sub_type} />
                <InfoRow label="License Plate" value={item.license_plate_number ? `${item.license_plate_state} - ${item.license_plate_number}` : ''} />
                <InfoRow label="Last Inspection" value={item.last_inspection_date || ''} />
              </div>
            </div>

            {/* Vehicle Specs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Wrench size={14} className="text-[#7C5CFC]" /> Vehicle Specifications
              </h3>
              <div className="space-y-0">
                <InfoRow label="Make" value={vd?.make || ''} />
                <InfoRow label="Model" value={vd?.model || ''} />
                <InfoRow label="Year" value={vd?.model_year || ''} />
                <InfoRow label="Body Class" value={vd?.body_class || ''} />
                <InfoRow label="Vehicle Type" value={vd?.vehicle_type || ''} />
                <InfoRow label="Manufacturer" value={vd?.manufacturer || ''} />
                <InfoRow label="Series" value={vd?.series || ''} />
              </div>
            </div>

            {/* Engine & Drivetrain */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Fuel size={14} className="text-[#7C5CFC]" /> Engine & Drivetrain
              </h3>
              <div className="space-y-0">
                <InfoRow label="Fuel Type" value={vd?.fuel_type_primary || ''} />
                <InfoRow label="Engine Config" value={vd?.engine_configuration || ''} />
                <InfoRow label="Cylinders" value={vd?.engine_cylinders ? String(vd.engine_cylinders) : ''} />
                <InfoRow label="Displacement" value={vd?.displacement_l ? `${vd.displacement_l}L` : ''} />
                <InfoRow label="Horsepower" value={vd?.engine_hp || ''} />
                <InfoRow label="Drive Type" value={vd?.drive_type || ''} />
                <InfoRow label="Transmission" value={vd?.transmission_style || ''} />
                <InfoRow label="Turbo" value={vd?.turbo || ''} />
              </div>
            </div>

            {/* Weight & Dimensions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Gauge size={14} className="text-[#7C5CFC]" /> Weight & Safety
              </h3>
              <div className="space-y-0">
                <InfoRow label="GVWR" value={vd?.gvwr || ''} />
                <InfoRow label="Curb Weight" value={vd?.curb_weight_lb ? `${vd.curb_weight_lb} lb` : ''} />
                <InfoRow label="ABS" value={vd?.abs || ''} />
                <InfoRow label="TPMS" value={vd?.tpms || ''} />
                <InfoRow label="Seat Belts" value={vd?.seat_belts_all || ''} />
                <InfoRow label="Front Airbags" value={vd?.air_bag_loc_front || ''} />
                <InfoRow label="Side Airbags" value={vd?.air_bag_loc_side || ''} />
              </div>
            </div>

            {/* Manufacturing */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                <MapPin size={14} className="text-[#7C5CFC]" /> Manufacturing
              </h3>
              <div className="space-y-0">
                <InfoRow label="Plant Country" value={vd?.plant_country || ''} />
                <InfoRow label="Plant State" value={vd?.plant_state || ''} />
                <InfoRow label="Plant City" value={vd?.plant_city || ''} />
                <InfoRow label="Plant Company" value={vd?.plant_company_name || ''} />
              </div>
            </div>

            {/* Trailer Info (only for trailers) */}
            {(vd?.trailer_body_type || vd?.trailer_type) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Package size={14} className="text-amber-500" /> Trailer Details
                </h3>
                <div className="space-y-0">
                  <InfoRow label="Trailer Body Type" value={vd?.trailer_body_type || ''} />
                  <InfoRow label="Trailer Type" value={vd?.trailer_type || ''} />
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
                  <InfoRow label="Battery Type" value={vd?.battery_type || ''} />
                  <InfoRow label="Battery kWh" value={vd?.battery_kwh || ''} />
                  <InfoRow label="Electrification" value={vd?.electrification_level || ''} />
                  <InfoRow label="EV Drive Unit" value={vd?.ev_drive_unit || ''} />
                </div>
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
    fetchEquipment();
  }, [dotNumber]);

  const fetchEquipment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all pages
      let allItems: EquipmentItem[] = [];
      let page = 1;
      let lastPage = 1;

      do {
        const response = await fetch(
          `/api/equipment?dotNumber=${dotNumber}&page=${page}&perPage=100`
        );
        if (!response.ok) throw new Error('Failed to fetch equipment data');
        const data: EquipmentApiResponse = await response.json();
        allItems = [...allItems, ...data.data];
        lastPage = data.last_page;
        page++;
      } while (page <= lastPage);

      // Deduplicate by VIN
      const deduplicated = deduplicateEquipment(allItems);
      setEquipment(deduplicated);
      setTotalCount(deduplicated.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique equipment types for filter tabs
  const equipmentTypes = ['ALL', ...Array.from(new Set(equipment.map(e => e.equipment_type)))];

  // Filter equipment based on active filter
  const filteredEquipment = activeFilter === 'ALL'
    ? equipment
    : equipment.filter(e => e.equipment_type === activeFilter);

  // Group counts
  const typeCounts = equipment.reduce((acc, item) => {
    acc[item.equipment_type] = (acc[item.equipment_type] || 0) + 1;
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
                <div className="flex items-center justify-center mb-1.5">
                  {getEquipmentIcon(type)}
                </div>
                <span className="text-lg font-extrabold text-slate-900 block">{count}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {equipmentTypes.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {equipmentTypes.map(type => (
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
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-[#F5F3FF] border border-slate-200 hover:border-[#DDD6FE] rounded-xl cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    item.equipment_type.toUpperCase().includes('TRUCK') || item.equipment_type.toUpperCase().includes('TRACTOR')
                      ? 'bg-[#F5F3FF] border-[#DDD6FE]'
                      : item.equipment_type.toUpperCase().includes('TRAILER')
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-100 border-slate-200'
                  }`}>
                    {getEquipmentIcon(item.equipment_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-[#7C5CFC] transition-colors">
                        {item.vin_detail
                          ? `${item.vin_detail.model_year} ${item.vin_detail.make} ${item.vin_detail.model}`
                          : item.equipment_type
                        }
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getEquipmentBadgeClass(item.equipment_type)}`}>
                        {item.equipment_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">{item.vin}</span>
                      {item.license_plate_number && (
                        <span className="text-[10px] text-slate-400">
                          {item.license_plate_state} · {item.license_plate_number}
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
