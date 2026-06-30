import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X, MapPin, Phone, Mail, Hash, Truck, Calendar, ShieldCheck, Download, ShieldAlert, Activity, Info, Globe, Map as MapIcon, Boxes, Shield, ExternalLink, CheckCircle2, AlertTriangle, Zap, Loader2, ChevronDown, ChevronUp, Copy, Check, Database } from 'lucide-react';
import { CarrierData, InsuranceHistoryFiling } from '../types';
import { downloadCSV } from '../services/mockService';
import { fetchCarriersFromSupabase, getCarrierCountFromSupabase, CarrierFiltersSupabase } from '../services/supabaseClient';
import { fetchSafetyByDot, fetchInspectionsByDot, fetchCrashesByDot } from '../services/backendApiService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface MidTermCancellationProps {
  onNavigateToInsurance: () => void;
}
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];
const OPERATION_CLASSIFICATIONS = [
  'Auth. For Hire','Exempt For Hire','Private(Property)',
  'Private(Passenger)','Migrant','U.S. Mail','Federal Government',
  'State Government','Local Government','Indian Tribe'
];
const CARRIER_OPERATIONS = [
  'Interstate','Intrastate Only (HM)','Intrastate Only (Non-HM)'
];
const CARGO_TYPES = [
  'General Freight','Household Goods','Metal: Sheets, Coils, Rolls',
  'Motor Vehicles','Drive/Tow Away','Logs, Poles, Beams, Lumber',
  'Building Materials','Mobile Homes','Machinery, Large Objects',
  'Fresh Produce','Liquids/Gases','Intermodal Cont.',
  'Passengers','Oilfield Equipment','Livestock',
  'Grain, Feed, Hay','Coal/Coke','Meat',
  'Garbage/Refuse','US Mail','Chemicals',
  'Commodities Dry Bulk','Refrigerated Food','Beverages',
  'Paper Products','Utilities','Agricultural/Farm Supplies',
  'Construction','Water Well','Other'
];
const INSURANCE_REQUIRED_TYPES = ['BI&PD','CARGO','BOND','TRUST FUND'];

const INSURANCE_COMPANIES = [
  'GREAT WEST CASUALTY',
  'UNITED FINANCIAL CASUALTY',
  'GEICO MARINE',
  'NORTHLAND INSURANCE',
  'ARTISAN & TRUCKERS',
  'CANAL INSURANCE',
  'PROGRESSIVE',
  'BERKSHIRE HATHAWAY',
  'OLD REPUBLIC',
  'SENTRY',
  'TRAVELERS',
];

