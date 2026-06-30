export interface InsurancePolicy {
  dot: string;
  carrier: string;
  policyNumber: string;
  effectiveDate: string;
  coverageAmount: string;
  type: string;
  class: string;
}
export interface BasicScore {
  category: string;
  measure: string;
}
export interface OosRate {
  type: string;
  rate: string;
  nationalAvg: string;
}
export interface InspectionViolation {
  label: string;
  description: string;
  weight: string;
}
export interface Inspection {
  reportNumber: string;
  location: string;
  date: string;
  oosViolations: number;
  driverViolations: number;
  vehicleViolations: number;
  hazmatViolations: number;
  violationList: InspectionViolation[];
}
export interface Crash {
  report_number: string;
  report_date: string;
  report_state: string;
  dot_number: string;
  fatalities: number;
  injuries: number;
  tow_away: boolean;
  not_preventable: boolean;
  weather_condition_desc: string;
  vehicle_id_number: string;
  vehicle_license_number: string;
  vehicle_license_state: string;
  report_seq_no: number;
  hazmat_released: boolean;
  trafficway_desc: string;
  access_control_desc: string;
  road_surface_condition_desc: string;
  light_condition_desc: string;
  citation_issued_desc: string;
  seq_num: number;
}
export interface InsuranceHistoryFiling {
  type: string;
  coverageAmount: string;
  policyNumber: string;
  effectiveDate: string;
  carrier: string;
  formCode: string;
  transDate: string;
  underlLimAmount: string;
  canclEffectiveDate: string;
  status: string;
}
export interface CarrierData {
  mcNumber: string;
  dotNumber: string;
  legalName: string;
  dbaName: string;
  entityType: string;
  status: string;
  statusCode?: string;
  authorityStatus?: string;
  email: string;
  phone: string;
  fax?: string;
  powerUnits: string;
  nonCmvUnits?: string;
  drivers: string;
  physicalAddress: string;
  mailingAddress: string;
  phyState?: string;
  dateScraped?: string;
  mcs150Date: string;
  mcs150Mileage: string;
  operationClassification: string[];
  carrierOperation: string[];
  cargoCarried: string[];
  hmInd?: string;
  operatingTerritory?: string[];
  outOfServiceDate?: string;
  stateCarrierId?: string;
  dunsNumber: string;
  companyOfficer1?: string;
  companyOfficer2?: string;
  fleetsize?: string;
  addDate?: string;
  truckUnits?: string;
  busUnits?: string;
  insurancePolicies?: InsurancePolicy[];
  insuranceHistoryFilings?: InsuranceHistoryFiling[];
  safetyRating?: string;
  safetyRatingDate?: string;
  basicScores?: BasicScore[];
  oosRates?: OosRate[];
  inspections?: Inspection[];
  crashes?: Crash[];
}
export interface ScraperConfig {
  startPoint: string;
  recordCount: number;
  includeCarriers: boolean;
  includeBrokers: boolean;
  onlyAuthorized: boolean;
  useMockData: boolean;
  useProxy: boolean;
}
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}
export type UserRole = 'user' | 'admin';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: 'Basic' | 'Essential' | 'Professional' | 'Insurance';
  dailyLimit: number;
  recordsExtractedToday: number;
  lastActive: string;
  ipAddress: string;
  isOnline: boolean;
  isBlocked?: boolean;
  allowedIps?: string[];
}
export interface BlockedIP {
  ip: string;
  blockedAt: string;
  reason: string;
}
export type ViewState = 'dashboard' | 'scraper' | 'carrier-search' | 'renewal-policies' | 'mid-term-cancellation' | 'insurance-scraper' | 'subscription' | 'settings' | 'admin' | 'fmcsa-register' | 'new-venture';
export interface FMCSARegisterEntry {
  number: string;
  title: string;
  decided: string;
  category: string;
}
export interface NewVentureData {
  id?: string;
  dot_number?: string;
  prefix?: string;
  docket_number?: string;
  status_code?: string;
  carship?: string;
  carrier_operation?: string;
  name?: string;
  name_dba?: string;
  add_date?: string;
  chgn_date?: string;
  common_stat?: string;
  contract_stat?: string;
  broker_stat?: string;
  common_app_pend?: string;
  contract_app_pend?: string;
  broker_app_pend?: string;
  common_rev_pend?: string;
  contract_rev_pend?: string;
  broker_rev_pend?: string;
  property_chk?: string;
  passenger_chk?: string;
  hhg_chk?: string;
  private_auth_chk?: string;
  enterprise_chk?: string;
  operating_status?: string;
  operating_status_indicator?: string;
  phy_str?: string;
  phy_city?: string;
  phy_st?: string;
  phy_zip?: string;
  phy_country?: string;
  phy_cnty?: string;
  mai_str?: string;
  mai_city?: string;
  mai_st?: string;
  mai_zip?: string;
  mai_country?: string;
  mai_cnty?: string;
  phy_undeliv?: string;
  mai_undeliv?: string;
  phy_phone?: string;
  phy_fax?: string;
  mai_phone?: string;
  mai_fax?: string;
  cell_phone?: string;
  email_address?: string;
  company_officer_1?: string;
  company_officer_2?: string;
  genfreight?: string;
  household?: string;
  metalsheet?: string;
  motorveh?: string;
  drivetow?: string;
  logpole?: string;
  bldgmat?: string;
  mobilehome?: string;
  machlrg?: string;
  produce?: string;
  liqgas?: string;
  intermodal?: string;
  passengers?: string;
  oilfield?: string;
  livestock?: string;
  grainfeed?: string;
  coalcoke?: string;
  meat?: string;
  garbage?: string;
  usmail?: string;
  chem?: string;
  drybulk?: string;
  coldfood?: string;
  beverages?: string;
  paperprod?: string;
  utility?: string;
  farmsupp?: string;
  construct?: string;
  waterwell?: string;
  cargoothr?: string;
  cargoothr_desc?: string;
  hm_ind?: string;
  bipd_req?: string;
  cargo_req?: string;
  bond_req?: string;
  bipd_file?: string;
  cargo_file?: string;
  bond_file?: string;
  owntruck?: string;
  owntract?: string;
  owntrail?: string;
  owncoach?: string;
  total_trucks?: string;
  total_buses?: string;
  total_pwr?: string;
  fleetsize?: string;
  total_drivers?: string;
  total_cdl?: string;
  mcs150_mileage?: string;
  mcs150_date?: string;
  safety_rating?: string;
  safety_rating_date?: string;
  smartway?: string;
  review_type?: string;
  review_date?: string;
  recordable_crash_rate?: string;
  avg_tld?: string;
  inter_drivers_within100?: string;
  inter_drivers_beyond100?: string;
  inter_drivers_total?: string;
  intra_drivers_within100?: string;
  intra_drivers_beyond100?: string;
  intra_drivers_total?: string;
  avg_leased_drivers_month?: string;
  grand_total_drivers?: string;
  total_cdl_drivers?: string;
  total_non_cdl_drivers?: string;
  raw_data?: Record<string, any>;
  scrape_date?: string;
  created_at?: string;
  updated_at?: string;
}
