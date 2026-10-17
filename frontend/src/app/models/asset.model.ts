export type AssetStatus = 'Available' | 'Assigned' | 'Under Repair' | 'Retired';

export interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
  category: string;
  status: AssetStatus;
  assigned_to: string | null;
  serial_number?: string;
  purchase_date?: string;
  location?: string;
  created_at?: string;
}

export interface AssetHistory {
  id: number;
  asset_id: number;
  asset_code: string;
  asset_name?: string;
  action_type: 'Created' | 'Assigned' | 'Returned' | 'Under Repair' | 'Retired' | 'Updated';
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
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}
