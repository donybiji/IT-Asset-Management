import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AssetService } from '../../services/asset.service';
import { Asset, Employee, AssetHistory } from '../../models/asset.model';

@Component({
  selector: 'app-assign-asset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="assign-asset-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Asset Allocation & Assignment
          </h1>
          <p class="page-subtitle">Allocate available hardware assets to staff members and record audit trail.</p>
        </div>

        <div class="header-actions">
          <span class="count-pill">
            <span class="pulse-dot"></span>
            {{ availableAssets().length }} Available in stock
          </span>
          <a routerLink="/assets" class="btn btn-secondary btn-sm">
            &larr; View Inventory
          </a>
        </div>
      </div>

      <!-- Main Layout: Form + Recent Assignments -->
      <div class="assign-grid">
        <!-- Assignment Form Card -->
        <div class="card assign-container">
          <!-- Error / Conflict Alert Banner -->
          <div *ngIf="conflictError()" class="conflict-banner animate-fade-in">
            <div class="alert-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="alert-content">
              <strong>Allocation Conflict:</strong>
              <p>{{ conflictError() }}</p>
            </div>
            <button class="alert-dismiss" (click)="conflictError.set(null)">&times;</button>
          </div>

          <!-- Success Banner -->
          <div *ngIf="successMessage()" class="success-banner animate-fade-in">
            <div class="alert-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="alert-content">
              <strong>Assignment Confirmed!</strong>
              <p>{{ successMessage() }}</p>
              <div class="success-actions">
                <button type="button" class="btn btn-sm btn-outline" (click)="resetForm()">Assign Another Asset</button>
                <a routerLink="/assets" class="btn btn-sm btn-primary">Check Asset List &rarr;</a>
              </div>
            </div>
            <button class="alert-dismiss" (click)="successMessage.set(null)">&times;</button>
          </div>

          <!-- Loading State -->
          <div *ngIf="loadingData()" class="state-box">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Loading available hardware assets and employee directory...</p>
          </div>

          <!-- Assignment Form -->
          <form *ngIf="!loadingData()" (ngSubmit)="onAssignSubmit()" #assignForm="ngForm">
            <!-- Step 1: Asset Selection -->
            <div class="form-group">
              <div class="section-label-row">
                <label class="form-label" for="selectedAssetId">
                  <span class="step-num">1</span>
                  Select Hardware Asset <span class="required">*</span>
                </label>
                <span class="stock-badge" [class.stock-empty]="availableAssets().length === 0">
                  {{ availableAssets().length }} In Stock
                </span>
              </div>

              <!-- Warning if no assets are available -->
              <div *ngIf="availableAssets().length === 0" class="no-assets-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <strong>No available assets in inventory.</strong>
                  <p>All assets are currently allocated, under repair, or retired. Return an assigned asset or register a new one to proceed.</p>
                  <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                    <a routerLink="/assets/new" class="btn btn-xs btn-primary">+ Register New Asset</a>
                    <a routerLink="/assets" class="btn btn-xs btn-outline">Browse Inventory</a>
                  </div>
                </div>
              </div>

              <select 
                *ngIf="availableAssets().length > 0"
                id="selectedAssetId"
                name="selectedAssetId"
                [ngModel]="selectedAssetId()" 
                (ngModelChange)="onAssetSelected($event)"
                required 
                class="form-select custom-select"
              >
                <option [ngValue]="null">-- Choose hardware asset to assign --</option>
                <option *ngFor="let asset of availableAssets()" [ngValue]="asset.id">
                  [{{ asset.asset_code }}] {{ asset.asset_name }} • {{ asset.category }} (SN: {{ asset.serial_number || 'N/A' }})
                </option>
              </select>
            </div>

            <!-- Selected Asset Preview Card -->
            <div *ngIf="selectedAsset()" class="preview-card animate-fade-in">
              <div class="preview-header">
                <div>
                  <span class="code-font">{{ selectedAsset()!.asset_code }}</span>
                  <div class="preview-name">{{ selectedAsset()!.asset_name }}</div>
                </div>
                <span class="badge badge-available">
                  <span class="pulse-dot-green"></span>
                  Ready For Allocation
                </span>
              </div>
              <div class="preview-grid">
                <div>
                  <span class="preview-lbl">Hardware Category</span>
                  <span class="preview-val">{{ selectedAsset()!.category }}</span>
                </div>
                <div>
                  <span class="preview-lbl">Serial Number</span>
                  <span class="preview-val code-font">{{ selectedAsset()!.serial_number || 'N/A' }}</span>
                </div>
                <div>
                  <span class="preview-lbl">Current Location</span>
                  <span class="preview-val">{{ selectedAsset()!.location || 'Main IT Storage Room' }}</span>
                </div>
                <div>
                  <span class="preview-lbl">Procurement Date</span>
                  <span class="preview-val">{{ selectedAsset()!.purchase_date || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Step 2: Employee Selection -->
            <div class="form-group" style="margin-top: 1.75rem;">
              <div class="section-label-row">
                <label class="form-label" for="selectedEmployee">
                  <span class="step-num">2</span>
                  Assign To Staff Member <span class="required">*</span>
                </label>
                <button type="button" (click)="openQuickAddModal()" class="quick-add-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Quick Add Staff Member</span>
                </button>
              </div>

              <select 
                id="selectedEmployee"
                name="selectedEmployee"
                [ngModel]="selectedEmployee()" 
                (ngModelChange)="selectedEmployee.set($event); conflictError.set(null)"
                required 
                class="form-select custom-select"
              >
                <option value="">-- Choose employee recipient --</option>
                <option *ngFor="let emp of employees()" [value]="emp.name">
                  {{ emp.name }} • {{ emp.department || 'Staff' }} ({{ emp.role || 'Member' }}) [{{ emp.assigned_assets_count || 0 }} currently assigned]
                </option>
              </select>
            </div>

            <!-- Step 3: Assignment Notes -->
            <div class="form-group" style="margin-top: 1.75rem;">
              <label class="form-label" for="notes">
                <span class="step-num">3</span>
                Allocation Notes & Department Usage (Optional)
              </label>
              <textarea 
                id="notes"
                name="notes"
                [ngModel]="notes()" 
                (ngModelChange)="notes.set($event)"
                rows="3" 
                class="form-control"
                placeholder="e.g. Standard workstation equipment issued for software engineering team onboarding."
              ></textarea>
            </div>

            <!-- Submission Actions -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="resetForm()"
                [disabled]="submitting()"
              >
                Reset
              </button>
              <button 
                type="submit" 
                class="btn btn-primary btn-submit"
                [disabled]="!selectedAssetId() || !selectedEmployee() || submitting() || availableAssets().length === 0"
              >
                <span *ngIf="submitting()" class="spinner-sm"></span>
                <span>{{ submitting() ? 'Recording Assignment...' : 'Confirm & Save Assignment' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Recent Assignments & Live Audit Feed -->
        <div class="card recent-container">
          <div class="recent-header">
            <div class="recent-title-group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <h3>Recent Allocations</h3>
            </div>
            <a routerLink="/history" class="view-history-link">Full Audit Trail &rarr;</a>
          </div>

          <div *ngIf="loadingRecent()" class="state-box-sm">
            <div class="spinner-sm"></div>
            <span>Updating history...</span>
          </div>

          <div *ngIf="!loadingRecent() && recentAssignments().length === 0" class="empty-recent">
            <p>No recent assignments recorded yet.</p>
          </div>

          <div *ngIf="!loadingRecent() && recentAssignments().length > 0" class="recent-list">
            <div *ngFor="let item of recentAssignments()" class="recent-item">
              <div class="recent-item-main">
                <div class="recent-badge-row">
                  <span class="code-font recent-code">{{ item.asset_code }}</span>
                  <span class="recent-date">{{ item.action_date | date:'mediumDate' }}</span>
                </div>
                <div class="recent-recipient">
                  <div class="avatar-tiny">{{ (item.employee || 'E').charAt(0).toUpperCase() }}</div>
                  <strong>{{ item.employee || 'Unknown Staff' }}</strong>
                </div>
                <div *ngIf="item.notes" class="recent-note">{{ item.notes }}</div>
              </div>
              <div class="recent-item-action">
                <button 
                  type="button"
                  class="btn btn-xs btn-outline return-btn"
                  (click)="quickReturnAsset(item.asset_id, item.asset_code)"
                  [disabled]="returningAssetId() === item.asset_id"
                  title="Return this asset back to available stock"
                >
                  <span *ngIf="returningAssetId() === item.asset_id" class="spinner-sm"></span>
                  <span>{{ returningAssetId() === item.asset_id ? 'Returning...' : 'Return' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- QUICK ADD EMPLOYEE MODAL -->
      <div class="modal-backdrop" *ngIf="showQuickAddModal()" (click)="showQuickAddModal.set(false)">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <h3>Quick Add Staff Member</h3>
            </div>
            <button class="modal-close" (click)="showQuickAddModal.set(false)">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-sub">Register a new employee into the PostgreSQL staff directory to assign equipment.</p>
            
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input 
                type="text" 
                [ngModel]="newEmpName()" 
                (ngModelChange)="newEmpName.set($event)" 
                placeholder="e.g. David Miller" 
                class="form-control" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label">Corporate Email</label>
              <input 
                type="email" 
                [ngModel]="newEmpEmail()" 
                (ngModelChange)="newEmpEmail.set($event)" 
                placeholder="e.g. d.miller@company.com" 
                class="form-control" 
              />
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Department</label>
                <input 
                  type="text" 
                  [ngModel]="newEmpDept()" 
                  (ngModelChange)="newEmpDept.set($event)" 
                  placeholder="e.g. Engineering" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Role / Job Title</label>
                <input 
                  type="text" 
                  [ngModel]="newEmpRole()" 
                  (ngModelChange)="newEmpRole.set($event)" 
                  placeholder="e.g. QA Engineer" 
                  class="form-control" 
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showQuickAddModal.set(false)">Cancel</button>
            <button 
              class="btn btn-primary btn-sm" 
              (click)="quickSaveEmployee()" 
              [disabled]="!newEmpName().trim() || addingEmployee()"
            >
              <span *ngIf="addingEmployee()" class="spinner-sm"></span>
              <span>{{ addingEmployee() ? 'Saving Staff...' : 'Save & Select' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .assign-asset-page {
      max-width: 1300px;
      margin: 0 auto;
    }

    .count-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulseDot 2s infinite;
    }

    .pulse-dot-green {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      margin-right: 4px;
    }

    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .assign-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .assign-grid {
        grid-template-columns: 1fr;
      }
    }

    .assign-container {
      padding: 2.25rem;
    }

    @media (max-width: 640px) {
      .assign-container {
        padding: 1.5rem;
      }
    }

    .section-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      margin-right: 0.5rem;
    }

    .stock-badge {
      font-size: 0.75rem;
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .stock-badge.stock-empty {
      color: #f87171;
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .quick-add-link {
      background: none;
      border: none;
      color: #818cf8;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0;
      transition: color 0.15s;
    }
    .quick-add-link:hover {
      color: #a5b4fc;
      text-decoration: underline;
    }

    .custom-select {
      height: 44px;
      font-size: 0.9375rem;
    }

    .no-assets-warning {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      color: #fde68a;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      font-size: 0.875rem;
      line-height: 1.45;
    }
    .no-assets-warning p {
      margin-top: 0.25rem;
      color: #e2e8f0;
      font-size: 0.8125rem;
    }

    .preview-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-top: 1rem;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .preview-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-top: 2px;
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.85rem;
    }

    .preview-lbl {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-dim);
    }

    .preview-val {
      font-size: 0.875rem;
      color: #e2e8f0;
      margin-top: 2px;
      font-weight: 500;
    }

    .conflict-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: var(--radius-md);
      padding: 1.1rem 1.25rem;
      color: #fca5a5;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1.75rem;
      position: relative;
    }
    .conflict-banner p {
      margin-top: 0.25rem;
      color: #fecaca;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      color: #6ee7b7;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1.75rem;
      position: relative;
    }
    .success-banner p {
      margin-top: 0.25rem;
      color: #d1fae5;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .alert-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-content {
      flex: 1;
    }

    .alert-dismiss {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.4rem;
      cursor: pointer;
      line-height: 1;
      opacity: 0.7;
      padding: 0 0.25rem;
    }
    .alert-dismiss:hover {
      opacity: 1;
    }

    .success-actions {
      display: flex;
      gap: 0.6rem;
      margin-top: 0.85rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-subtle);
    }

    .btn-submit {
      min-width: 220px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .spinner-sm {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Recent Allocations Card */
    .recent-container {
      padding: 1.5rem;
    }

    .recent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .recent-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #fff;
    }
    .recent-title-group h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .view-history-link {
      font-size: 0.75rem;
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
    }
    .view-history-link:hover {
      color: #a5b4fc;
      text-decoration: underline;
    }

    .empty-recent {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.875rem;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .recent-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      transition: background 0.15s, border-color 0.15s;
    }
    .recent-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .recent-item-main {
      flex: 1;
      min-width: 0;
    }

    .recent-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .recent-code {
      font-size: 0.75rem;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.1);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .recent-date {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    .recent-recipient {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #fff;
    }

    .avatar-tiny {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4f46e5;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .recent-note {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .return-btn {
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.3);
      padding: 0.25rem 0.55rem;
      font-size: 0.75rem;
    }
    .return-btn:hover:not(:disabled) {
      background: rgba(52, 211, 153, 0.1);
      border-color: #34d399;
      color: #6ee7b7;
    }

    .state-box-sm {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem;
      font-size: 0.8125rem;
      color: var(--text-dim);
    }

    /* Modal Backdrop & Dialog */
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

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  `]
})
export class AssignAssetComponent implements OnInit {
  private assetService = inject(AssetService);
  private cdr = inject(ChangeDetectorRef);

  // Reactive State Signals
  public availableAssets = signal<Asset[]>([]);
  public employees = signal<Employee[]>([]);
  public selectedAssetId = signal<number | null>(null);
  public selectedEmployee = signal<string>('');
  public notes = signal<string>('');

  public loadingData = signal<boolean>(true);
  public loadingRecent = signal<boolean>(false);
  public submitting = signal<boolean>(false);
  public returningAssetId = signal<number | null>(null);
  public conflictError = signal<string | null>(null);
  public successMessage = signal<string | null>(null);

  // Recent assignments feed
  public recentAssignments = signal<AssetHistory[]>([]);

  // Quick Add Employee Modal State
  public showQuickAddModal = signal<boolean>(false);
  public newEmpName = signal<string>('');
  public newEmpEmail = signal<string>('');
  public newEmpDept = signal<string>('');
  public newEmpRole = signal<string>('');
  public addingEmployee = signal<boolean>(false);

  // Computed selected asset object
  public selectedAsset = computed(() => {
    const id = this.selectedAssetId();
    if (!id) return null;
    return this.availableAssets().find(a => a.id === id) || null;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData(showFullLoading = true) {
    if (showFullLoading) {
      this.loadingData.set(true);
    }
    this.conflictError.set(null);

    forkJoin({
      assets: this.assetService.getAssets(),
      employeesRes: this.assetService.getEmployees(),
      history: this.assetService.getAssetHistory(undefined, undefined, 'Assigned', 6)
    }).subscribe({
      next: ({ assets, employeesRes, history }) => {
        this.availableAssets.set((assets || []).filter(a => a.status === 'Available'));
        this.employees.set(employeesRes.employees || []);
        this.recentAssignments.set(history || []);
        this.loadingData.set(false);
        this.loadingRecent.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingData.set(false);
        this.loadingRecent.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onAssetSelected(assetId: number | null) {
    this.selectedAssetId.set(assetId);
    this.conflictError.set(null);
    this.cdr.markForCheck();
  }

  resetForm() {
    this.selectedAssetId.set(null);
    this.selectedEmployee.set('');
    this.notes.set('');
    this.conflictError.set(null);
    this.successMessage.set(null);
    this.cdr.markForCheck();
  }

  onAssignSubmit() {
    const assetId = this.selectedAssetId();
    const employee = this.selectedEmployee().trim();

    if (!assetId || !employee) {
      return;
    }

    // Pre-flight validation against current loaded state
    const targetAsset = this.availableAssets().find(a => a.id === assetId);
    if (!targetAsset || targetAsset.status !== 'Available') {
      this.conflictError.set(`Asset conflict: This hardware item is currently ${targetAsset?.status || 'Unavailable'} and cannot be assigned.`);
      return;
    }

    this.submitting.set(true);
    this.conflictError.set(null);
    this.successMessage.set(null);

    this.assetService.assignAsset(assetId, employee, this.notes()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.successMessage.set(`Asset ${targetAsset.asset_code} ("${targetAsset.asset_name}") successfully allocated to ${employee}.`);
        this.selectedAssetId.set(null);
        this.selectedEmployee.set('');
        this.notes.set('');
        
        // Refresh data in background to update available inventory & recent feed
        this.loadData(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 409) {
          const detail = typeof err.error === 'string' ? err.error : (err.error?.message || 'The asset was already allocated or is no longer in available status.');
          this.conflictError.set(detail);
        } else {
          const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Failed to submit assignment. Please verify server connection.');
          this.conflictError.set(msg);
        }
        this.cdr.markForCheck();
      }
    });
  }

  openQuickAddModal() {
    this.newEmpName.set('');
    this.newEmpEmail.set('');
    this.newEmpDept.set('General Staff');
    this.newEmpRole.set('Team Member');
    this.showQuickAddModal.set(true);
    this.cdr.markForCheck();
  }

  quickSaveEmployee() {
    const name = this.newEmpName().trim();
    if (!name) return;

    this.addingEmployee.set(true);
    const newEmpData: Partial<Employee> = {
      name,
      email: this.newEmpEmail().trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      department: this.newEmpDept().trim() || 'General Staff',
      role: this.newEmpRole().trim() || 'Team Member'
    };

    this.assetService.createEmployee(newEmpData).subscribe({
      next: (created) => {
        this.addingEmployee.set(false);
        this.showQuickAddModal.set(false);
        
        // Add to employees list and auto-select
        this.employees.update(list => [...list, created]);
        this.selectedEmployee.set(created.name);
        this.cdr.markForCheck();
      },
      error: () => {
        this.addingEmployee.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  quickReturnAsset(assetId: number, assetCode: string) {
    if (!assetId) return;

    this.returningAssetId.set(assetId);
    this.loadingRecent.set(true);

    this.assetService.returnAsset(assetId, `Returned via Allocation Console for ${assetCode}`).subscribe({
      next: () => {
        this.returningAssetId.set(null);
        // Refresh assets and recent allocations
        this.loadData(false);
      },
      error: () => {
        this.returningAssetId.set(null);
        this.loadingRecent.set(false);
        this.cdr.markForCheck();
      }
    });
  }
}
