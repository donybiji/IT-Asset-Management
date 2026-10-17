import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Asset, AssetHistory, AssignRequest, Employee, ReturnRequest, ToastMessage } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  // State signals
  public toasts = signal<ToastMessage[]>([]);
  public cachedAssets = signal<Asset[]>([]);
  public localEmployees = signal<Employee[]>([
    { id: 1, name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', role: 'Senior Developer' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Product', role: 'Product Manager' },
    { id: 3, name: 'Alex Johnson', email: 'alex.j@company.com', department: 'Operations', role: 'System Admin' },
    { id: 4, name: 'Sarah Williams', email: 'sarah.w@company.com', department: 'Design', role: 'UI/UX Lead' },
    { id: 5, name: 'Michael Brown', email: 'm.brown@company.com', department: 'Finance', role: 'Financial Analyst' }
  ]);

  // Toast Helpers
  showToast(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 4500);
  }

  removeToast(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  // Assets API
  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.baseUrl}/assets`).pipe(
      map(assets => {
        const list = assets || [];
        this.cachedAssets.set(list);
        return list;
      }),
      catchError(err => {
        this.showToast('error', 'Error Fetching Assets', this.getErrorMessage(err));
        return throwError(() => err);
      })
    );
  }

  getAssetById(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.baseUrl}/assets/${id}`).pipe(
      catchError(err => {
        // Fallback to cached assets if single endpoint is not reachable
        const cached = this.cachedAssets().find(a => a.id === id);
        if (cached) {
          return of(cached);
        }
        this.showToast('error', 'Asset Not Found', this.getErrorMessage(err));
        return throwError(() => err);
      })
    );
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    return this.http.post<Asset>(`${this.baseUrl}/assets`, asset).pipe(
      map(newAsset => {
        this.showToast('success', 'Asset Created', `Asset ${newAsset.asset_code} successfully registered.`);
        return newAsset;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Creation Failed', msg);
        return throwError(() => err);
      })
    );
  }

  updateAsset(id: number, asset: Partial<Asset>): Observable<Asset> {
    return this.http.put<Asset>(`${this.baseUrl}/assets/${id}`, asset).pipe(
      map(updated => {
        this.showToast('success', 'Asset Updated', `Asset ${updated.asset_code} updated successfully.`);
        return updated;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Update Failed', msg);
        return throwError(() => err);
      })
    );
  }

  deleteAsset(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/assets/${id}`).pipe(
      map(res => {
        this.showToast('success', 'Asset Deleted', res.message || 'Asset removed successfully.');
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Delete Failed', msg);
        return throwError(() => err);
      })
    );
  }

  assignAsset(assetId: number, employee: string, notes?: string): Observable<any> {
    const payload: AssignRequest = { asset_id: assetId, employee, notes };
    return this.http.post(`${this.baseUrl}/assets/${assetId}/assign`, payload).pipe(
      map((res: any) => {
        this.showToast('success', 'Asset Assigned', res.message || `Assigned to ${employee}`);
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Assignment Failed', msg);
        return throwError(() => err);
      })
    );
  }

  returnAsset(assetId: number, notes?: string): Observable<any> {
    const payload: ReturnRequest = { asset_id: assetId, notes };
    return this.http.post(`${this.baseUrl}/assets/${assetId}/return`, payload).pipe(
      map((res: any) => {
        this.showToast('success', 'Asset Returned', res.message || 'Asset returned to available stock.');
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Return Failed', msg);
        return throwError(() => err);
      })
    );
  }

  markForRepair(assetId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/assets/${assetId}/repair`, {}).pipe(
      map((res: any) => {
        this.showToast('warning', 'Under Repair', res.message || 'Asset marked for maintenance/repair.');
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Action Failed', msg);
        return throwError(() => err);
      })
    );
  }

  retireAsset(assetId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/assets/${assetId}/retire`, {}).pipe(
      map((res: any) => {
        this.showToast('info', 'Asset Retired', res.message || 'Asset decommissioned and retired.');
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Action Failed', msg);
        return throwError(() => err);
      })
    );
  }

  // History API
  getAssetHistory(assetId?: number, assetCode?: string, actionType?: string, limit?: number, search?: string): Observable<AssetHistory[]> {
    let url = `${this.baseUrl}/asset-history`;
    const params: string[] = [];
    if (assetId) params.push(`asset_id=${assetId}`);
    if (assetCode) params.push(`asset_code=${encodeURIComponent(assetCode)}`);
    if (actionType) params.push(`action_type=${encodeURIComponent(actionType)}`);
    if (limit) params.push(`limit=${limit}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<AssetHistory[]>(url).pipe(
      catchError(err => {
        this.showToast('error', 'Error Fetching History', this.getErrorMessage(err));
        return of([]);
      })
    );
  }

  // Employee API
  getEmployees(): Observable<{ employees: Employee[]; isBackendProvided: boolean }> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`).pipe(
      map(data => ({
        employees: data && data.length > 0 ? data : this.deriveEmployees(),
        isBackendProvided: true
      })),
      catchError(() => {
        return of({
          employees: this.deriveEmployees(),
          isBackendProvided: false
        });
      })
    );
  }

  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, employee).pipe(
      map(newEmp => {
        this.showToast('success', 'Staff Member Added', `${newEmp.name} registered into directory.`);
        return newEmp;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Failed to Add Staff', msg);
        return throwError(() => err);
      })
    );
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${id}`, employee).pipe(
      map(updated => {
        this.showToast('success', 'Staff Member Updated', `${updated.name}'s details updated.`);
        return updated;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Update Failed', msg);
        return throwError(() => err);
      })
    );
  }

  deleteEmployee(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/employees/${id}`).pipe(
      map(res => {
        this.showToast('success', 'Staff Member Removed', res.message || 'Staff member removed from directory.');
        return res;
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err);
        this.showToast('error', 'Delete Failed', msg);
        return throwError(() => err);
      })
    );
  }


  private deriveEmployees(): Employee[] {
    const list = [...this.localEmployees()];
    const currentAssets = this.cachedAssets();
    
    // Check if any asset is assigned to an employee not in directory
    for (const asset of currentAssets) {
      if (asset.assigned_to && !list.some(e => e.name.toLowerCase() === asset.assigned_to!.toLowerCase())) {
        list.push({
          id: list.length + 1,
          name: asset.assigned_to,
          email: `${asset.assigned_to.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          department: 'General Staff',
          role: 'Team Member',
          assigned_assets_count: 1
        });
      }
    }

    // Compute assigned_assets_count
    return list.map(emp => {
      const count = currentAssets.filter(a => a.assigned_to && a.assigned_to.toLowerCase() === emp.name.toLowerCase()).length;
      return { ...emp, assigned_assets_count: count };
    });
  }

  addLocalEmployee(name: string, email: string, department: string, role: string) {
    const newEmp: Employee = {
      id: Date.now(),
      name,
      email,
      department,
      role,
      assigned_assets_count: 0
    };
    this.localEmployees.update(list => [...list, newEmp]);
    this.showToast('success', 'Employee Added', `${name} added to employee directory.`);
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (typeof err.error === 'string') {
      return err.error;
    }
    if (err.error?.message) {
      return err.error.message;
    }
    if (err.message) {
      return err.message;
    }
    return 'An unexpected network or server error occurred.';
  }
}
