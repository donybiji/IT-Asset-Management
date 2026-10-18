export type AssetStatus = 
  | 'AVAILABLE' 
  | 'ASSIGNED' 
  | 'UNDER_REPAIR' 
  | 'RETIRED'
  | 'Available' 
  | 'Assigned' 
  | 'Under Repair' 
  | 'Retired';

export interface Asset {
  id: number;
  asset_code: string;
  asset_name: string;
  asset_type?: string;
  category?: string;
  serial_number?: string;
  purchase_date?: string;
  status: AssetStatus;
  assigned_to: string | null;
  location?: string;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AssetHistory {
  id: number;
  asset_id: number;
  asset_code: string;
  asset_name?: string;
  action_type: 'Created' | 'Assigned' | 'Returned' | 'Under Repair' | 'Retired' | 'Updated' | string;
  employee: string | null;
  action_date: string;
  notes: string;
}

export interface AssignRequest {
  asset_id: number;
  employee: string;
  notes?: string;
}

export interface ReturnRequest {
  asset_id: number;
  notes?: string;
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  department?: string;
  role?: string;
  assigned_assets_count?: number;
}

export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  underRepairAssets: number;
  retiredAssets: number;
  categoryBreakdown: { [category: string]: number };
  assetTypeBreakdown: { [type: string]: number };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

// Status utility helpers
export function normalizeStatus(status?: string): string {
  if (!status) return 'AVAILABLE';
  const cleaned = status.toUpperCase().trim().replace(/\s+/g, '_');
  switch (cleaned) {
    case 'AVAILABLE': return 'AVAILABLE';
    case 'ASSIGNED': return 'ASSIGNED';
    case 'UNDER_REPAIR':
    case 'UNDERREPAIR':
    case 'REPAIR': return 'UNDER_REPAIR';
    case 'RETIRED': return 'RETIRED';
    default: return cleaned;
  }
}

export function getStatusDisplayName(status?: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'AVAILABLE': return 'Available';
    case 'ASSIGNED': return 'Assigned';
    case 'UNDER_REPAIR': return 'Under Repair';
    case 'RETIRED': return 'Retired';
    default: return status || 'Available';
  }
}

export function getStatusBadgeClass(status?: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'AVAILABLE': return 'badge-available';
    case 'ASSIGNED': return 'badge-assigned';
    case 'UNDER_REPAIR': return 'badge-repair';
    case 'RETIRED': return 'badge-retired';
    default: return 'badge-available';
  }
}

export function isAvailable(status?: string): boolean {
  return normalizeStatus(status) === 'AVAILABLE';
}

export function isAssigned(status?: string): boolean {
  return normalizeStatus(status) === 'ASSIGNED';
}

export function isUnderRepair(status?: string): boolean {
  return normalizeStatus(status) === 'UNDER_REPAIR';
}

export function isRetired(status?: string): boolean {
  return normalizeStatus(status) === 'RETIRED';
}
