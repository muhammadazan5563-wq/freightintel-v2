import {
  saveCarrierToBackend,
  saveCarriersToBackend,
  fetchCarriersFromBackend,
  deleteCarrierFromBackend,
  getCarrierCountFromBackend,
  updateCarrierInsuranceInBackend,
  updateCarrierSafetyInBackend,
  CarrierFilters,
} from './backendApiService';
export interface CarrierRecord {
  id?: string;
  mc_number: string;
  dot_number: string;
  legal_name: string;
  dba_name?: string;
  entity_type: string;
  status: string;
  email?: string;
  phone?: string;
  power_units?: string;
  drivers?: string;
  non_cmv_units?: string;
  physical_address?: string;
  mailing_address?: string;
  date_scraped: string;
  mcs150_date?: string;
  mcs150_mileage?: string;
  operation_classification?: string[];
  carrier_operation?: string[];
  cargo_carried?: string[];
  out_of_service_date?: string;
  state_carrier_id?: string;
  duns_number?: string;
  safety_rating?: string;
  safety_rating_date?: string;
  basic_scores?: any;
  oos_rates?: any;
  insurance_policies?: any;
  inspections?: any;
  crashes?: any;
  created_at?: string;
  updated_at?: string;
}
export const saveCarrierToSupabase = async (
  carrier: any
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    if (!carrier.mcNumber || !carrier.dotNumber || !carrier.legalName) {
      return {
        success: false,
        error: 'Missing required fields: mcNumber, dotNumber, or legalName',
      };
    }
    const record: CarrierRecord = {
      mc_number: carrier.mcNumber,
      dot_number: carrier.dotNumber,
      legal_name: carrier.legalName,
      dba_name: carrier.dbaName || null,
      entity_type: carrier.entityType,
      status: carrier.status,
      email: carrier.email || null,
      phone: carrier.phone || null,
      power_units: carrier.powerUnits || null,
      drivers: carrier.drivers || null,
      non_cmv_units: carrier.nonCmvUnits || null,
      physical_address: carrier.physicalAddress || null,
      mailing_address: carrier.mailingAddress || null,
      date_scraped: carrier.dateScraped,
      mcs150_date: carrier.mcs150Date || null,
      mcs150_mileage: carrier.mcs150Mileage || null,
      operation_classification: carrier.operationClassification || [],
      carrier_operation: carrier.carrierOperation || [],
      cargo_carried: carrier.cargoCarried || [],
      out_of_service_date: carrier.outOfServiceDate || null,
      state_carrier_id: carrier.stateCarrierId || null,
      duns_number: carrier.dunsNumber || null,
      safety_rating: carrier.safetyRating || null,
      safety_rating_date: carrier.safetyRatingDate || null,
      basic_scores: carrier.basicScores || null,
      oos_rates: carrier.oosRates || null,
      insurance_policies: carrier.insurancePolicies || null,
      inspections: carrier.inspections || null,
      crashes: carrier.crashes || null,
    };
    return saveCarrierToBackend(record);
  } catch (err: any) {
    console.error('Exception saving to Backend:', err);
    return {
      success: false,
      error: `Exception: ${err.message}`,
    };
  }
};
export const saveCarriersToSupabase = async (
  carriers: any[]
): Promise<{ success: boolean; error?: string; saved: number; failed: number }> => {
  try {
    const records = carriers.map(carrier => ({
      mc_number: carrier.mcNumber,
      dot_number: carrier.dotNumber,
      legal_name: carrier.legalName,
      dba_name: carrier.dbaName || null,
      entity_type: carrier.entityType,
      status: carrier.status,
      email: carrier.email || null,
      phone: carrier.phone || null,
      power_units: carrier.powerUnits || null,
      drivers: carrier.drivers || null,
      non_cmv_units: carrier.nonCmvUnits || null,
      physical_address: carrier.physicalAddress || null,
      mailing_address: carrier.mailingAddress || null,
      date_scraped: carrier.dateScraped,
      mcs150_date: carrier.mcs150Date || null,
      mcs150_mileage: carrier.mcs150Mileage || null,
      operation_classification: carrier.operationClassification || [],
      carrier_operation: carrier.carrierOperation || [],
      cargo_carried: carrier.cargoCarried || [],
      out_of_service_date: carrier.outOfServiceDate || null,
      state_carrier_id: carrier.stateCarrierId || null,
      duns_number: carrier.dunsNumber || null,
      safety_rating: carrier.safetyRating || null,
      safety_rating_date: carrier.safetyRatingDate || null,
      basic_scores: carrier.basicScores || null,
      oos_rates: carrier.oosRates || null,
      insurance_policies: carrier.insurancePolicies || null,
      inspections: carrier.inspections || null,
      crashes: carrier.crashes || null,
    }));
    return saveCarriersToBackend(records);
  } catch (err: any) {
    console.error('Exception saving batch to Backend:', err);
    return {
      success: false,
      saved: 0,
      failed: carriers.length,
      error: `Exception: ${err.message}`,
    };
  }
};
export interface CarrierFiltersSupabase {
  mcNumber?: string;
  dotNumber?: string;
  legalName?: string;
  officerName?: string;
  entityType?: string;
  active?: string;           
  state?: string;
  hasEmail?: string;         
  hasBoc3?: string;          
  hasCompanyRep?: string;    
  yearsInBusinessMin?: number;
  yearsInBusinessMax?: number;
  classification?: string[];
  carrierOperation?: string[];
  hazmat?: string;           
  powerUnitsMin?: number;
  powerUnitsMax?: number;
  driversMin?: number;
  driversMax?: number;
  cargo?: string[];
  insuranceRequired?: string[];
  bipdMin?: number;
  bipdMax?: number;
  insEffectiveDateFrom?: string;
  insEffectiveDateTo?: string;
  bipdOnFile?: string;       
  cargoOnFile?: string;      
  bondOnFile?: string;       
  trustFundOnFile?: string;
  insCancellationDateFrom?: string;
  insCancellationDateTo?: string;
  oosMin?: number;
  oosMax?: number;
  crashesMin?: number;
  crashesMax?: number;
  injuriesMin?: number;
  injuriesMax?: number;
  fatalitiesMin?: number;
  fatalitiesMax?: number;
  towawayMin?: number;
  towawayMax?: number;
  inspectionsMin?: number;
  inspectionsMax?: number;
  insuranceCompany?: string[];
  renewalPolicyMonths?: string;
  renewalDateFrom?: string;
  renewalDateTo?: string;
  limit?: number;
  offset?: number;
}
export const fetchCarriersFromSupabase = async (filters: CarrierFiltersSupabase = {}): Promise<{ data: any[]; filtered_count: number }> => {
  try {
    const backendFilters: CarrierFilters = {
      mcNumber: filters.mcNumber,
      dotNumber: filters.dotNumber,
      legalName: filters.legalName,
      officerName: filters.officerName,
      entityType: filters.entityType,
      active: filters.active,
      state: filters.state,
      hasEmail: filters.hasEmail,
      hasBoc3: filters.hasBoc3,
      hasCompanyRep: filters.hasCompanyRep,
      classification: filters.classification,
      carrierOperation: filters.carrierOperation,
      cargo: filters.cargo,
      hazmat: filters.hazmat,
      powerUnitsMin: filters.powerUnitsMin,
      powerUnitsMax: filters.powerUnitsMax,
      driversMin: filters.driversMin,
      driversMax: filters.driversMax,
      insuranceRequired: filters.insuranceRequired,
      bipdMin: filters.bipdMin,
      bipdMax: filters.bipdMax,
      insEffectiveDateFrom: filters.insEffectiveDateFrom,
      insEffectiveDateTo: filters.insEffectiveDateTo,
      bipdOnFile: filters.bipdOnFile,
      cargoOnFile: filters.cargoOnFile,
      bondOnFile: filters.bondOnFile,
      trustFundOnFile: filters.trustFundOnFile,
      insCancellationDateFrom: filters.insCancellationDateFrom,
      insCancellationDateTo: filters.insCancellationDateTo,
      yearsInBusinessMin: filters.yearsInBusinessMin,
      yearsInBusinessMax: filters.yearsInBusinessMax,
      oosMin: filters.oosMin,
      oosMax: filters.oosMax,
      crashesMin: filters.crashesMin,
      crashesMax: filters.crashesMax,
      injuriesMin: filters.injuriesMin,
      injuriesMax: filters.injuriesMax,
      fatalitiesMin: filters.fatalitiesMin,
      fatalitiesMax: filters.fatalitiesMax,
      towawayMin: filters.towawayMin,
      towawayMax: filters.towawayMax,
      inspectionsMin: filters.inspectionsMin,
      inspectionsMax: filters.inspectionsMax,
      insuranceCompany: filters.insuranceCompany,
      renewalPolicyMonths: filters.renewalPolicyMonths,
      renewalDateFrom: filters.renewalDateFrom,
      renewalDateTo: filters.renewalDateTo,
      limit: filters.limit,
      offset: filters.offset,
    };
    const result = await fetchCarriersFromBackend(backendFilters);
    const mapped = (result.data || []).map((record: any) => ({
      mcNumber: record.mc_number,
      dotNumber: record.dot_number,
      legalName: record.legal_name,
      dbaName: record.dba_name,
      entityType: record.entity_type,
      status: record.status,
      statusCode: record.status_code,
      authorityStatus: record.authority_status,
      email: record.email,
      phone: record.phone,
      fax: record.fax,
      powerUnits: record.power_units,
      drivers: record.drivers,
      physicalAddress: record.physical_address,
      mailingAddress: record.mailing_address,
      phyState: record.phy_state,
      mcs150Date: record.mcs150_date,
      mcs150Mileage: record.mcs150_mileage,
      operationClassification: record.operation_classification,
      carrierOperation: record.carrier_operation,
      cargoCarried: record.cargo_carried,
      hmInd: record.hm_ind,
      operatingTerritory: record.operating_territory,
      dunsNumber: record.duns_number,
      companyOfficer1: record.company_officer_1,
      companyOfficer2: record.company_officer_2,
      fleetsize: record.fleetsize,
      addDate: record.add_date,
      truckUnits: record.truck_units,
      busUnits: record.bus_units,
      safetyRating: record.safety_rating,
      safetyRatingDate: record.safety_rating_date,
      basicScores: record.basic_scores,
      oosRates: record.oos_rates,
      insurancePolicies: record.insurance_policies,
      insuranceHistoryFilings: record.insurance_history_filings || [],
      inspections: record.inspections,
      crashes: record.crashes,
    }));
    return { data: mapped, filtered_count: result.filtered_count };
  } catch (err: any) {
    console.error('Backend fetch error:', err);
    return { data: [], filtered_count: 0 };
  }
};
export const deleteCarrierFromSupabase = async (dotNumber: string): Promise<boolean> => {
  return deleteCarrierFromBackend(dotNumber);
};
export const getCarrierCountFromSupabase = async (): Promise<number> => {
  return getCarrierCountFromBackend();
};
export const updateCarrierInsuranceInSupabase = async (dotNumber: string, policies: any[]): Promise<boolean> => {
  return updateCarrierInsuranceInBackend(dotNumber, policies);
};
export const updateCarrierSafetyInSupabase = async (dotNumber: string, safetyData: any): Promise<boolean> => {
  return updateCarrierSafetyInBackend(dotNumber, safetyData);
};
export const updateCarrierInsurance = updateCarrierInsuranceInSupabase;
