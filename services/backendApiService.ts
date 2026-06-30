const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const TOKEN_KEY = 'hussfix_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }
  return { 'Content-Type': 'application/json' };
}

function authHeadersGet(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const checkUserBanStatus = async (): Promise<{ allowed: boolean; blocked: boolean; reason: string } | null> => {
  try {
    const token = getToken();
    if (!token) return null;
    
    const response = await fetch(`${BACKEND_URL}/api/auth/check-status`, {
      headers: authHeadersGet(),
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      return { allowed: false, blocked: true, reason: "Session expired. Please log in again." };
    }
    
    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('Ban status check error:', err);
    return null; // Network error, don't force logout
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ token: string; user: any } | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err: any) {
    console.error('Login error:', err);
    return null;
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  userId?: string,
  ipAddress?: string
): Promise<{ token: string; user: any } | null> => {
  try {
    const body: any = { name, email, password };
    if (userId) body.user_id = userId;
    if (ipAddress) body.ip_address = ipAddress;
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err: any) {
    console.error('Register error:', err);
    return null;
  }
};

export const logoutUser = (): void => {
  clearToken();
};

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'Basic' | 'Essential' | 'Professional' | 'Insurance';
  dailyLimit: number;
  recordsExtractedToday: number;
  lastActive: string;
  ipAddress: string;
  isOnline: boolean;
  isBlocked?: boolean;
  allowedIps?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BlockedIP {
  id?: string;
  ip_address: string;
  reason?: string;
  blocked_at?: string;
}

export interface FMCSARegisterEntry {
  id?: string;
  number: string;
  title: string;
  decided: string;
  category: string;
  date_fetched: string;
  created_at?: string;
  updated_at?: string;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const saveCarrierToBackend = async (
  carrier: any
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    if (!carrier.mc_number || !carrier.dot_number || !carrier.legal_name) {
      return {
        success: false,
        error: 'Missing required fields: mc_number, dot_number, or legal_name',
      };
    }

    const response = await fetch(`${BACKEND_URL}/api/carriers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(carrier),
    });

    const data = await handleResponse(response);
    console.log('Carrier saved:', carrier.mc_number);
    return { success: true, data };
  } catch (err: any) {
    console.error('Backend save error:', err);
    return {
      success: false,
      error: `Error: ${err.message}`,
    };
  }
};

export const saveCarriersToBackend = async (
  carriers: any[]
): Promise<{ success: boolean; error?: string; saved: number; failed: number }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/batch`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ carriers }),
    });

    const data = await handleResponse(response);
    return {
      success: data.failed === 0,
      saved: data.saved || 0,
      failed: data.failed || 0,
      error: data.failed > 0 ? `${data.failed} carriers failed to save` : undefined,
    };
  } catch (err: any) {
    console.error('Backend batch save error:', err);
    return {
      success: false,
      saved: 0,
      failed: carriers.length,
      error: err.message,
    };
  }
};

