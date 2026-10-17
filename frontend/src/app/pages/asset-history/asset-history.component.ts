import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetHistory } from '../../models/asset.model';

@Component({
  selector: 'app-asset-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Asset Audit & Movement History
          </h1>
          <p class="page-subtitle">Track lifecycle events, allocations, returns, and maintenance history directly from PostgreSQL.</p>
        </div>

        <div class="header-actions">
          <button (click)="exportCSV()" class="btn btn-outline btn-sm" [disabled]="loading() || filteredHistory().length === 0" title="Export audit trail to CSV file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>

          <button (click)="loadData()" class="btn btn-secondary btn-sm" [disabled]="loading()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.spinner]="loading()">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{{ loading() ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="metrics-row" *ngIf="!loading()">
        <div class="metric-card" (click)="selectedAction.set('ALL'); currentPage.set(1)">
          <span class="metric-label">Total Events</span>
          <span class="metric-num">{{ historyRecords().length }}</span>
        </div>
        <div class="metric-card" (click)="selectedAction.set('Assigned'); currentPage.set(1)" [class.active-metric]="selectedAction() === 'Assigned'">
          <span class="metric-label">Allocations</span>
          <span class="metric-num text-assigned">{{ countByAction('Assigned') }}</span>
        </div>
        <div class="metric-card" (click)="selectedAction.set('Returned'); currentPage.set(1)" [class.active-metric]="selectedAction() === 'Returned'">
          <span class="metric-label">Returns</span>
          <span class="metric-num text-available">{{ countByAction('Returned') }}</span>
        </div>
        <div class="metric-card" (click)="selectedAction.set('Created'); currentPage.set(1)" [class.active-metric]="selectedAction() === 'Created'">
          <span class="metric-label">Registrations</span>
          <span class="metric-num text-created">{{ countByAction('Created') }}</span>
        </div>
        <div class="metric-card" (click)="selectedAction.set('Under Repair'); currentPage.set(1)" [class.active-metric]="selectedAction() === 'Under Repair'">
          <span class="metric-label">Maintenance</span>
          <span class="metric-num text-repair">{{ countByAction('Under Repair') }}</span>
        </div>
      </div>

      <!-- Filter Controls Toolbar -->
      <div class="card filter-bar">
        <div class="search-input-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            [ngModel]="searchFilter()" 
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by asset code, name, employee or notes..." 
            class="form-control search-field"
          />
          <button *ngIf="searchFilter()" class="clear-btn" (click)="onSearchChange('')">&times;</button>
        </div>

        <div class="filters-wrap">
          <!-- Asset Selector -->
          <div class="filter-group">
            <label class="filter-label" for="assetFilter">Hardware Asset:</label>
            <select 
              id="assetFilter"
              [ngModel]="selectedAssetCode()" 
              (ngModelChange)="selectedAssetCode.set($event); currentPage.set(1)" 
              class="form-select filter-select"
            >
              <option value="ALL">All Hardware Assets</option>
              <option *ngFor="let a of allAssets()" [value]="a.asset_code">
                [{{ a.asset_code }}] {{ a.asset_name }}
              </option>
            </select>
          </div>

          <!-- Action Type Selector -->
          <div class="filter-group">
            <label class="filter-label" for="actionFilter">Action Type:</label>
            <select 
              id="actionFilter"
              [ngModel]="selectedAction()" 
              (ngModelChange)="selectedAction.set($event); currentPage.set(1)" 
              class="form-select filter-select"
            >
              <option value="ALL">All Action Types</option>
              <option value="Created">Created</option>
              <option value="Assigned">Assigned</option>
              <option value="Returned">Returned</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Retired">Retired</option>
              <option value="Updated">Updated</option>
            </select>
          </div>

          <!-- Reset Filter Button -->
          <button 
            *ngIf="searchFilter() || selectedAssetCode() !== 'ALL' || selectedAction() !== 'ALL'"
            type="button" 
            (click)="resetFilters()" 
            class="btn btn-secondary btn-sm"
            title="Reset all filters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- History Table Container -->
      <div class="card table-container">
        <!-- Loading State -->
        <div *ngIf="loading()" class="state-box">
          <div class="spinner"></div>
          <p style="margin-top: 1rem; color: var(--text-muted);">Loading audit history from PostgreSQL database...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredHistory().length === 0" class="state-box">
          <div class="state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.25rem;">No audit records match your filters</h3>
          <p style="font-size: 0.875rem; color: var(--text-dim);">Try clearing your search term or selecting a different action filter.</p>
          <div style="margin-top: 1rem;">
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()">Reset All Filters</button>
          </div>
        </div>

        <!-- History Records Table -->
        <div class="table-responsive" *ngIf="!loading() && filteredHistory().length > 0">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 70px;">Log ID</th>
                <th style="width: 140px;">Action Type</th>
                <th>Hardware Asset</th>
                <th>Staff Involved</th>
                <th style="width: 200px;">Date & Time</th>
                <th>Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of paginatedHistory()" class="history-row">
                <td class="log-id">#{{ record.id }}</td>
                <td>
                  <span class="badge" [ngClass]="getActionBadgeClass(record.action_type)">
                    <span class="action-symbol">{{ getActionIcon(record.action_type) }}</span>
                    {{ record.action_type }}
                  </span>
                </td>
                <td>
                  <div class="asset-cell">
                    <span class="code-font">{{ record.asset_code }}</span>
                    <span *ngIf="record.asset_name" class="asset-name-sub">{{ record.asset_name }}</span>
                  </div>
                </td>
                <td>
                  <div *ngIf="record.employee" class="employee-pill">
                    <div class="avatar-tiny">{{ record.employee.charAt(0).toUpperCase() }}</div>
                    <span>{{ record.employee }}</span>
                  </div>
                  <span *ngIf="!record.employee" class="empty-dash">—</span>
                </td>
                <td class="date-cell">
                  <div class="date-main">{{ record.action_date | date:'mediumDate' }}</div>
                  <div class="time-sub">{{ record.action_date | date:'shortTime' }}</div>
                </td>
                <td class="notes-cell">
                  <span>{{ record.notes || '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="pagination-footer" *ngIf="!loading() && filteredHistory().length > 0">
          <div class="pagination-info">
            Showing 
            <strong>{{ (currentPage() - 1) * pageSize() + 1 }}</strong> 
            to 
            <strong>{{ mathMin(currentPage() * pageSize(), filteredHistory().length) }}</strong> 
            of 
            <strong>{{ filteredHistory().length }}</strong> audit events
          </div>

          <div class="pagination-controls">
            <!-- Page Size Selector -->
            <div class="page-size-wrap">
              <label for="pageSize" style="font-size: 0.75rem; color: var(--text-dim);">Per page:</label>
              <select 
                id="pageSize"
                [ngModel]="pageSize()" 
                (ngModelChange)="pageSize.set($event); currentPage.set(1)"
                class="form-select page-size-select"
              >
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
              </select>
            </div>

            <!-- Page Buttons -->
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
    </div>
  `,
  styles: [`
    .history-page {
      max-width: 1300px;
      margin: 0 auto;
    }

    /* Metrics Row */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .metric-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
    }
    .metric-card.active-metric {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.08);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
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
    .text-available { color: #34d399; }
    .text-created { color: #38bdf8; }
    .text-repair { color: #fbbf24; }

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

    .log-id {
      color: var(--text-dim);
      font-size: 0.75rem;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    .history-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .action-symbol {
      margin-right: 3px;
      font-weight: 700;
    }

    .asset-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .asset-name-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .employee-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      color: #7dd3fc;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .avatar-tiny {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0284c7;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
    }

    .empty-dash {
      color: var(--text-dim);
      font-size: 0.875rem;
    }

    .date-cell {
      font-size: 0.8125rem;
    }
    .date-main {
      color: #e2e8f0;
      font-weight: 500;
    }
    .time-sub {
      color: var(--text-dim);
      font-size: 0.75rem;
      margin-top: 1px;
    }

    .notes-cell {
      font-size: 0.8125rem;
      color: #cbd5e1;
      max-width: 320px;
      line-height: 1.4;
    }

    /* Badges */
    .badge-created {
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(14, 165, 233, 0.3);
      color: #38bdf8;
    }
    .badge-updated {
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #c084fc;
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

    .page-size-wrap {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-right: 0.5rem;
    }

    .page-size-select {
      height: 32px;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      width: auto;
    }

    .page-indicator {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .state-icon {
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }
  `]
})
export class AssetHistoryComponent implements OnInit {
  private assetService = inject(AssetService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  // Reactive State Signals
  public historyRecords = signal<AssetHistory[]>([]);
  public allAssets = signal<Asset[]>([]);
  public loading = signal<boolean>(true);

  // Filters
  public searchFilter = signal<string>('');
  public selectedAssetCode = signal<string>('ALL');
  public selectedAction = signal<string>('ALL');

  // Pagination
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);

  // Computed Filtered History
  public filteredHistory = computed(() => {
    const list = this.historyRecords();
    const q = this.searchFilter().toLowerCase().trim();
    const assetCode = this.selectedAssetCode();
    const action = this.selectedAction();

    return list.filter(item => {
      // Filter by asset code
      if (assetCode !== 'ALL' && item.asset_code.toLowerCase() !== assetCode.toLowerCase()) {
        return false;
      }

      // Filter by action type
      if (action !== 'ALL' && item.action_type.toLowerCase() !== action.toLowerCase()) {
        return false;
      }

      // Filter by search query
      if (q) {
        const matchCode = item.asset_code.toLowerCase().includes(q);
        const matchName = item.asset_name ? item.asset_name.toLowerCase().includes(q) : false;
        const matchEmp = item.employee ? item.employee.toLowerCase().includes(q) : false;
        const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
        if (!matchCode && !matchName && !matchEmp && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  });

  // Computed Paginated slice
  public paginatedHistory = computed(() => {
    const filtered = this.filteredHistory();
    const start = (this.currentPage() - 1) * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  // Total pages
  public totalPages = computed(() => {
    return Math.ceil(this.filteredHistory().length / this.pageSize()) || 1;
  });

  ngOnInit() {
    const codeParam = this.route.snapshot.queryParamMap.get('asset_code');
    if (codeParam) {
      this.selectedAssetCode.set(codeParam);
    }

    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    forkJoin({
      records: this.assetService.getAssetHistory(undefined, undefined, undefined, 500),
      assets: this.assetService.getAssets()
    }).subscribe({
      next: ({ records, assets }) => {
        this.historyRecords.set(records || []);
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
    this.searchFilter.set(term);
    this.currentPage.set(1);
    this.cdr.markForCheck();
  }

  resetFilters() {
    this.searchFilter.set('');
    this.selectedAssetCode.set('ALL');
    this.selectedAction.set('ALL');
    this.currentPage.set(1);
    this.cdr.markForCheck();
  }

  countByAction(actionType: string): number {
    return this.historyRecords().filter(r => r.action_type.toLowerCase() === actionType.toLowerCase()).length;
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'Created': return 'badge-created';
      case 'Assigned': return 'badge-assigned';
      case 'Returned': return 'badge-available';
      case 'Under Repair': return 'badge-repair';
      case 'Retired': return 'badge-retired';
      case 'Updated': return 'badge-updated';
      default: return 'badge-assigned';
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'Created': return '+';
      case 'Assigned': return '→';
      case 'Returned': return '←';
      case 'Under Repair': return '⚠';
      case 'Retired': return '✖';
      case 'Updated': return '✎';
      default: return '•';
    }
  }

  exportCSV() {
    const records = this.filteredHistory();
    if (records.length === 0) return;

    const headers = ['Log ID', 'Action Type', 'Asset Code', 'Asset Name', 'Staff Involved', 'Action Date', 'Notes'];
    const rows = records.map(r => [
      r.id,
      `"${r.action_type}"`,
      `"${r.asset_code}"`,
      `"${r.asset_name || ''}"`,
      `"${r.employee || ''}"`,
      `"${r.action_date}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `asset_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
