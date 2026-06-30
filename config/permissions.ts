import { ViewState } from '../types';

export type PlanName = 'Basic' | 'Essential' | 'Professional' | 'Insurance';

export const PLAN_NAMES: PlanName[] = ['Basic', 'Essential', 'Professional', 'Insurance'];

// Daily record limits per plan (kept from the previous Free/Starter/Pro/Enterprise mapping).
export const PLAN_DAILY_LIMITS: Record<PlanName, number> = {
  Basic: 50,
  Essential: 100,
  Professional: 500,
  Insurance: 100000,
};

export interface PlanPermissions {
  // Pages (sidebar + routing) the plan can access. Admin role bypasses this entirely.
  pages: ViewState[];
  // View-details blur gating.
  blurInspectionsCrashes: boolean;
  blurSafety: boolean;
  blurInsuranceHistory: boolean;
  blurOfficerNames: boolean;
  // Advanced filters.
  advancedFiltersLocked: boolean;       // entire Advanced Filters panel locked (cannot open)
  disabledFilters: FilterKey[];         // individual filters disabled
  lockedFilterGroups: string[];         // filter group titles that are collapsed & cannot expand
  // Misc.
  canExport: boolean;                   // Export CSV
  fixedPageSize: number | null;         // forces a single page size when set
}

export type FilterKey = 'state' | 'hasEmail' | 'officerName';

const BASIC_PAGES: ViewState[] = ['dashboard', 'carrier-search', 'settings', 'subscription'];
const ESSENTIAL_PAGES: ViewState[] = [...BASIC_PAGES, 'fmcsa-register'];
const PROFESSIONAL_PAGES: ViewState[] = [...ESSENTIAL_PAGES, 'new-venture'];
// Insurance = everything except the Admin Panel.
const INSURANCE_PAGES: ViewState[] = [
  ...PROFESSIONAL_PAGES,
  'scraper',
  'renewal-policies',
  'mid-term-cancellation',
  'insurance-scraper',
];

export const PLAN_PERMISSIONS: Record<PlanName, PlanPermissions> = {
  Basic: {
    pages: BASIC_PAGES,
    blurInspectionsCrashes: true,
    blurSafety: true,
    blurInsuranceHistory: true,
    blurOfficerNames: true,
    advancedFiltersLocked: true,
    disabledFilters: [],
    lockedFilterGroups: [],
    canExport: false,
    fixedPageSize: 500,
  },
  Essential: {
    pages: ESSENTIAL_PAGES,
    blurInspectionsCrashes: true,
    blurSafety: true,
    blurInsuranceHistory: true,
    blurOfficerNames: true,
    advancedFiltersLocked: false,
    disabledFilters: ['state', 'hasEmail', 'officerName'],
    lockedFilterGroups: ['Insurance Policy', 'Safety'],
    canExport: false,
    fixedPageSize: null,
  },
  Professional: {
    pages: PROFESSIONAL_PAGES,
    blurInspectionsCrashes: true,
    blurSafety: true,
    blurInsuranceHistory: true,
    blurOfficerNames: false,
    advancedFiltersLocked: false,
    disabledFilters: [],
    lockedFilterGroups: ['Insurance Policy', 'Safety'],
    canExport: false,
    fixedPageSize: null,
  },
  Insurance: {
    pages: INSURANCE_PAGES,
    blurInspectionsCrashes: false,
    blurSafety: false,
    blurInsuranceHistory: false,
    blurOfficerNames: false,
    advancedFiltersLocked: false,
    disabledFilters: [],
    lockedFilterGroups: [],
    canExport: false,
    fixedPageSize: null,
  },
};

// Admin role: full access to everything. Used as an override regardless of plan.
export const ADMIN_PERMISSIONS: PlanPermissions = {
  pages: [...INSURANCE_PAGES, 'admin'],
  blurInspectionsCrashes: false,
  blurSafety: false,
  blurInsuranceHistory: false,
  blurOfficerNames: false,
  advancedFiltersLocked: false,
  disabledFilters: [],
  lockedFilterGroups: [],
  canExport: true,
  fixedPageSize: null,
};

interface UserLike {
  role?: string;
  plan?: string;
}

export const getPermissions = (user: UserLike | null | undefined): PlanPermissions => {
  if (user?.role === 'admin') return ADMIN_PERMISSIONS;
  const plan = (user?.plan as PlanName) || 'Insurance';
  return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.Insurance;
};

export const canAccessPage = (user: UserLike | null | undefined, page: ViewState): boolean => {
  return getPermissions(user).pages.includes(page);
};