export interface CarrierFilters {
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

export const fetchCarriersFromBackend = async (filters: CarrierFilters = {}): Promise<{ data: any[]; filtered_count: number }> => {
  try {
    const params = new URLSearchParams();

    if (filters.mcNumber) params.append('mc_number', filters.mcNumber);
    if (filters.dotNumber) params.append('dot_number', filters.dotNumber);
    if (filters.legalName) params.append('legal_name', filters.legalName);
    if (filters.officerName) params.append('officer_name', filters.officerName);
    if (filters.entityType) params.append('entity_type', filters.entityType);
    if (filters.active) params.append('active', filters.active);
    if (filters.state) params.append('state', filters.state);
    if (filters.hasEmail) params.append('has_email', filters.hasEmail);
    if (filters.hasBoc3) params.append('has_boc3', filters.hasBoc3);
    if (filters.hasCompanyRep) params.append('has_company_rep', filters.hasCompanyRep);
    if (filters.classification?.length) params.append('classification', filters.classification.join(','));
    if (filters.carrierOperation?.length) params.append('carrier_operation', filters.carrierOperation.join(','));
    if (filters.cargo?.length) params.append('cargo', filters.cargo.join(','));
    if (filters.hazmat) params.append('hazmat', filters.hazmat);
    if (filters.powerUnitsMin !== undefined) params.append('power_units_min', String(filters.powerUnitsMin));
    if (filters.powerUnitsMax !== undefined) params.append('power_units_max', String(filters.powerUnitsMax));
    if (filters.driversMin !== undefined) params.append('drivers_min', String(filters.driversMin));
    if (filters.driversMax !== undefined) params.append('drivers_max', String(filters.driversMax));
    if (filters.insuranceRequired?.length) params.append('insurance_required', filters.insuranceRequired.join(','));
    if (filters.bipdMin !== undefined) params.append('bipd_min', String(filters.bipdMin));
    if (filters.bipdMax !== undefined) params.append('bipd_max', String(filters.bipdMax));
    if (filters.insEffectiveDateFrom) params.append('ins_effective_date_from', filters.insEffectiveDateFrom);
    if (filters.insEffectiveDateTo) params.append('ins_effective_date_to', filters.insEffectiveDateTo);
    if (filters.bipdOnFile) params.append('bipd_on_file', filters.bipdOnFile);
    if (filters.cargoOnFile) params.append('cargo_on_file', filters.cargoOnFile);
    if (filters.bondOnFile) params.append('bond_on_file', filters.bondOnFile);
    if (filters.trustFundOnFile) params.append('trust_fund_on_file', filters.trustFundOnFile);
    if (filters.insCancellationDateFrom) params.append('ins_cancellation_date_from', filters.insCancellationDateFrom);
    if (filters.insCancellationDateTo) params.append('ins_cancellation_date_to', filters.insCancellationDateTo);
    if (filters.yearsInBusinessMin !== undefined) params.append('years_in_business_min', String(filters.yearsInBusinessMin));
    if (filters.yearsInBusinessMax !== undefined) params.append('years_in_business_max', String(filters.yearsInBusinessMax));
    if (filters.oosMin !== undefined) params.append('oos_min', String(filters.oosMin));
    if (filters.oosMax !== undefined) params.append('oos_max', String(filters.oosMax));
    if (filters.crashesMin !== undefined) params.append('crashes_min', String(filters.crashesMin));
    if (filters.crashesMax !== undefined) params.append('crashes_max', String(filters.crashesMax));
    if (filters.injuriesMin !== undefined) params.append('injuries_min', String(filters.injuriesMin));
    if (filters.injuriesMax !== undefined) params.append('injuries_max', String(filters.injuriesMax));
    if (filters.fatalitiesMin !== undefined) params.append('fatalities_min', String(filters.fatalitiesMin));
    if (filters.fatalitiesMax !== undefined) params.append('fatalities_max', String(filters.fatalitiesMax));
    if (filters.towawayMin !== undefined) params.append('toway_min', String(filters.towawayMin));
    if (filters.towawayMax !== undefined) params.append('toway_max', String(filters.towawayMax));
    if (filters.inspectionsMin !== undefined) params.append('inspections_min', String(filters.inspectionsMin));
    if (filters.inspectionsMax !== undefined) params.append('inspections_max', String(filters.inspectionsMax));
    if (filters.insuranceCompany?.length) params.append('insurance_company', filters.insuranceCompany.join(','));
    if (filters.renewalPolicyMonths) params.append('renewal_policy_months', filters.renewalPolicyMonths);
    if (filters.renewalDateFrom) params.append('renewal_date_from', filters.renewalDateFrom);
    if (filters.renewalDateTo) params.append('renewal_date_to', filters.renewalDateTo);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const url = `${BACKEND_URL}/api/carriers?${params.toString()}`;
    const response = await fetch(url, { headers: authHeadersGet() });
    const result = await handleResponse(response);
    
    if (result && typeof result === 'object' && Array.isArray(result.data)) {
      return { data: result.data, filtered_count: result.filtered_count || 0 };
    }
    
    if (Array.isArray(result)) {
      return { data: result, filtered_count: result.length };
    }
    return { data: [], filtered_count: 0 };
  } catch (err: any) {
    console.error('Backend fetch error:', err);
    return { data: [], filtered_count: 0 };
  }
};

export const deleteCarrierFromBackend = async (dotNumber: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/${dotNumber}`, {
      method: 'DELETE',
      headers: authHeadersGet(),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend delete error:', err);
    return false;
  }
};

export const getCarrierCountFromBackend = async (): Promise<number> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/count`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.count || 0;
  } catch (err: any) {
    console.error('Backend count error:', err);
    return 0;
  }
};

export interface DashboardStats {
  total: number;
  active_carriers: number;
  brokers: number;
  with_email: number;
  email_rate: string;
  with_safety_rating: number;
  with_insurance: number;
  with_inspections: number;
  with_crashes: number;
  not_authorized: number;
  other: number;
  monthly_additions?: { month: string; count: number }[];
  trend_pct?: number;
}

