import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { 
  Asset, 
  AssetHistory, 
  DashboardStats, 
  isAvailable, 
  isAssigned, 
  isUnderRepair, 
  isRetired,
  getStatusBadgeClass 
} from '../../models/asset.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Operations Dashboard
          </h1>
          <p class="page-subtitle">Real-time IT asset inventory metrics, status overview, and fast-track actions.</p>
        </div>

        <div class="header-actions">
          <button (click)="loadDashboardData()" class="btn btn-secondary btn-sm" [disabled]="loading()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.spinner]="loading()">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{{ loading() ? 'Refreshing...' : 'Refresh Data' }}</span>
          </button>
          <a routerLink="/assets/new" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Register Asset</span>
          </a>
        </div>
      </div>

      <!-- Quick Summary Cards -->
      <div class="stat-grid">
        <!-- Total Assets -->
        <a routerLink="/assets" class="stat-card" style="--accent-gradient: linear-gradient(90deg, #6366f1, #818cf8); text-decoration: none;">
          <div class="stat-header">
            <span class="stat-title">Total Assets</span>
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.12); color: #818cf8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ stats().totalAssets }}</div>
          <div class="stat-footer">
            <span>Enterprise repository size</span>
          </div>
        </a>

        <!-- Available Assets -->
        <a [routerLink]="['/assets']" [queryParams]="{status: 'AVAILABLE'}" class="stat-card" style="--accent-gradient: linear-gradient(90deg, #10b981, #34d399); text-decoration: none;">
          <div class="stat-header">
            <span class="stat-title">Available in Stock</span>
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.12); color: #34d399;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #34d399;">{{ stats().availableAssets }}</div>
          <div class="stat-footer">
            <span>Ready for deployment</span>
          </div>
        </a>

        <!-- Assigned Assets -->
        <a [routerLink]="['/assets']" [queryParams]="{status: 'ASSIGNED'}" class="stat-card" style="--accent-gradient: linear-gradient(90deg, #0284c7, #38bdf8); text-decoration: none;">
          <div class="stat-header">
            <span class="stat-title">Assigned Assets</span>
            <div class="stat-icon" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #38bdf8;">{{ stats().assignedAssets }}</div>
          <div class="stat-footer">
            <span>Allocated to employees</span>
          </div>
        </a>

        <!-- Under Repair Assets -->
        <a [routerLink]="['/assets']" [queryParams]="{status: 'UNDER_REPAIR'}" class="stat-card" style="--accent-gradient: linear-gradient(90deg, #d97706, #fbbf24); text-decoration: none;">
          <div class="stat-header">
            <span class="stat-title">Under Repair</span>
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.12); color: #fbbf24;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #fbbf24;">{{ stats().underRepairAssets }}</div>
          <div class="stat-footer">
            <span>Maintenance & diagnosis</span>
          </div>
        </a>

        <!-- Retired Assets -->
        <a [routerLink]="['/assets']" [queryParams]="{status: 'RETIRED'}" class="stat-card" style="--accent-gradient: linear-gradient(90deg, #475569, #94a3b8); text-decoration: none;">
          <div class="stat-header">
            <span class="stat-title">Retired Assets</span>
            <div class="stat-icon" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
          </div>
          <div class="stat-value" style="color: #cbd5e1;">{{ stats().retiredAssets }}</div>
          <div class="stat-footer">
            <span>Decommissioned</span>
          </div>
        </a>
      </div>

      <!-- Quick Action Navigation Hub & Asset Type Distribution -->
      <div class="hub-grid">
        <div class="card hub-card">
          <div class="hub-header">
            <h2 class="card-title">Quick Actions & Shortcuts</h2>
            <span class="hub-badge">Operations</span>
          </div>
          <div class="action-buttons-grid">
            <a routerLink="/assets" class="action-tile">
              <div class="action-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <div class="action-texts">
                <span class="action-name">Browse All Assets</span>
                <span class="action-desc">Filter, search, edit & perform actions</span>
              </div>
            </a>

            <a routerLink="/assign" class="action-tile">
              <div class="action-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <div class="action-texts">
                <span class="action-name">Assign Asset</span>
                <span class="action-desc">Allocate available stock to staff</span>
              </div>
            </a>

            <a routerLink="/assets/new" class="action-tile">
              <div class="action-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <div class="action-texts">
                <span class="action-name">Add New Asset</span>
                <span class="action-desc">Register hardware or equipment</span>
              </div>
            </a>

            <a routerLink="/history" class="action-tile">
              <div class="action-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="action-texts">
                <span class="action-name">Audit Logs</span>
                <span class="action-desc">Track allocation & maintenance history</span>
              </div>
            </a>
          </div>
        </div>

        <!-- Asset Type Distribution Card -->
        <div class="card category-card">
          <div class="hub-header">
            <h2 class="card-title">Asset Type Breakdown</h2>
            <span class="hub-badge">Inventory</span>
          </div>

          <div *ngIf="assetTypeList().length === 0" class="empty-cats">
            <span>No asset types available yet.</span>
          </div>

          <div class="category-list" *ngIf="assetTypeList().length > 0">
            <div *ngFor="let item of assetTypeList()" class="category-item">
              <div class="cat-info">
                <span class="cat-name">{{ item.name }}</span>
                <span class="cat-count">{{ item.count }} items ({{ item.percentage }}%)</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="item.percentage"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent History Activity -->
      <div class="card activity-section">
        <div class="activity-header">
          <div>
            <h2 class="card-title">Recent Asset Activity</h2>
            <p class="section-desc">Latest audit movements and actions logged in PostgreSQL</p>
          </div>
          <a routerLink="/history" class="btn btn-outline btn-sm">View Full History &rarr;</a>
        </div>

        <div *ngIf="recentHistory().length === 0" class="state-box">
          <p>No activity records logged yet.</p>
        </div>

        <div class="table-responsive" *ngIf="recentHistory().length > 0">
          <table class="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Employee</th>
                <th>Timestamp</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of recentHistory()">
                <td>
                  <span class="badge" [ngClass]="getActionBadgeClass(h.action_type)">
                    {{ h.action_type }}
                  </span>
                </td>
                <td><span class="code-font">{{ h.asset_code }}</span></td>
                <td><strong style="color: #fff;">{{ h.asset_name || '—' }}</strong></td>
                <td>{{ h.employee || '—' }}</td>
                <td style="color: var(--text-dim);">{{ h.action_date | date:'medium' }}</td>
                <td>{{ h.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .hub-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 1024px) {
      .hub-grid {
        grid-template-columns: 1fr;
      }
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
    }

    .hub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .hub-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-dim);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .action-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .action-buttons-grid {
        grid-template-columns: 1fr;
      }
    }

    .action-tile {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem;
      border-radius: var(--radius-md);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .action-tile:hover {
      background: var(--bg-card-hover);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-texts {
      display: flex;
      flex-direction: column;
    }

    .action-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #fff;
    }

    .action-desc {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 2px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cat-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      margin-bottom: 0.35rem;
    }

    .cat-name {
      font-weight: 600;
      color: #e2e8f0;
    }

    .cat-count {
      color: var(--text-dim);
    }

    .progress-bar-bg {
      height: 6px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #38bdf8);
      border-radius: 9999px;
      transition: width 0.6s ease;
    }

    .empty-cats {
      color: var(--text-dim);
      font-size: 0.875rem;
      text-align: center;
      padding: 2rem;
    }

    .activity-section {
      margin-top: 1rem;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--text-dim);
      margin-top: 0.2rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private assetService = inject(AssetService);

  public loading = signal<boolean>(false);
  public stats = signal<DashboardStats>({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    underRepairAssets: 0,
    retiredAssets: 0,
    categoryBreakdown: {},
    assetTypeBreakdown: {}
  });
  public recentHistory = signal<AssetHistory[]>([]);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);

    this.assetService.getAssets().subscribe({
      next: (assets) => {
        let available = 0;
        let assigned = 0;
        let repair = 0;
        let retired = 0;
        const types: { [key: string]: number } = {};

        for (const a of assets) {
          if (isAvailable(a.status)) available++;
          else if (isAssigned(a.status)) assigned++;
          else if (isUnderRepair(a.status)) repair++;
          else if (isRetired(a.status)) retired++;

          const type = a.asset_type || a.category || 'Other';
          types[type] = (types[type] || 0) + 1;
        }

        this.stats.set({
          totalAssets: assets.length,
          availableAssets: available,
          assignedAssets: assigned,
          underRepairAssets: repair,
          retiredAssets: retired,
          categoryBreakdown: types,
          assetTypeBreakdown: types
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    // Fetch recent audit history
    this.assetService.getAssetHistory().subscribe({
      next: (history) => {
        this.recentHistory.set((history || []).slice(0, 6));
      }
    });
  }

  assetTypeList() {
    const breakdown = this.stats().assetTypeBreakdown || this.stats().categoryBreakdown;
    const total = this.stats().totalAssets || 1;
    return Object.keys(breakdown).map(type => ({
      name: type,
      count: breakdown[type],
      percentage: Math.round((breakdown[type] / total) * 100)
    }));
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'Created': return 'badge-available';
      case 'Assigned': return 'badge-assigned';
      case 'Returned': return 'badge-available';
      case 'Under Repair': return 'badge-repair';
      case 'Retired': return 'badge-retired';
      default: return 'badge-assigned';
    }
  }
}
