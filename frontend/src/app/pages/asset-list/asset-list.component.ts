import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { Asset, Employee } from '../../models/asset.model';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="asset-list-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            IT Asset Inventory
          </h1>
          <p class="page-subtitle">Track, filter, assign, return, and manage enterprise hardware assets.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/assets/new" class="btn btn-primary btn-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Asset</span>
          </a>
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
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Search by asset code or serial number..." 
            class="form-control search-field"
          />
          <button *ngIf="searchQuery" (click)="searchQuery = ''; onSearchChange()" class="clear-btn">&times;</button>
        </div>

        <div class="filters-wrap">
          <!-- Status Filter -->
          <div class="filter-group">
            <label class="filter-label">Status:</label>
            <select [(ngModel)]="selectedStatus" (ngModelChange)="currentPage = 1" class="form-select filter-select">
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <!-- Type / Category Filter -->
          <div class="filter-group">
            <label class="filter-label">Category:</label>
            <select [(ngModel)]="selectedCategory" (ngModelChange)="currentPage = 1" class="form-select filter-select">
              <option value="ALL">All Types</option>
              <option *ngFor="let cat of availableCategories()" [value]="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- Reset Filter Button -->
          <button *ngIf="searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'ALL'" (click)="resetFilters()" class="btn btn-outline btn-sm">
            Reset
          </button>
        </div>
      </div>

      <!-- Asset Inventory Table -->
      <div class="table-responsive">
        <!-- Loading State -->
        <div *ngIf="loading()" class="state-box">
          <div class="spinner"></div>
          <p style="margin-top: 1rem;">Loading inventory from PostgreSQL database...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredAssets().length === 0" class="state-box">
          <div class="state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="15" x2="16" y2="15"></line>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </div>
          <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.25rem;">No assets found</h3>
          <p style="font-size: 0.875rem;">Try adjusting your search criteria or register a new asset.</p>
          <a routerLink="/assets/new" class="btn btn-primary btn-sm" style="margin-top: 1rem;">Add First Asset</a>
        </div>

        <!-- Populated Table -->
        <table class="table" *ngIf="!loading() && filteredAssets().length > 0">
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Serial Number</th>
              <th>Purchase Date</th>
              <th>Status</th>
              <th>Assigned Employee</th>
              <th>Location</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of paginatedAssets()">
              <td>
                <span class="code-font">{{ item.asset_code }}</span>
              </td>
              <td>
                <strong style="color: #fff;">{{ item.asset_name }}</strong>
              </td>
              <td>{{ item.category || '—' }}</td>
              <td>
                <span class="code-font" style="font-size: 0.75rem;">{{ item.serial_number || '—' }}</span>
              </td>
              <td style="color: var(--text-dim);">
                {{ item.purchase_date || '—' }}
              </td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <div *ngIf="item.assigned_to" class="assigned-user">
                  <div class="user-avatar-mini">{{ item.assigned_to.charAt(0).toUpperCase() }}</div>
                  <span>{{ item.assigned_to }}</span>
                </div>
                <span *ngIf="!item.assigned_to" style="color: var(--text-dim);">Unassigned</span>
              </td>
              <td style="color: var(--text-dim);">
                {{ item.location || '—' }}
              </td>
              <td style="text-align: right;">
                <div class="action-dropdown-wrap">
                  <!-- View Details -->
                  <button (click)="openViewModal(item)" class="action-btn" title="View Details">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>

                  <!-- Edit -->
                  <a [routerLink]="['/assets/edit', item.id]" class="action-btn" title="Edit Asset">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </a>

                  <!-- Assign (Enabled only if Available) -->
                  <button 
                    *ngIf="item.status === 'Available'"
                    (click)="openAssignModal(item)" 
                    class="action-btn assign-btn" 
                    title="Assign to Employee"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="19" y1="8" x2="19" y2="14"></line>
                      <line x1="22" y1="11" x2="16" y2="11"></line>
                    </svg>
                  </button>

                  <!-- Return (Enabled only if Assigned) -->
                  <button 
                    *ngIf="item.status === 'Assigned'" 
                    (click)="openReturnModal(item)" 
                    class="action-btn return-btn" 
                    title="Return Asset"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 14 4 9 9 4"></polyline>
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                    </svg>
                  </button>

                  <!-- Mark For Repair -->
                  <button 
                    *ngIf="item.status !== 'Under Repair' && item.status !== 'Retired'" 
                    (click)="markForRepair(item)" 
                    class="action-btn repair-btn" 
                    title="Mark For Repair"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                  </button>

                  <!-- Retire -->
                  <button 
                    *ngIf="item.status !== 'Retired'" 
                    (click)="retireAsset(item)" 
                    class="action-btn retire-btn" 
                    title="Retire Asset"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                    </svg>
                  </button>

                  <!-- Delete -->
                  <button (click)="openDeleteModal(item)" class="action-btn delete-btn" title="Delete Asset">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-footer" *ngIf="filteredAssets().length > 0">
          <div class="pagination-info">
            Showing 
            <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> 
            to 
            <strong>{{ mathMin(currentPage * pageSize, filteredAssets().length) }}</strong> 
            of 
            <strong>{{ filteredAssets().length }}</strong> assets
          </div>

          <div class="pagination-controls">
            <button 
              class="btn btn-secondary btn-sm" 
              [disabled]="currentPage === 1"
              (click)="currentPage = currentPage - 1"
            >
              Previous
            </button>
            <span class="page-indicator">Page {{ currentPage }} of {{ totalPages() }}</span>
            <button 
              class="btn btn-secondary btn-sm" 
              [disabled]="currentPage >= totalPages()"
              (click)="currentPage = currentPage + 1"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW ASSET DETAILS MODAL -->
      <div class="modal-backdrop" *ngIf="viewModalAsset" (click)="viewModalAsset = null">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Asset Details</h3>
            <button class="modal-close" (click)="viewModalAsset = null">&times;</button>
          </div>
          <div class="modal-body" *ngIf="viewModalAsset">
            <div class="detail-hero">
              <div>
                <span class="code-font" style="font-size: 0.9rem;">{{ viewModalAsset.asset_code }}</span>
                <h2 style="color: #fff; font-size: 1.3rem; margin-top: 0.25rem;">{{ viewModalAsset.asset_name }}</h2>
              </div>
              <span class="badge" [ngClass]="getStatusBadgeClass(viewModalAsset.status)">
                {{ viewModalAsset.status }}
              </span>
            </div>

            <div class="detail-grid">
              <div class="detail-cell">
                <span class="detail-label">Category / Type</span>
                <span class="detail-val">{{ viewModalAsset.category || 'Not specified' }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">Serial Number</span>
                <span class="detail-val code-font">{{ viewModalAsset.serial_number || 'N/A' }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">Assigned Employee</span>
                <span class="detail-val" style="color: #38bdf8;">{{ viewModalAsset.assigned_to || 'None (Available)' }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">Location</span>
                <span class="detail-val">{{ viewModalAsset.location || 'Main Office' }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">Purchase Date</span>
                <span class="detail-val">{{ viewModalAsset.purchase_date || 'N/A' }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">System Record Created</span>
                <span class="detail-val">{{ viewModalAsset.created_at | date:'medium' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <a [routerLink]="['/assets/edit', viewModalAsset?.id]" class="btn btn-secondary btn-sm" (click)="viewModalAsset = null">
              Edit Details
            </a>
            <button class="btn btn-primary btn-sm" (click)="viewModalAsset = null">Close</button>
          </div>
        </div>
      </div>

      <!-- CONFIRM DELETE MODAL -->
      <div class="modal-backdrop" *ngIf="deleteModalAsset" (click)="deleteModalAsset = null">
        <div class="modal-dialog modal-danger" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title" style="color: #ef4444;">Confirm Asset Deletion</h3>
            <button class="modal-close" (click)="deleteModalAsset = null">&times;</button>
          </div>
          <div class="modal-body" *ngIf="deleteModalAsset">
            <p>Are you sure you want to permanently delete asset <strong style="color: #fff;">{{ deleteModalAsset.asset_code }} ({{ deleteModalAsset.asset_name }})</strong> from PostgreSQL?</p>
            <p style="color: #f87171; font-size: 0.8125rem; margin-top: 0.5rem;">This action cannot be undone and will delete associated audit history records.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="deleteModalAsset = null">Cancel</button>
            <button class="btn btn-danger btn-sm" (click)="confirmDelete()" [disabled]="actionLoading">
              {{ actionLoading ? 'Deleting...' : 'Delete Permanently' }}
            </button>
          </div>
        </div>
      </div>

      <!-- RETURN ASSET MODAL -->
      <div class="modal-backdrop" *ngIf="returnModalAsset" (click)="returnModalAsset = null">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Confirm Asset Return</h3>
            <button class="modal-close" (click)="returnModalAsset = null">&times;</button>
          </div>
          <div class="modal-body" *ngIf="returnModalAsset">
            <p>You are returning asset <strong style="color: #fff;">{{ returnModalAsset.asset_code }}</strong> currently assigned to <strong style="color: #38bdf8;">{{ returnModalAsset.assigned_to }}</strong>.</p>
            <p style="color: var(--text-dim); font-size: 0.8125rem; margin-top: 0.25rem;">This asset will be restored to 'Available' stock.</p>
            
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Return Condition / Notes:</label>
              <textarea [(ngModel)]="returnNotes" class="form-control" rows="3" placeholder="Condition verified, all accessories intact..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="returnModalAsset = null">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="confirmReturn()" [disabled]="actionLoading">
              {{ actionLoading ? 'Processing...' : 'Confirm Return' }}
            </button>
          </div>
        </div>
      </div>

      <!-- QUICK ASSIGN MODAL -->
      <div class="modal-backdrop" *ngIf="assignModalAsset" (click)="assignModalAsset = null">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Assign Asset to Employee</h3>
            <button class="modal-close" (click)="assignModalAsset = null">&times;</button>
          </div>
          <div class="modal-body" *ngIf="assignModalAsset">
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-md);">
              <span class="code-font">{{ assignModalAsset.asset_code }}</span>
              <div style="color: #fff; font-weight: 600; margin-top: 2px;">{{ assignModalAsset.asset_name }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Select Employee <span class="required">*</span></label>
              <select [(ngModel)]="assignEmployee" class="form-select">
                <option value="">-- Choose Employee --</option>
                <option *ngFor="let emp of employeesList" [value]="emp.name">
                  {{ emp.name }} ({{ emp.department || 'General' }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Assignment Notes:</label>
              <input type="text" [(ngModel)]="assignNotes" class="form-control" placeholder="Workstation deployment, project allocation..." />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="assignModalAsset = null">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="confirmAssign()" [disabled]="!assignEmployee || actionLoading">
              {{ actionLoading ? 'Assigning...' : 'Complete Assignment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
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
      font-size: 1.2rem;
      cursor: pointer;
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
    }

    .filter-select {
      width: auto;
      min-width: 140px;
      padding: 0.45rem 0.75rem;
      font-size: 0.8125rem;
    }

    .assigned-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-avatar-mini {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      font-size: 0.6875rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-dropdown-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      background: var(--bg-card-hover);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .assign-btn:hover {
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.4);
    }

    .return-btn:hover {
      color: #34d399;
      border-color: rgba(52, 211, 153, 0.4);
    }

    .repair-btn:hover {
      color: #fbbf24;
      border-color: rgba(251, 191, 36, 0.4);
    }

    .retire-btn:hover {
      color: #94a3b8;
      border-color: rgba(148, 163, 184, 0.4);
    }

    .delete-btn:hover {
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.4);
    }

    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-card);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .pagination-info {
      font-size: 0.8125rem;
      color: var(--text-dim);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-indicator {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Modal Backdrop */
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
      max-width: 520px;
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

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
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

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .detail-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .detail-cell {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .detail-val {
      font-size: 0.9375rem;
      color: #fff;
      margin-top: 0.2rem;
    }
  `]
})
export class AssetListComponent implements OnInit {
  private assetService = inject(AssetService);
  private router = inject(Router);

  public assets = signal<Asset[]>([]);
  public loading = signal<boolean>(false);
  public actionLoading = false;

  // Search & Filter State
  public searchQuery = '';
  public selectedStatus = 'ALL';
  public selectedCategory = 'ALL';

  // Pagination State
  public currentPage = 1;
  public pageSize = 8;

  // Modals
  public viewModalAsset: Asset | null = null;
  public deleteModalAsset: Asset | null = null;
  public returnModalAsset: Asset | null = null;
  public assignModalAsset: Asset | null = null;

  public returnNotes = '';
  public assignEmployee = '';
  public assignNotes = '';
  public employeesList: Employee[] = [];

  ngOnInit() {
    this.loadAssets();
    this.loadEmployees();
  }

  loadAssets() {
    this.loading.set(true);
    this.assetService.getAssets().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadEmployees() {
    this.assetService.getEmployees().subscribe({
      next: (res) => {
        this.employeesList = res.employees;
      }
    });
  }

  availableCategories(): string[] {
    const list = this.assets().map(a => a.category).filter(Boolean);
    return Array.from(new Set(list));
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedStatus = 'ALL';
    this.selectedCategory = 'ALL';
    this.currentPage = 1;
  }

  filteredAssets(): Asset[] {
    return this.assets().filter(item => {
      // Search by code or serial
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.asset_code.toLowerCase().includes(q) || 
        (item.serial_number && item.serial_number.toLowerCase().includes(q)) ||
        item.asset_name.toLowerCase().includes(q);

      // Filter by status
      const matchStatus = this.selectedStatus === 'ALL' || item.status === this.selectedStatus;

      // Filter by category
      const matchCat = this.selectedCategory === 'ALL' || item.category === this.selectedCategory;

      return matchSearch && matchStatus && matchCat;
    });
  }

  paginatedAssets(): Asset[] {
    const filtered = this.filteredAssets();
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredAssets().length / this.pageSize) || 1;
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available': return 'badge-available';
      case 'Assigned': return 'badge-assigned';
      case 'Under Repair': return 'badge-repair';
      case 'Retired': return 'badge-retired';
      default: return 'badge-available';
    }
  }

  // Modal Triggers
  openViewModal(asset: Asset) {
    this.viewModalAsset = asset;
  }

  openDeleteModal(asset: Asset) {
    this.deleteModalAsset = asset;
  }

  confirmDelete() {
    if (!this.deleteModalAsset) return;
    this.actionLoading = true;
    this.assetService.deleteAsset(this.deleteModalAsset.id).subscribe({
      next: () => {
        this.actionLoading = false;
        this.deleteModalAsset = null;
        this.loadAssets();
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  openReturnModal(asset: Asset) {
    this.returnModalAsset = asset;
    this.returnNotes = '';
  }

  confirmReturn() {
    if (!this.returnModalAsset) return;
    this.actionLoading = true;
    this.assetService.returnAsset(this.returnModalAsset.id, this.returnNotes).subscribe({
      next: () => {
        this.actionLoading = false;
        this.returnModalAsset = null;
        this.loadAssets();
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  openAssignModal(asset: Asset) {
    this.assignModalAsset = asset;
    this.assignEmployee = '';
    this.assignNotes = '';
  }

  confirmAssign() {
    if (!this.assignModalAsset || !this.assignEmployee) return;
    this.actionLoading = true;
    this.assetService.assignAsset(this.assignModalAsset.id, this.assignEmployee, this.assignNotes).subscribe({
      next: () => {
        this.actionLoading = false;
        this.assignModalAsset = null;
        this.loadAssets();
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  markForRepair(asset: Asset) {
    if (confirm(`Mark ${asset.asset_code} (${asset.asset_name}) for repair?`)) {
      this.assetService.markForRepair(asset.id).subscribe({
        next: () => this.loadAssets()
      });
    }
  }

  retireAsset(asset: Asset) {
    if (confirm(`Decommission and retire asset ${asset.asset_code}?`)) {
      this.assetService.retireAsset(asset.id).subscribe({
        next: () => this.loadAssets()
      });
    }
  }
}