export const fetchDashboardStatsFromBackend = async (): Promise<DashboardStats> => {
  const empty: DashboardStats = {
    total: 0, active_carriers: 0, brokers: 0,
    with_email: 0, email_rate: '0',
    with_safety_rating: 0, with_insurance: 0,
    with_inspections: 0, with_crashes: 0,
    not_authorized: 0, other: 0,
  };
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/dashboard-stats`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data || empty;
  } catch (err: any) {
    console.error('Backend dashboard stats error:', err);
    return empty;
  }
};

export const updateCarrierInsuranceInBackend = async (dotNumber: string, policies: any[]): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/${dotNumber}/insurance`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ policies }),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend insurance update error:', err);
    return false;
  }
};

export const updateCarrierSafetyInBackend = async (dotNumber: string, safetyData: any): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/${dotNumber}/safety`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(safetyData),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend safety update error:', err);
    return false;
  }
};

export const fetchUsersFromBackend = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return (data || []).map((row: any) => ({
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      plan: row.plan,
      dailyLimit: row.daily_limit,
      recordsExtractedToday: row.records_extracted_today,
      lastActive: row.last_active || 'Never',
      ipAddress: row.ip_address || '',
      isOnline: row.is_online || false,
      isBlocked: row.is_blocked || false,
      allowedIps: row.allowed_ips || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err: any) {
    console.error('Backend fetch users error:', err);
    return [];
  }
};

export const fetchUserByEmailFromBackend = async (email: string): Promise<User | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/by-email/${encodeURIComponent(email)}`, { headers: authHeadersGet() });
    const row = await handleResponse(response);
    return {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      plan: row.plan,
      dailyLimit: row.daily_limit,
      recordsExtractedToday: row.records_extracted_today,
      lastActive: row.last_active || 'Never',
      ipAddress: row.ip_address || '',
      isOnline: row.is_online || false,
      isBlocked: row.is_blocked || false,
      allowedIps: row.allowed_ips || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (err: any) {
    console.error('Backend fetch user by email error:', err);
    return null;
  }
};

export const createUserInBackend = async (user: User, passwordHash?: string): Promise<User | null> => {
  try {
    const userData: any = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      daily_limit: user.dailyLimit,
      records_extracted_today: user.recordsExtractedToday,
      last_active: user.lastActive,
      ip_address: user.ipAddress,
      is_online: user.isOnline,
      is_blocked: user.isBlocked,
      allowed_ips: user.allowedIps || [],
    };
    if (passwordHash) {
      userData.password = passwordHash;
    }

    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });

    const row = await handleResponse(response);
    return {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      plan: row.plan,
      dailyLimit: row.daily_limit,
      recordsExtractedToday: row.records_extracted_today,
      lastActive: row.last_active || 'Never',
      ipAddress: row.ip_address || '',
      isOnline: row.is_online || false,
      isBlocked: row.is_blocked || false,
      allowedIps: row.allowed_ips || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (err: any) {
    console.error('Backend create user error:', err);
    return null;
  }
};

