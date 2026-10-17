import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AssetService } from '../../services/asset.service';
import { Employee, Asset } from '../../models/asset.model';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="employees-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Staff Directory & Asset Custodians
          </h1>
          <p class="page-subtitle">Manage company staff records, view tracked equipment custodians, and allocate department hardware.</p>
        </div>

        <div class="header-actions">
          <button (click)="exportCSV()" class="btn btn-outline btn-sm" [disabled]="loading() || filteredEmployees().length === 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>

          <button (click)="openAddModal()" class="btn btn-primary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      <!-- Quick Directory Metrics -->
      <div class="metrics-row" *ngIf="!loading()">
        <div class="metric-card">
          <span class="metric-label">Total Staff</span>
          <span class="metric-num">{{ totalStaff() }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Active Custodians</span>
          <span class="metric-num text-assigned">{{ activeCustodians() }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Departments</span>
          <span class="metric-num text-dept">{{ departmentsCount() }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Assigned Hardware</span>
          <span class="metric-num text-hardware">{{ totalAssignedAssets() }}</span>
        </div>
      </div>

      <!-- Live PostgreSQL Status Pill -->
      <div class="live-status-bar">
        <div class="status-left">
          <span class="pulse-dot"></span>
          <span><strong>PostgreSQL Directory Connected</strong> &bull; Synced with hardware inventory</span>
        </div>
        <div class="status-right">
          <span>{{ filteredEmployees().length }} of {{ employees().length }} staff shown</span>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="card filter-bar">
        <div class="search-input-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by name, email, department or role..." 
            class="form-control search-field"
          />
          <button *ngIf="searchQuery()" class="clear-btn" (click)="onSearchChange('')">&times;</button>
        </div>

        <div class="filters-wrap">
          <!-- Department Filter -->
          <div class="filter-group">
            <label class="filter-label" for="deptFilter">Department:</label>
            <select 
              id="deptFilter"
              [ngModel]="selectedDepartment()" 
              (ngModelChange)="selectedDepartment.set($event); currentPage.set(1)"
              class="form-select filter-select"
            >
              <option value="ALL">All Departments</option>
              <option *ngFor="let d of departmentOptions()" [value]="d">{{ d }}</option>
            </select>
          </div>

          <button 
            *ngIf="searchQuery() || selectedDepartment() !== 'ALL'"
            type="button" 
            (click)="resetFilters()" 
            class="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Employees Directory Table -->
      <div class="card table-container">
        <!-- Loading State -->
        <div *ngIf="loading()" class="state-box">
          <div class="spinner"></div>
          <p style="margin-top: 1rem; color: var(--text-muted);">Loading employee directory from PostgreSQL...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredEmployees().length === 0" class="state-box">
          <div class="state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.25rem;">No staff members match criteria</h3>
          <p style="font-size: 0.875rem; color: var(--text-dim);">Try clearing your search term or department filter.</p>
          <div style="margin-top: 1rem;">
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()">Reset Filters</button>
          </div>
        </div>

        <!-- Directory Table -->
        <div class="table-responsive" *ngIf="!loading() && filteredEmployees().length > 0">
          <table class="table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Corporate Email</th>
                <th>Department</th>
                <th>Role / Title</th>
                <th>Hardware Assigned</th>
                <th style="text-align: right; width: 220px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of paginatedEmployees()" class="emp-row">
                <td>
                  <div class="employee-cell">
                    <div class="avatar-sm">{{ emp.name.charAt(0).toUpperCase() }}</div>
                    <div>
                      <strong class="emp-name">{{ emp.name }}</strong>
                      <div class="emp-id-sub">Staff #{{ emp.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="email-cell">{{ emp.email || '—' }}</td>
                <td>
                  <span class="dept-badge">{{ emp.department || 'General Staff' }}</span>
                </td>
                <td style="color: #cbd5e1;">{{ emp.role || 'Team Member' }}</td>
                <td>
                  <button 
                    type="button"
                    class="badge asset-badge-btn"
                    [ngClass]="(emp.assigned_assets_count || 0) > 0 ? 'badge-assigned' : 'badge-retired'"
                    (click)="openAssignedAssetsModal(emp)"
                    title="Click to view assigned hardware"
                  >
                    <span class="dot-sm"></span>
                    {{ emp.assigned_assets_count || 0 }} Assigned
                  </button>
                </td>
                <td style="text-align: right;">
                  <div class="row-actions">
                    <a routerLink="/assign" class="btn btn-outline btn-xs" title="Assign new hardware to this staff member">
                      + Assign
                    </a>
                    <button class="btn btn-secondary btn-xs" (click)="openEditModal(emp)" title="Edit staff details">
                      Edit
                    </button>
                    <button class="btn btn-danger-outline btn-xs" (click)="openDeleteModal(emp)" title="Remove staff member">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="pagination-footer" *ngIf="!loading() && filteredEmployees().length > 0">
          <div class="pagination-info">
            Showing 
            <strong>{{ (currentPage() - 1) * pageSize() + 1 }}</strong> 
            to 
            <strong>{{ mathMin(currentPage() * pageSize(), filteredEmployees().length) }}</strong> 
            of 
            <strong>{{ filteredEmployees().length }}</strong> staff members
          </div>

          <div class="pagination-controls">
            <button 
              class="btn btn-secondary btn-sm" 
              [disabled]="currentPage() <= 1"
              (click)="currentPage.set(currentPage() - 1)"
            >
              &larr; Prev
            </button>
            <span class="page-indicator">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button 
              class="btn btn-secondary btn-sm" 
              [disabled]="currentPage() >= totalPages()"
              (click)="currentPage.set(currentPage() + 1)"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      <!-- ADD STAFF MEMBER MODAL -->
      <div class="modal-backdrop" *ngIf="showAddModal()" (click)="showAddModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <h3>Add Staff Member</h3>
            </div>
            <button class="modal-close" (click)="showAddModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-sub">Register a new employee into PostgreSQL staff directory.</p>

            <div class="form-group">
              <label class="form-label" for="addEmpName">Full Name <span class="required">*</span></label>
              <input 
                id="addEmpName"
                type="text" 
                [ngModel]="empFormName()" 
                (ngModelChange)="empFormName.set($event)" 
                placeholder="e.g. David Miller" 
                class="form-control" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="addEmpEmail">Corporate Email</label>
              <input 
                id="addEmpEmail"
                type="email" 
                [ngModel]="empFormEmail()" 
                (ngModelChange)="empFormEmail.set($event)" 
                placeholder="e.g. d.miller@company.com" 
                class="form-control" 
              />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="addEmpDept">Department</label>
                <input 
                  id="addEmpDept"
                  type="text" 
                  [ngModel]="empFormDept()" 
                  (ngModelChange)="empFormDept.set($event)" 
                  placeholder="e.g. Engineering" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="addEmpRole">Role / Job Title</label>
                <input 
                  id="addEmpRole"
                  type="text" 
                  [ngModel]="empFormRole()" 
                  (ngModelChange)="empFormRole.set($event)" 
                  placeholder="e.g. DevOps Engineer" 
                  class="form-control" 
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showAddModal.set(false)">Cancel</button>
            <button 
              class="btn btn-primary btn-sm" 
              (click)="saveNewEmployee()" 
              [disabled]="!empFormName().trim() || actionLoading()"
            >
              <span *ngIf="actionLoading()" class="spinner-sm"></span>
              <span>{{ actionLoading() ? 'Saving...' : 'Add to Directory' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- EDIT STAFF MEMBER MODAL -->
      <div class="modal-backdrop" *ngIf="showEditModal()" (click)="showEditModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <h3>Edit Staff Member</h3>
            </div>
            <button class="modal-close" (click)="showEditModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label" for="editEmpName">Full Name <span class="required">*</span></label>
              <input 
                id="editEmpName"
                type="text" 
                [ngModel]="empFormName()" 
                (ngModelChange)="empFormName.set($event)" 
                class="form-control" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="editEmpEmail">Corporate Email</label>
              <input 
                id="editEmpEmail"
                type="email" 
                [ngModel]="empFormEmail()" 
                (ngModelChange)="empFormEmail.set($event)" 
                class="form-control" 
              />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="editEmpDept">Department</label>
                <input 
                  id="editEmpDept"
                  type="text" 
                  [ngModel]="empFormDept()" 
                  (ngModelChange)="empFormDept.set($event)" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="editEmpRole">Role / Job Title</label>
                <input 
                  id="editEmpRole"
                  type="text" 
                  [ngModel]="empFormRole()" 
                  (ngModelChange)="empFormRole.set($event)" 
                  class="form-control" 
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showEditModal.set(false)">Cancel</button>
            <button 
              class="btn btn-primary btn-sm" 
              (click)="saveEditEmployee()" 
              [disabled]="!empFormName().trim() || actionLoading()"
            >
              <span *ngIf="actionLoading()" class="spinner-sm"></span>
              <span>{{ actionLoading() ? 'Updating...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div class="modal-backdrop" *ngIf="showDeleteModal()" (click)="showDeleteModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap" style="color: #f87171;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Delete Staff Member</h3>
            </div>
            <button class="modal-close" (click)="showDeleteModal.set(false)">&times;</button>
          </div>
          <div class="modal-body" *ngIf="selectedEmployee()">
            <p style="color: #cbd5e1; line-height: 1.5;">
              Are you sure you want to remove <strong>{{ selectedEmployee()!.name }}</strong> from the staff directory?
            </p>

            <!-- Warning if employee has assigned assets -->
            <div *ngIf="(selectedEmployee()!.assigned_assets_count || 0) > 0" class="delete-blocked-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <strong>Deletion Blocked:</strong>
                <p>This employee currently has <strong>{{ selectedEmployee()!.assigned_assets_count }}</strong> assigned hardware asset(s). Return or reassign equipment before deleting this staff member.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showDeleteModal.set(false)">Cancel</button>
            <button 
              class="btn btn-danger btn-sm" 
              (click)="confirmDeleteEmployee()" 
              [disabled]="(selectedEmployee()?.assigned_assets_count || 0) > 0 || actionLoading()"
            >
              <span *ngIf="actionLoading()" class="spinner-sm"></span>
              <span>{{ actionLoading() ? 'Deleting...' : 'Delete Staff Member' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW ASSIGNED ASSETS MODAL -->
      <div class="modal-backdrop" *ngIf="showAssetsModal()" (click)="showAssetsModal.set(false)">
        <div class="modal-dialog modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <h3>Hardware Assigned to {{ selectedEmployee()?.name }}</h3>
            </div>
            <button class="modal-close" (click)="showAssetsModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <div *ngIf="employeeAssets().length === 0" class="empty-state-sm">
              <p>No hardware is currently assigned to this staff member.</p>
              <a routerLink="/assign" (click)="showAssetsModal.set(false)" class="btn btn-primary btn-sm" style="margin-top: 0.75rem;">
                + Allocate Hardware Asset
              </a>
            </div>

            <div *ngIf="employeeAssets().length > 0" class="asset-cards-grid">
              <div *ngFor="let asset of employeeAssets()" class="custodian-asset-card">
                <div class="custodian-card-header">
                  <div>
                    <span class="code-font">{{ asset.asset_code }}</span>
                    <h4 class="custodian-asset-name">{{ asset.asset_name }}</h4>
                  </div>
                  <span class="badge badge-assigned">Assigned</span>
                </div>
                <div class="custodian-card-body">
                  <div class="custodian-detail">
                    <span class="lbl">Category:</span>
                    <span class="val">{{ asset.category }}</span>
                  </div>
                  <div class="custodian-detail">
                    <span class="lbl">Serial No:</span>
                    <span class="val code-font">{{ asset.serial_number || 'N/A' }}</span>
                  </div>
                  <div class="custodian-detail">
                    <span class="lbl">Location:</span>
                    <span class="val">{{ asset.location || 'Assigned' }}</span>
                  </div>
                </div>
                <div class="custodian-card-footer">
                  <button 
                    type="button" 
                    class="btn btn-outline btn-xs return-btn"
                    (click)="returnEmployeeAsset(asset.id, asset.asset_code)"
                    [disabled]="returningAssetId() === asset.id"
                  >
                    <span *ngIf="returningAssetId() === asset.id" class="spinner-sm"></span>
                    <span>{{ returningAssetId() === asset.id ? 'Returning...' : 'Return Hardware to Stock' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showAssetsModal.set(false)">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employees-page {
      max-width: 1300px;
      margin: 0 auto;
    }

    /* Metrics Row */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-dim);
    }

    .metric-num {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin-top: 0.25rem;
      font-family: var(--font-display);
    }
    .text-assigned { color: #818cf8; }
    .text-dept { color: #38bdf8; }
    .text-hardware { color: #34d399; }

    /* Live Status Bar */
    .live-status-bar {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: var(--radius-md);
      padding: 0.75rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      font-size: 0.8125rem;
      color: #a7f3d0;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .status-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulseDot 2s infinite;
    }

    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .status-right {
      color: var(--text-dim);
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      padding: 1.25rem 1.5rem;
    }

    .search-input-wrap {
      position: relative;
      flex: 1;
      min-width: 280px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
    }

    .search-field {
      padding-left: 2.25rem;
      padding-right: 2rem;
    }

    .clear-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-dim);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
    .clear-btn:hover {
      color: #fff;
    }

    .filters-wrap {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.8125rem;
      color: var(--text-dim);
      font-weight: 600;
      white-space: nowrap;
    }

    .filter-select {
      width: auto;
      min-width: 170px;
      padding: 0.45rem 0.75rem;
      font-size: 0.8125rem;
      height: 38px;
    }

    /* Table Container */
    .table-container {
      overflow: hidden;
      padding: 0;
    }

    .employee-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar-sm {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .emp-name {
      color: #fff;
      display: block;
      font-size: 0.9375rem;
    }

    .emp-id-sub {
      font-size: 0.6875rem;
      color: var(--text-dim);
      font-family: var(--font-mono);
      margin-top: 1px;
    }

    .email-cell {
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .dept-badge {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      color: #e2e8f0;
      font-weight: 500;
    }

    .asset-badge-btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
      font-weight: 600;
    }
    .asset-badge-btn:hover {
      filter: brightness(1.15);
      transform: scale(1.03);
    }

    .dot-sm {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }

    .row-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-xs {
      padding: 0.25rem 0.55rem;
      font-size: 0.75rem;
    }

    .btn-danger-outline {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .btn-danger-outline:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: #ef4444;
      color: #fca5a5;
    }

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-card);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .pagination-info {
      font-size: 0.8125rem;
      color: var(--text-dim);
    }
    .pagination-info strong {
      color: #fff;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .page-indicator {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      padding: 1rem;
    }

    .modal-dialog {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      animation: modalIn 0.2s ease-out;
    }

    .modal-dialog.modal-lg {
      max-width: 640px;
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #fff;
    }
    .modal-title-wrap h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-dim);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .modal-close:hover {
      color: #fff;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-sub {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .delete-blocked-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-top: 1rem;
      color: #fca5a5;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      font-size: 0.8125rem;
      line-height: 1.4;
    }

    /* Custodian Asset Cards inside Modal */
    .asset-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      max-height: 380px;
      overflow-y: auto;
      padding-right: 4px;
    }

    @media (max-width: 640px) {
      .asset-cards-grid {
        grid-template-columns: 1fr;
      }
    }

    .custodian-asset-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .custodian-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .custodian-asset-name {
      font-size: 0.9375rem;
      color: #fff;
      margin: 2px 0 0 0;
      font-weight: 700;
    }

    .custodian-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }

    .custodian-detail {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }
    .custodian-detail .lbl { color: var(--text-dim); }
    .custodian-detail .val { color: #e2e8f0; font-weight: 500; }

    .custodian-card-footer {
      display: flex;
      justify-content: flex-end;
    }

    .return-btn {
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.3);
    }
    .return-btn:hover:not(:disabled) {
      background: rgba(52, 211, 153, 0.1);
      border-color: #34d399;
      color: #6ee7b7;
    }

    .empty-state-sm {
      text-align: center;
      padding: 2rem;
      color: var(--text-dim);
      font-size: 0.875rem;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class EmployeesComponent implements OnInit {
  private assetService = inject(AssetService);
  private cdr = inject(ChangeDetectorRef);

  // Reactive State Signals
  public employees = signal<Employee[]>([]);
  public allAssets = signal<Asset[]>([]);
  public isBackendProvided = signal<boolean>(true);
  public loading = signal<boolean>(true);
  public actionLoading = signal<boolean>(false);
  public returningAssetId = signal<number | null>(null);

  // Filters
  public searchQuery = signal<string>('');
  public selectedDepartment = signal<string>('ALL');

  // Pagination
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);

  // Modals State
  public showAddModal = signal<boolean>(false);
  public showEditModal = signal<boolean>(false);
  public showDeleteModal = signal<boolean>(false);
  public showAssetsModal = signal<boolean>(false);

  public selectedEmployee = signal<Employee | null>(null);

  // Form Fields
  public empFormName = signal<string>('');
  public empFormEmail = signal<string>('');
  public empFormDept = signal<string>('');
  public empFormRole = signal<string>('');

  // Computed Metrics
  public totalStaff = computed(() => this.employees().length);
  public activeCustodians = computed(() => this.employees().filter(e => (e.assigned_assets_count || 0) > 0).length);
  public departmentsCount = computed(() => {
    const depts = this.employees().map(e => e.department || 'General Staff');
    return new Set(depts).size;
  });
  public totalAssignedAssets = computed(() => {
    return this.employees().reduce((acc, e) => acc + (e.assigned_assets_count || 0), 0);
  });

  // Department Dropdown Options
  public departmentOptions = computed(() => {
    const list = this.employees().map(e => e.department || 'General Staff').filter(Boolean);
    return Array.from(new Set(list)).sort();
  });

  // Filtered Employees
  public filteredEmployees = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const dept = this.selectedDepartment();

    return this.employees().filter(e => {
      // Dept filter
      if (dept !== 'ALL' && (e.department || 'General Staff').toLowerCase() !== dept.toLowerCase()) {
        return false;
      }

      // Search filter
      if (q) {
        const matchName = e.name.toLowerCase().includes(q);
        const matchEmail = e.email ? e.email.toLowerCase().includes(q) : false;
        const matchDept = e.department ? e.department.toLowerCase().includes(q) : false;
        const matchRole = e.role ? e.role.toLowerCase().includes(q) : false;
        if (!matchName && !matchEmail && !matchDept && !matchRole) {
          return false;
        }
      }

      return true;
    });
  });

  // Paginated Employees
  public paginatedEmployees = computed(() => {
    const filtered = this.filteredEmployees();
    const start = (this.currentPage() - 1) * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  // Total pages
  public totalPages = computed(() => {
    return Math.ceil(this.filteredEmployees().length / this.pageSize()) || 1;
  });

  // Assets belonging to currently inspected employee
  public employeeAssets = computed(() => {
    const emp = this.selectedEmployee();
    if (!emp) return [];
    return this.allAssets().filter(a => a.assigned_to && a.assigned_to.toLowerCase() === emp.name.toLowerCase() && a.status === 'Assigned');
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    forkJoin({
      empRes: this.assetService.getEmployees(),
      assets: this.assetService.getAssets()
    }).subscribe({
      next: ({ empRes, assets }) => {
        this.employees.set(empRes.employees || []);
        this.isBackendProvided.set(empRes.isBackendProvided);
        this.allAssets.set(assets || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(term: string) {
    this.searchQuery.set(term);
    this.currentPage.set(1);
    this.cdr.markForCheck();
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedDepartment.set('ALL');
    this.currentPage.set(1);
    this.cdr.markForCheck();
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  openAddModal() {
    this.empFormName.set('');
    this.empFormEmail.set('');
    this.empFormDept.set('Engineering');
    this.empFormRole.set('Software Engineer');
    this.showAddModal.set(true);
    this.cdr.markForCheck();
  }

  saveNewEmployee() {
    const name = this.empFormName().trim();
    if (!name) return;

    this.actionLoading.set(true);
    const newEmp: Partial<Employee> = {
      name,
      email: this.empFormEmail().trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      department: this.empFormDept().trim() || 'General Staff',
      role: this.empFormRole().trim() || 'Team Member'
    };

    this.assetService.createEmployee(newEmp).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showAddModal.set(false);
        this.loadData();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openEditModal(emp: Employee) {
    this.selectedEmployee.set(emp);
    this.empFormName.set(emp.name);
    this.empFormEmail.set(emp.email || '');
    this.empFormDept.set(emp.department || 'General Staff');
    this.empFormRole.set(emp.role || 'Team Member');
    this.showEditModal.set(true);
    this.cdr.markForCheck();
  }

  saveEditEmployee() {
    const emp = this.selectedEmployee();
    const name = this.empFormName().trim();
    if (!emp || !name) return;

    this.actionLoading.set(true);
    const updated: Partial<Employee> = {
      name,
      email: this.empFormEmail().trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      department: this.empFormDept().trim() || 'General Staff',
      role: this.empFormRole().trim() || 'Team Member'
    };

    this.assetService.updateEmployee(emp.id, updated).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showEditModal.set(false);
        this.loadData();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openDeleteModal(emp: Employee) {
    this.selectedEmployee.set(emp);
    this.showDeleteModal.set(true);
    this.cdr.markForCheck();
  }

  confirmDeleteEmployee() {
    const emp = this.selectedEmployee();
    if (!emp) return;

    this.actionLoading.set(true);
    this.assetService.deleteEmployee(emp.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showDeleteModal.set(false);
        this.selectedEmployee.set(null);
        this.loadData();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openAssignedAssetsModal(emp: Employee) {
    this.selectedEmployee.set(emp);
    this.showAssetsModal.set(true);
    this.cdr.markForCheck();
  }

  returnEmployeeAsset(assetId: number, assetCode: string) {
    if (!assetId) return;

    this.returningAssetId.set(assetId);
    this.assetService.returnAsset(assetId, `Returned via Staff Directory for ${assetCode}`).subscribe({
      next: () => {
        this.returningAssetId.set(null);
        // Refresh directory & inventory
        this.loadData();
      },
      error: () => {
        this.returningAssetId.set(null);
        this.cdr.markForCheck();
      }
    });
  }

  exportCSV() {
    const list = this.filteredEmployees();
    if (list.length === 0) return;

    const headers = ['Staff ID', 'Employee Name', 'Corporate Email', 'Department', 'Role', 'Assigned Assets Count'];
    const rows = list.map(e => [
      e.id,
      `"${e.name}"`,
      `"${e.email || ''}"`,
      `"${e.department || 'General Staff'}"`,
      `"${e.role || 'Team Member'}"`,
      e.assigned_assets_count || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staff_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