const RENEWAL_MONTH_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: '1st Month' },
  { value: '2', label: '2nd Month' },
  { value: '3', label: '3rd Month' },
  { value: '4', label: '4th Month' },
  { value: '5', label: '5th Month' },
];
const formatDateToMMDDYY = (dateStr: string | undefined): string => {
  if (!dateStr || dateStr === 'N/A' || dateStr === '--') return dateStr || '--';
  try {
    let month: number, day: number, year: number;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else return dateStr;
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else return dateStr;
    } else return dateStr;
    if (isNaN(month) || isNaN(day) || isNaN(year)) return dateStr;
    const yy = String(year).slice(-2);
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${yy}`;
  } catch { return dateStr; }
};

const calculateRenewalDate = (effectiveDate: string | undefined): string | null => {
  if (!effectiveDate || effectiveDate === 'N/A' || effectiveDate === '--') return null;
  try {
    let month: number, day: number, year: number;
    if (effectiveDate.includes('/')) {
      const parts = effectiveDate.split('/');
      if (parts.length === 3) {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
      } else return null;
    } else if (effectiveDate.includes('-')) {
      const parts = effectiveDate.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else return null;
    } else return null;

    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    let renewalYear = year + 1;
    const now = new Date();
    while (new Date(renewalYear, month - 1, day) <= now) {
      renewalYear += 1;
    }
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yy = String(renewalYear).slice(-2);
    return `${mm}/${dd}/${yy}`;
  } catch { return null; }
};
const calculateYearsInBusiness = (mcs150Date: string | undefined): number | null => {
  if (!mcs150Date || mcs150Date === 'N/A') return null;
  try {
    const date = new Date(mcs150Date);
    if (isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch (e) {
    return null;
  }
};
const MultiSelect: React.FC<{
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}> = ({ options, selected, onChange, placeholder = 'All' }) => {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC] flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-slate-400' : 'text-slate-900 truncate'}>
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        {open ? <ChevronUp size={14} className="shrink-0 ml-1 text-slate-400" /> : <ChevronDown size={14} className="shrink-0 ml-1 text-slate-400" />}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F5F3FF] cursor-pointer text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-[#7C5CFC]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
const FilterGroup: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-black text-[#7C5CFC] uppercase tracking-widest">
          {icon} {title}
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};
const FilterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">{children}</label>
);
const FilterSelect: React.FC<{ name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }> = ({ name, value, onChange, options }) => (
  <select name={name} value={value} onChange={onChange} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]">
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const MinMaxInputs: React.FC<{
  nameMin: string; nameMax: string;
  valueMin: string; valueMax: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ nameMin, nameMax, valueMin, valueMax, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    <input type="number" name={nameMin} value={valueMin} onChange={onChange} placeholder="Min" min={0}
      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]" />
    <input type="number" name={nameMax} value={valueMax} onChange={onChange} placeholder="Max" min={0}
      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]" />
  </div>
);
export const MidTermCancellation: React.FC<MidTermCancellationProps> = ({ onNavigateToInsurance }) => {
  
  const [carriers, setCarriers] = useState<CarrierData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const PAGE_SIZE_OPTIONS = [100, 200, 500, 1000];
  const [pageSize, setPageSize] = useState(500);
  const [currentPage, setCurrentPage] = useState(0);
  const [mcSearchTerm, setMcSearchTerm] = useState('');
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inspections' | 'crashes'>('inspections');
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [expandedCrash, setExpandedCrash] = useState<string | null>(null);
  const [activeInsurance, setActiveInsurance] = useState<InsuranceHistoryFiling[]>([]);
  const [safetyData, setSafetyData] = useState<any | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [inspPage, setInspPage] = useState(0);
  const [inspTotal, setInspTotal] = useState(0);
  const [inspData, setInspData] = useState<any[]>([]);
  const [inspLoading, setInspLoading] = useState(false);
  const [crashPage, setCrashPage] = useState(0);
  const [crashTotal, setCrashTotal] = useState(0);
  const [crashData, setCrashData] = useState<any[]>([]);
  const [crashLoading, setCrashLoading] = useState(false);
  const DETAIL_PAGE_SIZE = 10;
  const [filters, setFilters] = useState({
    entityType: '',
    active: '',
    state: [] as string[],
    dot: '',
    yearsInBusinessMin: '',
    yearsInBusinessMax: '',
    hasEmail: '',
    hasBoc3: '',
    hasCompanyRep: '',
    classification: [] as string[],
    carrierOperation: [] as string[],
    hazmat: '',
    powerUnitsMin: '',
    powerUnitsMax: '',
    driversMin: '',
    driversMax: '',
    cargo: [] as string[],
    insuranceRequired: [] as string[],
    insuranceCompany: [] as string[],
    insEffectiveDateFrom: '',
    insEffectiveDateTo: '',
    renewalPolicyMonths: '',
    renewalDateFrom: '',
    renewalDateTo: '',
    bipdMin: '',
    bipdMax: '',
    bipdOnFile: '',
    cargoOnFile: '',
    bondOnFile: '',
    trustFundOnFile: '',
    insCancellationDateFrom: '',
    insCancellationDateTo: '',
    oosMin: '', oosMax: '',
    crashesMin: '', crashesMax: '',
    injuriesMin: '', injuriesMax: '',
    fatalitiesMin: '', fatalitiesMax: '',
    towawayMin: '', towawayMax: '',
    inspectionsMin: '', inspectionsMax: '',
  });
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    getCarrierCountFromSupabase().then(setTotalCount);
    loadCarriers({});
  }, []);
  const loadInspections = useCallback(async (dot: string, page: number) => {
    setInspLoading(true);
    try {
      const res = await fetchInspectionsByDot(dot, DETAIL_PAGE_SIZE, page * DETAIL_PAGE_SIZE);
      setInspData(res.inspections);
      setInspTotal(res.total);
      setInspPage(page);
    } catch { /* ignore */ }
    setInspLoading(false);
  }, []);

  const loadCrashes = useCallback(async (dot: string, page: number) => {
    setCrashLoading(true);
    try {
      const res = await fetchCrashesByDot(dot, DETAIL_PAGE_SIZE, page * DETAIL_PAGE_SIZE);
      setCrashData(res.crashes);
      setCrashTotal(res.total);
      setCrashPage(page);
    } catch { /* ignore */ }
    setCrashLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDot) {
      const carrier = carriers.find(c => c.dotNumber === selectedDot);
      setActiveInsurance(carrier?.insuranceHistoryFilings || []);
      setSafetyData(null);
      setSafetyLoading(true);
      fetchSafetyByDot(selectedDot).then((data) => {
        setSafetyData(data);
        setSafetyLoading(false);
      }).catch(() => setSafetyLoading(false));
      setInspPage(0);
      setCrashPage(0);
      loadInspections(selectedDot, 0);
      loadCrashes(selectedDot, 0);
    } else {
      setActiveInsurance([]);
      setSafetyData(null);
      setInspData([]);
      setCrashData([]);
      setInspTotal(0);
      setCrashTotal(0);
    }
  }, [selectedDot, carriers]);
  const loadCarriers = async (f: CarrierFiltersSupabase, page = 0, ps?: number) => {
    setIsLoading(true);
    const size = ps ?? pageSize;
    try {
      const result = await fetchCarriersFromSupabase({ ...f, limit: size, offset: page * size });
      setCarriers(result.data);
      setCurrentPage(page);
      setFilteredCount(result.filtered_count);
    } finally {
      setIsLoading(false);
    }
  };
  const buildFilters = useCallback((): CarrierFiltersSupabase => {
    const f: CarrierFiltersSupabase = {};
    if (mcSearchTerm.trim()) f.mcNumber = mcSearchTerm.trim();
    if (nameSearchTerm.trim()) f.legalName = nameSearchTerm.trim();
    if (filters.dot.trim()) f.dotNumber = filters.dot.trim();
    if (filters.entityType) f.entityType = filters.entityType;
    if (filters.active) f.active = filters.active;
    if (filters.state.length > 0) f.state = filters.state.join('|'); 
    if (filters.hasEmail) f.hasEmail = filters.hasEmail;
    if (filters.hasBoc3) f.hasBoc3 = filters.hasBoc3;
    if (filters.hasCompanyRep) f.hasCompanyRep = filters.hasCompanyRep;
    if (filters.yearsInBusinessMin !== '') f.yearsInBusinessMin = parseInt(filters.yearsInBusinessMin);
    if (filters.yearsInBusinessMax !== '') f.yearsInBusinessMax = parseInt(filters.yearsInBusinessMax);
    if (filters.powerUnitsMin !== '') f.powerUnitsMin = parseInt(filters.powerUnitsMin);
    if (filters.powerUnitsMax !== '') f.powerUnitsMax = parseInt(filters.powerUnitsMax);
    if (filters.driversMin !== '') f.driversMin = parseInt(filters.driversMin);
    if (filters.driversMax !== '') f.driversMax = parseInt(filters.driversMax);
    if (filters.insEffectiveDateFrom) f.insEffectiveDateFrom = filters.insEffectiveDateFrom;
    if (filters.insEffectiveDateTo) f.insEffectiveDateTo = filters.insEffectiveDateTo;
    if (filters.bipdMin !== '') f.bipdMin = parseInt(filters.bipdMin);
    if (filters.bipdMax !== '') f.bipdMax = parseInt(filters.bipdMax);
    if (filters.oosMin !== '') f.oosMin = parseInt(filters.oosMin);
    if (filters.oosMax !== '') f.oosMax = parseInt(filters.oosMax);
    if (filters.crashesMin !== '') f.crashesMin = parseInt(filters.crashesMin);
    if (filters.crashesMax !== '') f.crashesMax = parseInt(filters.crashesMax);
    if (filters.injuriesMin !== '') f.injuriesMin = parseInt(filters.injuriesMin);
    if (filters.injuriesMax !== '') f.injuriesMax = parseInt(filters.injuriesMax);
    if (filters.fatalitiesMin !== '') f.fatalitiesMin = parseInt(filters.fatalitiesMin);
    if (filters.fatalitiesMax !== '') f.fatalitiesMax = parseInt(filters.fatalitiesMax);
    if (filters.towawayMin !== '') f.towawayMin = parseInt(filters.towawayMin);
    if (filters.towawayMax !== '') f.towawayMax = parseInt(filters.towawayMax);
    if (filters.inspectionsMin !== '') f.inspectionsMin = parseInt(filters.inspectionsMin);
    if (filters.inspectionsMax !== '') f.inspectionsMax = parseInt(filters.inspectionsMax);
    if (filters.classification.length > 0) f.classification = filters.classification;
    if (filters.carrierOperation.length > 0) f.carrierOperation = filters.carrierOperation;
    if (filters.hazmat) f.hazmat = filters.hazmat;
    if (filters.cargo.length > 0) f.cargo = filters.cargo;
    if (filters.insuranceCompany.length > 0) f.insuranceCompany = filters.insuranceCompany;
    if (filters.renewalPolicyMonths) f.renewalPolicyMonths = filters.renewalPolicyMonths;
    if (filters.renewalDateFrom) f.renewalDateFrom = filters.renewalDateFrom;
    if (filters.renewalDateTo) f.renewalDateTo = filters.renewalDateTo;
    if (filters.insuranceRequired.length > 0) f.insuranceRequired = filters.insuranceRequired;
    if (filters.bipdOnFile) f.bipdOnFile = filters.bipdOnFile;
    if (filters.cargoOnFile) f.cargoOnFile = filters.cargoOnFile;
    if (filters.bondOnFile) f.bondOnFile = filters.bondOnFile;
    if (filters.trustFundOnFile) f.trustFundOnFile = filters.trustFundOnFile;
    if (filters.insCancellationDateFrom) f.insCancellationDateFrom = filters.insCancellationDateFrom;
    if (filters.insCancellationDateTo) f.insCancellationDateTo = filters.insCancellationDateTo;
    return f;
  }, [mcSearchTerm, nameSearchTerm, filters]);
  const applyFilters = () => loadCarriers(buildFilters(), 0);
  const goToPage = (page: number) => loadCarriers(buildFilters(), page);
  const resetAll = () => {
    setMcSearchTerm('');
    setNameSearchTerm('');
    setFilters({
      entityType: '', active: '', state: [], dot: '', yearsInBusinessMin: '', yearsInBusinessMax: '',
      hasEmail: '', hasBoc3: '', hasCompanyRep: '',
      classification: [], carrierOperation: [], hazmat: '',
      powerUnitsMin: '', powerUnitsMax: '', driversMin: '', driversMax: '', cargo: [],
      insuranceCompany: [], insuranceRequired: [], insEffectiveDateFrom: '', insEffectiveDateTo: '', renewalPolicyMonths: '', renewalDateFrom: '', renewalDateTo: '', insCancellationDateFrom: '', insCancellationDateTo: '', bipdMin: '', bipdMax: '', bipdOnFile: '', cargoOnFile: '', bondOnFile: '', trustFundOnFile: '',
      oosMin: '', oosMax: '', crashesMin: '', crashesMax: '',
      injuriesMin: '', injuriesMax: '', fatalitiesMin: '', fatalitiesMax: '',
      towawayMin: '', towawayMax: '', inspectionsMin: '', inspectionsMax: '',
    });
    loadCarriers({}, 0);
  };
  const selectedCarrier = selectedDot ? carriers.find(c => c.dotNumber === selectedDot) : null;
  const yesNoOptions = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];
  const yesNoNumOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
  ];
  return (
    <div className="p-4 md:p-8 h-screen flex flex-col overflow-hidden relative selection:bg-[#7C5CFC]/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Mid Term Cancellation</h1>
          <p className="text-slate-500 text-sm">
            Showing <span className="text-[#7C5CFC] font-bold">{carriers.length}</span> records
            {filteredCount > 0 && <span className="text-slate-900 font-bold"> of {filteredCount.toLocaleString()} total</span>}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateToInsurance}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#7C5CFC] hover:bg-[#F5F3FF]0 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#7C5CFC]/20 active:scale-95"
          >
            <ShieldAlert size={16} /> Batch Enrichment Pipeline
          </button>
          <button
            onClick={() => downloadCSV(carriers)}
            disabled={carriers.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-sm font-bold transition-all border border-slate-200 active:scale-95"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar Row */}
      <div className="flex gap-3 mb-4">
        <div className="relative group w-52 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#7C5CFC] transition-colors">
            <Hash size={16} />
          </div>
          <input
            type="text"
            placeholder="Search MC#..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-3 py-3 text-slate-900 text-sm focus:border-[#7C5CFC] focus:ring-4 focus:ring-[#7C5CFC]/10 outline-none transition-all shadow-sm"
            value={mcSearchTerm}
            onChange={(e) => setMcSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#7C5CFC] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by Business Name..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-sm focus:border-[#7C5CFC] focus:ring-4 focus:ring-[#7C5CFC]/10 outline-none transition-all shadow-sm"
            value={nameSearchTerm}
            onChange={(e) => setNameSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 border text-sm ${showFilters ? 'bg-[#7C5CFC] text-white border-[#7C5CFC]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          <Zap size={16} className={showFilters ? 'fill-white' : ''} />
          {showFilters ? 'Hide Filters' : 'Advanced Filters'}
        </button>
        <button
          onClick={applyFilters}
          disabled={isLoading}
          className="px-7 py-3 bg-[#7C5CFC] hover:bg-[#F5F3FF]0 disabled:opacity-60 text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#7C5CFC]/20 active:scale-95 flex items-center gap-2 text-sm"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Searching...</>
          ) : (
            <><Search size={16} /> Search</>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white border border-slate-200 rounded-3xl overflow-y-auto max-h-[55vh] custom-scrollbar shadow-sm">
          {/* Upper row: Insurance Policy & Safety (open by default) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FilterGroup title="Insurance Policy" icon={<Shield size={12} />}>
              <div>
                <FilterLabel>Insurance Cancellation Date</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="insCancellationDateFrom" value={filters.insCancellationDateFrom} onChange={handleFilterChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]" />
                  <input type="date" name="insCancellationDateTo" value={filters.insCancellationDateTo} onChange={handleFilterChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]" />
                </div>
              </div>
              <div>
                <FilterLabel>Required</FilterLabel>
                <MultiSelect options={INSURANCE_REQUIRED_TYPES} selected={filters.insuranceRequired} onChange={v => setFilters(p => ({ ...p, insuranceRequired: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Insurance Company</FilterLabel>
                <MultiSelect options={INSURANCE_COMPANIES} selected={filters.insuranceCompany} onChange={v => setFilters(p => ({ ...p, insuranceCompany: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Required Amount</FilterLabel>
                <MinMaxInputs nameMin="bipdMin" nameMax="bipdMax"
                  valueMin={filters.bipdMin} valueMax={filters.bipdMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Has BIPD Insurance</FilterLabel>
                <FilterSelect name="bipdOnFile" value={filters.bipdOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Cargo Insurance</FilterLabel>
                <FilterSelect name="cargoOnFile" value={filters.cargoOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Bond Insurance</FilterLabel>
                <FilterSelect name="bondOnFile" value={filters.bondOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Trust Fund Insurance</FilterLabel>
                <FilterSelect name="trustFundOnFile" value={filters.trustFundOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Safety" icon={<ShieldCheck size={12} />}>
              <div>
                <FilterLabel>OOS Violations</FilterLabel>
                <MinMaxInputs nameMin="oosMin" nameMax="oosMax" valueMin={filters.oosMin} valueMax={filters.oosMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Crashes</FilterLabel>
                <MinMaxInputs nameMin="crashesMin" nameMax="crashesMax" valueMin={filters.crashesMin} valueMax={filters.crashesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Injuries</FilterLabel>
                <MinMaxInputs nameMin="injuriesMin" nameMax="injuriesMax" valueMin={filters.injuriesMin} valueMax={filters.injuriesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Fatalities</FilterLabel>
                <MinMaxInputs nameMin="fatalitiesMin" nameMax="fatalitiesMax" valueMin={filters.fatalitiesMin} valueMax={filters.fatalitiesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Towaway</FilterLabel>
                <MinMaxInputs nameMin="towawayMin" nameMax="towawayMax" valueMin={filters.towawayMin} valueMax={filters.towawayMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Inspections</FilterLabel>
                <MinMaxInputs nameMin="inspectionsMin" nameMax="inspectionsMax" valueMin={filters.inspectionsMin} valueMax={filters.inspectionsMax} onChange={handleFilterChange} />
              </div>
            </FilterGroup>
          </div>
          {/* Lower row: Motor Carrier & Carrier Operations (collapsed by default) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterGroup title="Motor Carrier" icon={<Truck size={12} />} defaultOpen={false}>
              <div>
                <FilterLabel>Entity Type</FilterLabel>
                <FilterSelect name="entityType" value={filters.entityType} onChange={handleFilterChange} options={[
                  { value: '', label: 'All' },
                  { value: 'CARRIER', label: 'Carrier' },
                  { value: 'BROKER', label: 'Broker' },
                ]} />
              </div>
              <div>
                <FilterLabel>Active</FilterLabel>
                <FilterSelect name="active" value={filters.active} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>State</FilterLabel>
                <MultiSelect options={US_STATES} selected={filters.state} onChange={v => setFilters(p => ({ ...p, state: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>DOT Number</FilterLabel>
                <input type="number" name="dot" value={filters.dot} onChange={handleFilterChange} placeholder="" min={0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#7C5CFC]" />
              </div>
              <div>
                <FilterLabel>Years in Business</FilterLabel>
                <MinMaxInputs nameMin="yearsInBusinessMin" nameMax="yearsInBusinessMax"
                  valueMin={filters.yearsInBusinessMin} valueMax={filters.yearsInBusinessMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Has Email</FilterLabel>
                <FilterSelect name="hasEmail" value={filters.hasEmail} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Has BOC-3</FilterLabel>
                <FilterSelect name="hasBoc3" value={filters.hasBoc3} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Company Rep. Available</FilterLabel>
                <FilterSelect name="hasCompanyRep" value={filters.hasCompanyRep} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Carrier Operation" icon={<Activity size={12} />} defaultOpen={false}>
              <div>
                <FilterLabel>Classification</FilterLabel>
                <MultiSelect options={OPERATION_CLASSIFICATIONS} selected={filters.classification} onChange={v => setFilters(p => ({ ...p, classification: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Carrier Operation</FilterLabel>
                <MultiSelect options={CARRIER_OPERATIONS} selected={filters.carrierOperation} onChange={v => setFilters(p => ({ ...p, carrierOperation: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Hazmat</FilterLabel>
                <FilterSelect name="hazmat" value={filters.hazmat} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Power Units</FilterLabel>
                <MinMaxInputs nameMin="powerUnitsMin" nameMax="powerUnitsMax"
                  valueMin={filters.powerUnitsMin} valueMax={filters.powerUnitsMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Drivers</FilterLabel>
                <MinMaxInputs nameMin="driversMin" nameMax="driversMax"
                  valueMin={filters.driversMin} valueMax={filters.driversMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Cargo</FilterLabel>
                <MultiSelect options={CARGO_TYPES} selected={filters.cargo} onChange={v => setFilters(p => ({ ...p, cargo: v }))} placeholder="All" />
              </div>
            </FilterGroup>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
            <button onClick={resetAll} className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all border border-slate-200">
              Reset All
            </button>
            <button onClick={applyFilters} disabled={isLoading}
              className="px-8 py-2.5 bg-[#7C5CFC] hover:bg-[#F5F3FF]0 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#7C5CFC]/20 flex items-center gap-2">
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm min-h-0">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">MC Number</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Legal Name</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">DOT Number</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Status</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Entity</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-[#7C5CFC] animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading carriers...</p>
                  </td>
                </tr>
              ) : carriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No results found. Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                carriers.map((carrier, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F3FF]/50 transition-colors group cursor-pointer" onClick={() => setSelectedDot(carrier.dotNumber)}>
                    <td className="p-4 font-mono text-[#7C5CFC] font-bold">{carrier.mcNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#6B4FE0] transition-colors truncate max-w-[250px]">{carrier.legalName}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{carrier.dotNumber}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight border ${carrier.authorityStatus === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {carrier.authorityStatus === 'AUTHORIZED' ? 'AUTHORIZED' : carrier.authorityStatus || 'NOT AUTH'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight border ${carrier.entityType?.toUpperCase().includes('BROKER') ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {carrier.entityType?.toUpperCase().includes('BROKER') ? 'BROKER' : 'CARRIER'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDot(carrier.dotNumber); }}
                        className="p-2 bg-slate-50 hover:bg-[#7C5CFC] text-slate-400 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-slate-200 hover:border-[#7C5CFC]"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {!isLoading && carriers.length > 0 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-700 font-bold">
              Page {currentPage + 1}{filteredCount > 0 ? ` of ${Math.ceil(filteredCount / pageSize).toLocaleString()}` : ''} · Showing {(currentPage * pageSize + 1).toLocaleString()}–{(currentPage * pageSize + carriers.length).toLocaleString()}{filteredCount > 0 ? ` of ${filteredCount.toLocaleString()}` : (totalCount > 0 ? ` of ${totalCount.toLocaleString()}` : '')}
            </p>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setPageSize(newSize);
                loadCarriers(buildFilters(), 0, newSize);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 outline-none focus:border-[#7C5CFC]"
            >
              {PAGE_SIZE_OPTIONS.map(s => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(0)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              First
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={carriers.length < pageSize}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ====== CARRIER DETAIL MODAL ====== */}
      {selectedCarrier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#F8FAFC] w-full max-w-7xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in slide-in-from-bottom-4 duration-300">
            
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-slate-200 bg-white flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight truncate max-w-[300px] md:max-w-[500px] leading-tight">{selectedCarrier.legalName}</h2>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${selectedCarrier.authorityStatus === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {selectedCarrier.authorityStatus === 'AUTHORIZED' ? 'Authorized' : selectedCarrier.authorityStatus || 'Not Authorized'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F5F3FF] text-[#7C5CFC] border border-[#DDD6FE]">
                    DOT Active
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${selectedCarrier.entityType?.toUpperCase().includes('BROKER') ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-[#F5F3FF] text-[#7C5CFC] border-[#DDD6FE]'}`}>
                    {selectedCarrier.entityType?.toUpperCase().includes('BROKER') ? 'Broker' : 'Carrier'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCopy(selectedCarrier.dotNumber, 'dot')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <span className="font-bold text-[11px] tracking-wide">
                      DOT {selectedCarrier.dotNumber}
                    </span>
                    {copiedField === 'dot' ? <Check size={12} /> : <Copy size={12} className="opacity-70" />}
                  </button>
                  <button 
                    onClick={() => {
                      const mcNum = (selectedCarrier.mcNumber || '').replace(/^MC-?/i, '');
                      handleCopy(mcNum, 'mc');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <span className="font-bold text-[11px] tracking-wide">
                      MC {(selectedCarrier.mcNumber || '').replace(/^MC-?/i, '')}
                    </span>
                    {copiedField === 'mc' ? <Check size={12} /> : <Copy size={12} className="opacity-70" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedDot(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-75">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              
              {/* Row 1 - Three Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* Identification Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                    <Hash size={14} className="text-slate-400" /> Identification
                  </h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    <div className="flex justify-between items-center py-3 first:pt-0">
                      <span className="text-xs text-slate-500">MC/MX Number</span>
                      <span className="text-sm font-semibold text-slate-900 font-mono">{selectedCarrier.mcNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-xs text-slate-500">USDOT Number</span>
                      <span className="text-sm font-semibold text-slate-900 font-mono">{selectedCarrier.dotNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 last:pb-0">
                      <span className="text-xs text-slate-500">DUNS Number</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedCarrier.dunsNumber || '--'}</span>
                    </div>
                    {selectedCarrier.companyOfficer1 && (
                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs text-slate-500">Company Officer</span>
                        <span className="text-sm font-semibold text-slate-900">{selectedCarrier.companyOfficer1}</span>
                      </div>
                    )}
                    {selectedCarrier.companyOfficer2 && (
                      <div className="flex justify-between items-center py-3 last:pb-0">
                        <span className="text-xs text-slate-500">Company Officer 2</span>
                        <span className="text-sm font-semibold text-slate-900">{selectedCarrier.companyOfficer2}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                    <Phone size={14} className="text-slate-400" /> Contact Info
                  </h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    <div className="flex justify-between items-center py-3 first:pt-0">
                      <span className="text-xs text-slate-500">Phone</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedCarrier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-xs text-slate-500">Email</span>
                      <span className="text-sm font-semibold text-[#7C5CFC] truncate max-w-[160px]">{selectedCarrier.email || 'None'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 last:pb-0">
                      <span className="text-xs text-slate-500">Location</span>
                      <span className="text-xs font-medium text-slate-900 text-right max-w-[180px] leading-tight">{selectedCarrier.physicalAddress || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                    <Calendar size={14} className="text-slate-400" /> Compliance
                  </h3>
                  <div className="space-y-0 divide-y divide-slate-100">
                    <div className="flex justify-between items-center py-3 first:pt-0">
                      <span className="text-xs text-slate-500">MCS-150 Date</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-900 block">{selectedCarrier.mcs150Date || 'N/A'}</span>
                        {calculateYearsInBusiness(selectedCarrier.mcs150Date) !== null && (
                          <span className="text-[10px] font-medium text-emerald-600">
                            {calculateYearsInBusiness(selectedCarrier.mcs150Date)} yrs in business
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-xs text-slate-500">MCS-150 Mileage</span>
                      <span className="text-sm font-semibold text-slate-900">{selectedCarrier.mcs150Mileage || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 last:pb-0">
                      <span className="text-xs text-slate-500">VMT Year</span>
                      <span className="text-sm font-semibold text-slate-900">--</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 - Operation Info & Fleet Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {/* Operation Information */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <Truck size={16} className="text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Operation Information</h4>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Classifications</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCarrier.operationClassification?.map((cls, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 font-medium text-xs">{cls}</span>
                        )) || <span className="text-sm text-slate-400">N/A</span>}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Operating Territory</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCarrier.carrierOperation?.map((op, idx) => (
                          <span key={idx} className={`px-3 py-1.5 rounded-full font-medium text-xs border ${op.toLowerCase().includes('interstate') && !op.toLowerCase().includes('intrastate') ? 'bg-[#F5F3FF] text-[#7C5CFC] border-[#DDD6FE]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{op}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cargo Carried</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCarrier.cargoCarried?.map((cargo, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 font-medium text-xs">{cargo}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`w-full py-3 rounded-xl flex items-center justify-center font-bold tracking-wide text-xs border ${selectedCarrier.hmInd === 'Y' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {selectedCarrier.hmInd === 'Y' ? 'HAZMAT INDICATOR: YES' : 'HAZMAT INDICATOR: NON-HAZMAT'}
                    </div>
                  </div>
                </div>

                {/* Fleet Statistics */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Boxes size={16} className="text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Fleet Statistics</h4>
                    </div>
                    <span className="bg-[#F5F3FF] text-[#7C5CFC] border border-[#DDD6FE] px-3 py-1 rounded-full text-xs font-bold">
                      Fleet Size: {selectedCarrier.powerUnits || '0'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Truck size={20} className="text-[#7C5CFC] mb-2" />
                      <span className="text-2xl font-extrabold text-slate-900">{selectedCarrier.powerUnits || '0'}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Power Units</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Activity size={20} className="text-[#7C5CFC] mb-2" />
                      <span className="text-2xl font-extrabold text-slate-900">{selectedCarrier.drivers || '0'}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Drivers</span>
                    </div>
                    {selectedCarrier.truckUnits && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <Truck size={20} className="text-slate-400 mb-2" />
                        <span className="text-2xl font-extrabold text-slate-900">{selectedCarrier.truckUnits}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Truck Units</span>
                      </div>
                    )}
                    {selectedCarrier.busUnits && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <Boxes size={20} className="text-slate-400 mb-2" />
                        <span className="text-2xl font-extrabold text-slate-900">{selectedCarrier.busUnits}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Bus Units</span>
                      </div>
                    )}
                    {selectedCarrier.fleetsize && (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center text-center col-span-2">
                        <span className="text-2xl font-extrabold text-slate-900">{selectedCarrier.fleetsize}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fleet Size</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3 - Insurance History */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Insurance History</h4>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7C5CFC] hover:bg-[#7C5CFC] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Download size={14} /> Export PDF
                  </button>
                </div>
                {activeInsurance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type / Provider</th>
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Policy Details</th>
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dates</th>
                          <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coverage Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeInsurance.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="inline-block bg-[#F5F3FF] text-[#7C5CFC] border border-[#DDD6FE] px-2 py-0.5 rounded-md text-[10px] font-bold mb-1">{p.type}</span>
                              <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{p.carrier}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-xs font-mono text-slate-700">#{p.policyNumber}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.canclEffectiveDate ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>{p.status}</span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-xs text-slate-700">Eff: {formatDateToMMDDYY(p.effectiveDate)}</p>
                              {p.canclEffectiveDate ? (
                                <p className="text-xs text-red-500">Cancel: {formatDateToMMDDYY(p.canclEffectiveDate)}</p>
                              ) : calculateRenewalDate(p.effectiveDate) ? (
                                <p className="text-xs text-[#7C5CFC] font-medium">Renewal: {calculateRenewalDate(p.effectiveDate)}</p>
                              ) : null}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-base font-extrabold text-slate-900">{p.coverageAmount}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Info size={36} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500 mb-1">No Insurance Records</p>
                    <p className="text-xs text-slate-400">No insurance records found in the database.</p>
                  </div>
                )}
              </div>

              {/* Row 4 - Safety (ORIGINAL) & Inspections/Crashes (ORIGINAL with API) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Safety Information - ORIGINAL with API data */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Safety Information</h4>
                    </div>
                    <a href={`https://ai.fmcsa.dot.gov/SMS/Carrier/${selectedCarrier.dotNumber}/CompleteProfile.aspx`} target="_blank" className="text-[10px] font-bold text-[#7C5CFC] flex items-center gap-1 hover:text-[#6B4FE0] transition-colors">
                      <ExternalLink size={12} /> View FMCSA Source
                    </a>
                  </div>
                  {safetyLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300 text-center space-y-4">
                      <Loader2 size={32} className="animate-spin text-[#7C5CFC]" />
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Safety Data...</p>
                    </div>
                  ) : safetyData ? (() => {
                    const NATIONAL_AVG: Record<string, number> = { Driver: 6.7, Vehicle: 23.4, Hazmat: 4.4 };
                    const getOosStyle = (rate: number, type: string) => {
                      const avg = NATIONAL_AVG[type] || 10;
                      if (rate <= avg) return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Satisfactory', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
                      if (rate <= avg * 2) return { bar: 'bg-yellow-500', text: 'text-yellow-600', label: 'Average', badge: 'bg-yellow-50 text-yellow-600 border-yellow-200' };
                      return { bar: 'bg-red-500', text: 'text-red-600', label: 'Alert', badge: 'bg-red-50 text-red-600 border-red-200' };
                    };
                    const BASIC_THRESHOLDS: Record<string, { standard: number; highRisk: number }> = {
                      'Unsafe Driving': { standard: 3.5, highRisk: 5.0 },
                      'HOS Compliance': { standard: 2.0, highRisk: 3.0 },
                      'Vehicle Maintenance': { standard: 7.0, highRisk: 12.0 },
                      'Driver Fitness': { standard: 1.5, highRisk: 2.5 },
                      'Controlled Substances': { standard: 1.0, highRisk: 2.0 },
                      'Hazardous Materials': { standard: 2.0, highRisk: 3.0 },
                    };
                    const getBasicColor = (category: string, val: number) => {
                      const t = BASIC_THRESHOLDS[category];
                      if (!t) return { stroke: '#3B82F6', label: '', badgeCls: '' };
                      if (val === 0) return { stroke: '#10b981', label: 'Elite', badgeCls: 'bg-emerald-50 text-emerald-600' };
                      if (val <= t.standard) return { stroke: '#eab308', label: 'Standard', badgeCls: 'bg-yellow-50 text-yellow-600' };
                      return { stroke: '#ef4444', label: 'High Risk', badgeCls: 'bg-red-50 text-red-600' };
                    };
                    const driverRate = safetyData.driver_oos_rate ?? 0;
                    const vehicleRate = safetyData.vehicle_oos_rate ?? 0;
                    const driverStyle = getOosStyle(driverRate, 'Driver');
                    const vehicleStyle = getOosStyle(vehicleRate, 'Vehicle');
                    return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      {/* Safety Rating */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-700">Safety Rating</h5>
                        <div className="flex items-center gap-3">
                          {selectedCarrier.safetyRating && selectedCarrier.safetyRating !== 'N/A' ? (
                            <>
                              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-sm">
                                <CheckCircle2 size={22} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 uppercase">{selectedCarrier.safetyRating}</p>
                                <p className="text-[10px] text-slate-500 font-mono">ENRICHED: {selectedCarrier.safetyRatingDate || 'Not Available'}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                                <ShieldAlert size={22} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-500">No safety rating available</p>
                                <p className="text-[10px] text-slate-400 font-mono">Date: Not Available</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      {/* Out of Service Rates */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-700">OOS Rates</h5>
                          <p className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">Last 24 Months Activity</p>
                        </div>

                        {/* Driver OOS Rate */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="text-slate-500">Driver</span>
                            <div className="flex items-center gap-2">
                              <span className={driverStyle.text}>{driverRate}%</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${driverStyle.badge}`}>{driverStyle.label}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 relative">
                            <div className={`h-full rounded-full ${driverStyle.bar}`} style={{ width: `${Math.min(driverRate, 100)}%` }} />
                            <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-slate-900 rounded" style={{ left: `${Math.min(NATIONAL_AVG.Driver, 100)}%` }} />
                          </div>
                          <p className="text-[8px] text-slate-400 font-mono">Nat. Avg: {NATIONAL_AVG.Driver}%</p>
                        </div>

                        {/* Vehicle OOS Rate */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="text-slate-500">Vehicle</span>
                            <div className="flex items-center gap-2">
                              <span className={vehicleStyle.text}>{vehicleRate}%</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${vehicleStyle.badge}`}>{vehicleStyle.label}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 relative">
                            <div className={`h-full rounded-full ${vehicleStyle.bar}`} style={{ width: `${Math.min(vehicleRate, 100)}%` }} />
                            <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-slate-900 rounded" style={{ left: `${Math.min(NATIONAL_AVG.Vehicle, 100)}%` }} />
                          </div>
                          <p className="text-[8px] text-slate-400 font-mono">Nat. Avg: {NATIONAL_AVG.Vehicle}%</p>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      {/* BASIC Scores - circular gauges */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-widest opacity-80">BASIC Scores</h5>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                          {safetyData.basic_scores?.map((score: any, idx: number) => {
                            const val = parseFloat(score.measure) || 0;
                            const pct = Math.min(val / 100, 1);
                            const r = 34, circ = 2 * Math.PI * r;
                            const basicColor = getBasicColor(score.category, val);
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2">
                                <div className="relative w-[86px] h-[86px]">
                                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="5" />
                                    <circle cx="40" cy="40" r={r} fill="none" stroke={basicColor.stroke} strokeWidth="5" strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-900 font-black text-[15px]">{score.measure}</span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 text-center leading-tight">{score.category}</span>
                                {basicColor.label && (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${basicColor.badgeCls}`}>{basicColor.label}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="p-5 bg-slate-50 rounded-full"><ShieldAlert size={40} className="text-slate-300" /></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Record Not Enriched</p>
                      <button onClick={() => { setSelectedDot(null); onNavigateToInsurance(); }} className="text-[10px] font-bold text-[#7C5CFC] hover:text-[#6B4FE0] uppercase transition-colors bg-[#F5F3FF] px-4 py-2 rounded-lg border border-[#DDD6FE]">Launch Pipeline now</button>
                    </div>
                  )}
                </div>

                {/* Inspections & Crashes - ORIGINAL with API pagination */}
                <div className="bg-white rounded-2xl p-6 flex flex-col shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity size={16} className="text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Inspections & Crashes</h4>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
                    <button 
                      onClick={() => setActiveTab('inspections')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inspections' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Inspections
                    </button>
                    <button 
                      onClick={() => setActiveTab('crashes')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'crashes' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Crashes
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total</span>
                      <span className="text-xl font-extrabold text-slate-900">{activeTab === 'inspections' ? inspTotal : crashTotal}</span>
                    </div>
                    <div className="bg-[#F5F3FF] p-3 rounded-xl border border-[#DDD6FE] text-center">
                      <span className="text-[10px] font-bold text-[#7C5CFC] uppercase block mb-1">Violations</span>
                      <span className="text-xl font-extrabold text-[#7C5CFC]">
                        {inspData.reduce((acc, curr) => acc + (curr.violationList?.length || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">OOS</span>
                      <span className="text-xl font-extrabold text-red-600">
                        {inspData.reduce((acc, curr) => acc + (curr.oosViolations || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Crashes</span>
                      <span className="text-xl font-extrabold text-slate-900">{crashTotal}</span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'inspections' ? (
                      inspLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" size={28} /></div>
                      ) : inspData.map((insp, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden group">
                          <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedInspection(expandedInspection === insp.reportNumber ? null : insp.reportNumber)}
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{insp.date}</p>
                              <p className="text-[11px] text-slate-500">{insp.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {insp.violationList?.length > 0 && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                  {insp.violationList.length} Violations
                                </span>
                              )}
                              {insp.oosViolations > 0 && (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">OOS</span>
                              )}
                              {expandedInspection === insp.reportNumber ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                          </div>
                          
                          {expandedInspection === insp.reportNumber && (
                            <div className="px-4 pb-4 pt-4 border-t border-slate-100 bg-slate-50">
                              <div className="grid grid-cols-3 grid-rows-2 gap-y-4 gap-x-6 mb-6">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Report #:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.reportNumber}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Location:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.location}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">OOS Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.oosViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Driver Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.driverViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Vehicle Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.vehicleViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Hazmat Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{insp.hazmatViolations}</span>
                                </div>
                              </div>
                              {insp.violationList?.length > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500 uppercase tracking-wider">Violation Details</span>
                                  {insp.violationList.map((v: any, vi: number) => (
                                    <div key={vi} className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] shadow-sm">
                                      <div className="flex justify-between font-bold mb-1">
                                        <span className="text-[#7C5CFC]">{v.label}</span>
                                        <span className="text-slate-400">Weight: {v.weight}</span>
                                      </div>
                                      <p className="text-slate-600 leading-relaxed">{v.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      crashLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" size={28} /></div>
                      ) : crashData.length > 0 ? crashData.map((crash: any, i: number) => {
                        const crashKey = crash.report_number ? `${crash.report_number}-${crash.seq_num || i}` : `crash-${i}`;
                        return (
                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden group">
                          <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedCrash(expandedCrash === crashKey ? null : crashKey)}
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{crash.report_date || 'N/A'}</p>
                              <p className="text-[11px] text-slate-500">{crash.report_state || 'N/A'} | {crash.report_number || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(crash.fatalities > 0) && <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">FATAL</span>}
                              {(crash.injuries > 0) && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">INJURY</span>}
                              {crash.tow_away && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">TOW</span>}
                              {expandedCrash === crashKey ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                          </div>
                          {expandedCrash === crashKey && (
                            <div className="px-4 pb-4 pt-4 border-t border-slate-100 bg-slate-50">
                              <div className="grid grid-cols-3 grid-rows-3 gap-y-4 gap-x-6">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Report #:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.report_number || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Report Date:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.report_date || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">State:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.report_state || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Fatalities:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.fatalities ?? 0}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Injuries:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.injuries ?? 0}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Tow Away:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.tow_away ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Not Preventable:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.not_preventable ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Weather:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.weather_condition_desc || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-slate-500">Vehicle ID #:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-slate-900">{crash.vehicle_id_number || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      }) : <p className="text-center py-10 text-slate-400 italic">No crash records found</p>
                    )}
                  </div>
                  {/* Pagination controls */}
                  {activeTab === 'inspections' && inspTotal > DETAIL_PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <button
                        disabled={inspPage === 0 || inspLoading}
                        onClick={() => selectedDot && loadInspections(selectedDot, inspPage - 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span className="text-xs text-slate-500 font-medium">
                        {inspPage * DETAIL_PAGE_SIZE + 1}–{Math.min((inspPage + 1) * DETAIL_PAGE_SIZE, inspTotal)} of {inspTotal}
                      </span>
                      <button
                        disabled={(inspPage + 1) * DETAIL_PAGE_SIZE >= inspTotal || inspLoading}
                        onClick={() => selectedDot && loadInspections(selectedDot, inspPage + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                  {activeTab === 'crashes' && crashTotal > DETAIL_PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <button
                        disabled={crashPage === 0 || crashLoading}
                        onClick={() => selectedDot && loadCrashes(selectedDot, crashPage - 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span className="text-xs text-slate-500 font-medium">
                        {crashPage * DETAIL_PAGE_SIZE + 1}–{Math.min((crashPage + 1) * DETAIL_PAGE_SIZE, crashTotal)} of {crashTotal}
                      </span>
                      <button
                        disabled={(crashPage + 1) * DETAIL_PAGE_SIZE >= crashTotal || crashLoading}
                        onClick={() => selectedDot && loadCrashes(selectedDot, crashPage + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