export const updateUserInBackend = async (user: User): Promise<boolean> => {
  try {
    // Check if the current user is admin to decide which fields to send.
    // Non-admin users can only update their own non-sensitive fields.
    const currentUserStr = localStorage.getItem('hussfix_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const isAdmin = currentUser?.role === 'admin';

    let userData: Record<string, unknown>;
    if (isAdmin) {
      userData = {
        name: user.name,
        role: user.role,
        plan: user.plan,
        daily_limit: user.dailyLimit,
        records_extracted_today: user.recordsExtractedToday,
        last_active: user.lastActive,
        ip_address: user.ipAddress,
        is_online: user.isOnline,
        is_blocked: user.isBlocked,
        allowed_ips: user.allowedIps || [],
      };
    } else {
      // Non-admin self-update: only send allowed fields
      userData = {
        name: user.name,
        is_online: user.isOnline,
        last_active: user.lastActive,
        ip_address: user.ipAddress,
      };
    }

    const response = await fetch(`${BACKEND_URL}/api/users/${user.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });

    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend update user error:', err);
    return false;
  }
};

export const deleteUserFromBackend = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: authHeadersGet(),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend delete user error:', err);
    return false;
  }
};

export const verifyUserPasswordInBackend = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    return data.valid || false;
  } catch (err: any) {
    console.error('Backend verify password error:', err);
    return false;
  }
};

export const fetchBlockedIPsFromBackend = async (): Promise<BlockedIP[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-ips`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return (data || []).map((row: any) => ({
      id: row.id,
      ip_address: row.ip_address,
      reason: row.reason || 'No reason provided',
      blocked_at: row.blocked_at,
    }));
  } catch (err: any) {
    console.error('Backend fetch blocked IPs error:', err);
    return [];
  }
};

export const blockIPInBackend = async (ip: string, reason: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-ips`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ip_address: ip, reason }),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend block IP error:', err);
    return false;
  }
};

export const unblockIPInBackend = async (ip: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-ips/${ip}`, {
      method: 'DELETE',
      headers: authHeadersGet(),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend unblock IP error:', err);
    return false;
  }
};

export const isIPBlockedInBackend = async (ip: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-ips/check/${ip}`);
    const data = await handleResponse(response);
    return data.blocked || false;
  } catch (err: any) {
    console.error('Backend check IP blocked error:', err);
    return false;
  }
};

export const saveFMCSARegisterEntriesToBackend = async (
  entries: FMCSARegisterEntry[],
  extractedDate: string
): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    if (!entries || entries.length === 0) {
      console.log('No entries to save');
      return { success: true, count: 0 };
    }

    const response = await fetch(`${BACKEND_URL}/api/fmcsa-register/save`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ entries, extractedDate }),
    });

    const data = await handleResponse(response);
    return { success: true, count: data.saved || entries.length };
  } catch (err: any) {
    console.error('Backend save FMCSA entries error:', err);
    return { success: false, error: err.message };
  }
};

export const fetchFMCSARegisterByDateFromBackend = async (
  extractedDate: string,
  category?: string,
  search?: string
): Promise<FMCSARegisterEntry[]> => {
  try {
    const params = new URLSearchParams();
    params.append('extracted_date', extractedDate);
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const response = await fetch(`${BACKEND_URL}/api/fmcsa-register/entries?${params.toString()}`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.entries || [];
  } catch (err: any) {
    console.error('Backend fetch FMCSA entries error:', err);
    return [];
  }
};

export const getFMCSAExtractedDatesFromBackend = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/fmcsa-register/dates`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.dates || [];
  } catch (err: any) {
    console.error('Backend fetch FMCSA dates error:', err);
    return [];
  }
};

export const getFMCSACategoriesFromBackend = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/fmcsa-register/categories`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.categories || [];
  } catch (err: any) {
    console.error('Backend fetch FMCSA categories error:', err);
    return [];
  }
};

export const deleteFMCSAEntriesBeforeDateFromBackend = async (date: string): Promise<{ success: boolean; error?: string; deleted?: number }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/fmcsa-register/before/${date}`, {
      method: 'DELETE',
      headers: authHeadersGet(),
    });
    const data = await handleResponse(response);
    return { success: true, deleted: data.deleted };
  } catch (err: any) {
    console.error('Backend delete FMCSA entries error:', err);
    return { success: false, error: err.message };
  }
};


export interface NewVentureFilters {
  docketNumber?: string;
  dotNumber?: string;
  companyName?: string;
  dateFrom?: string;
  dateTo?: string;
  active?: string;
  entityType?: string;
  state?: string;
  hasEmail?: string;
  carrierOperation?: string;
  hazmat?: string;
  powerUnitsMin?: number;
  powerUnitsMax?: number;
  driversMin?: number;
  driversMax?: number;
  bipdOnFile?: string;
  cargoOnFile?: string;
  bondOnFile?: string;
  limit?: number;
  offset?: number;
}

export const fetchNewVenturesFromBackend = async (filters: NewVentureFilters = {}): Promise<{ data: any[]; filtered_count: number; total_count: number; available_dates: string[] }> => {
  try {
    const params = new URLSearchParams();

    if (filters.docketNumber) params.append('docket_number', filters.docketNumber);
    if (filters.dotNumber) params.append('dot_number', filters.dotNumber);
    if (filters.companyName) params.append('company_name', filters.companyName);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.active) params.append('active', filters.active);
    if (filters.entityType) params.append('entity_type', filters.entityType);
    if (filters.state) params.append('state', filters.state);
    if (filters.hasEmail) params.append('has_email', filters.hasEmail);
    if (filters.carrierOperation) params.append('carrier_operation', filters.carrierOperation);
    if (filters.hazmat) params.append('hazmat', filters.hazmat);
    if (filters.powerUnitsMin !== undefined) params.append('power_units_min', String(filters.powerUnitsMin));
    if (filters.powerUnitsMax !== undefined) params.append('power_units_max', String(filters.powerUnitsMax));
    if (filters.driversMin !== undefined) params.append('drivers_min', String(filters.driversMin));
    if (filters.driversMax !== undefined) params.append('drivers_max', String(filters.driversMax));
    if (filters.bipdOnFile) params.append('bipd_on_file', filters.bipdOnFile);
    if (filters.cargoOnFile) params.append('cargo_on_file', filters.cargoOnFile);
    if (filters.bondOnFile) params.append('bond_on_file', filters.bondOnFile);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const url = `${BACKEND_URL}/api/new-ventures?${params.toString()}`;
    const response = await fetch(url, { headers: authHeadersGet() });
    const result = await handleResponse(response);
    
    if (result && typeof result === 'object' && Array.isArray(result.data)) {
      return {
        data: result.data,
        filtered_count: result.filtered_count || 0,
        total_count: result.total_count || 0,
        available_dates: result.available_dates || [],
      };
    }
    
    if (Array.isArray(result)) {
      return { data: result, filtered_count: result.length, total_count: result.length, available_dates: [] };
    }
    return { data: [], filtered_count: 0, total_count: 0, available_dates: [] };
  } catch (err: any) {
    console.error('Backend fetch new ventures error:', err);
    return { data: [], filtered_count: 0, total_count: 0, available_dates: [] };
  }
};

export const startNewVentureScrape = async (addedDate: string): Promise<{ success: boolean; scraped?: number; saved?: number; error?: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/new-ventures/scrape`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ added_date: addedDate }),
    });
    const data = await handleResponse(response);
    return { success: true, scraped: data.scraped, saved: data.saved };
  } catch (err: any) {
    console.error('Backend scrape new ventures error:', err);
    return { success: false, error: err.message };
  }
};

export const getNewVentureCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/new-ventures/count`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.count || 0;
  } catch (err: any) {
    console.error('Backend new venture count error:', err);
    return 0;
  }
};

export const getNewVentureDates = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/new-ventures/dates`, { headers: authHeadersGet() });
    const data = await handleResponse(response);
    return data.dates || [];
  } catch (err: any) {
    console.error('Backend new venture dates error:', err);
    return [];
  }
};

export const fetchNewVentureDetail = async (id: string): Promise<any | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/new-ventures/detail/${id}`, { headers: authHeadersGet() });
    return await handleResponse(response);
  } catch (err: any) {
    console.error('Backend fetch new venture detail error:', err);
    return null;
  }
};

export const deleteNewVenture = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/new-ventures/${id}`, {
      method: 'DELETE',
      headers: authHeadersGet(),
    });
    await handleResponse(response);
    return true;
  } catch (err: any) {
    console.error('Backend delete new venture error:', err);
    return false;
  }
};

export interface InsuranceHistoryPolicy {
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

export const fetchInsuranceHistory = async (docketNumber: string): Promise<InsuranceHistoryPolicy[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/carriers/${docketNumber}/insurance-history`, {
      headers: authHeadersGet(),
    });
    const data = await handleResponse(response);
    return data.policies || [];
  } catch (err: any) {
    console.error('Backend fetch insurance history error:', err);
    return [];
  }
};

export const fetchInspectionsByDot = async (
  dotNumber: string,
  limit: number = 10,
  offset: number = 0,
): Promise<{ inspections: any[]; total: number }> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/inspections/by-dot/${dotNumber}?limit=${limit}&offset=${offset}`,
      { headers: authHeadersGet() },
    );
    const data = await handleResponse(response);
    return { inspections: data.inspections || [], total: data.total || 0 };
  } catch (err: any) {
    console.error('Backend fetch inspections error:', err);
    return { inspections: [], total: 0 };
  }
};

export const fetchCrashesByDot = async (
  dotNumber: string,
  limit: number = 10,
  offset: number = 0,
): Promise<{ crashes: any[]; total: number }> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/crashes/by-dot/${dotNumber}?limit=${limit}&offset=${offset}`,
      { headers: authHeadersGet() },
    );
    const data = await handleResponse(response);
    return { crashes: data.crashes || [], total: data.total || 0 };
  } catch (err: any) {
    console.error('Backend fetch crashes error:', err);
    return { crashes: [], total: 0 };
  }
};

export const fetchSafetyByDot = async (dotNumber: string): Promise<any | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/safety/${dotNumber}`, {
      headers: authHeadersGet(),
    });
    if (response.status === 404) return null;
    const data = await handleResponse(response);
    return data;
  } catch (err: any) {
    console.error('Backend fetch safety error:', err);
    return null;
  }
};
