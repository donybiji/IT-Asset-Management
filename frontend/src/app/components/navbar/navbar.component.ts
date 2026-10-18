import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <div class="live-tag">
          <span class="live-dot"></span>
          <span>POSTGRESQL 16 LIVE</span>
        </div>

        <nav class="nav-links">
          <a routerLink="/home" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/dashboard" class="nav-link" routerLinkActive="active">Dashboard</a>
          <a routerLink="/assets" class="nav-link" routerLinkActive="active">Inventory</a>
        </nav>
      </div>

      <div class="navbar-right">
        <a routerLink="/assets/new" class="btn btn-primary btn-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Asset</span>
        </a>

        <!-- Interactive Admin Profile Dropdown -->
        <div class="profile-container">
          <button 
            type="button" 
            class="admin-profile-btn" 
            (click)="toggleDropdown($event)"
            [class.active]="isDropdownOpen()"
            aria-haspopup="true"
            [attr.aria-expanded]="isDropdownOpen()"
            id="admin-profile-dropdown-trigger">
            
            <div class="avatar">IT</div>
            <div class="profile-info">
              <span class="profile-name">System Administrator</span>
              <span class="profile-role">{{ currentRole() }}</span>
            </div>

            <svg class="dropdown-caret" [class.rotated]="isDropdownOpen()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Glassmorphic Dropdown Menu -->
          @if (isDropdownOpen()) {
            <div class="dropdown-panel animate-dropdown" (click)="$event.stopPropagation()">
              
              <!-- User Persona Card Header -->
              <div class="dropdown-user-header">
                <div class="header-avatar">IT</div>
                <div class="header-info">
                  <div class="header-name">System Administrator</div>
                  <div class="header-email">admin&#64;enterprise.internal</div>
                  <div class="header-badge">
                    <span class="role-dot"></span>
                    <span>{{ currentRoleLevel() }} • FULL CLEARANCE</span>
                  </div>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Section: Data Export Actions -->
              <div class="dropdown-section-title">DATA EXPORTS & REPORTING</div>

              <div class="dropdown-items">
                <button type="button" class="dropdown-item" (click)="exportInventoryCSV()" id="btn-export-inventory">
                  <div class="item-icon bg-icon-emerald">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </div>
                  <div class="item-label-group">
                    <span class="item-title">Export Inventory (CSV)</span>
                    <span class="item-desc">Download active hardware fleet spreadsheet</span>
                  </div>
                </button>

                <button type="button" class="dropdown-item" (click)="exportAuditLedgerCSV()" id="btn-export-audit">
                  <div class="item-icon bg-icon-indigo">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div class="item-label-group">
                    <span class="item-title">Export Audit Ledger (CSV)</span>
                    <span class="item-desc">Download complete PostgreSQL event log</span>
                  </div>
                </button>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Section: System Telemetry Snapshot -->
              <div class="dropdown-telemetry">
                <div class="telemetry-item">
                  <span class="tel-label">DATABASE</span>
                  <span class="tel-val text-green">Postgres 16 (Online)</span>
                </div>
                <div class="telemetry-item">
                  <span class="tel-label">BACKEND API</span>
                  <span class="tel-val text-cyan">Go :8080 (0.8ms p99)</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Section: Persona Switching Simulation -->
              <div class="dropdown-section-title">SIMULATE RBAC ROLE</div>
              <div class="role-selector-pills">
                <button 
                  type="button" 
                  class="role-pill" 
                  [class.active-pill]="currentRole() === 'Asset Manager'" 
                  (click)="switchRole('Asset Manager', 'RBAC L4')">
                  Admin
                </button>
                <button 
                  type="button" 
                  class="role-pill" 
                  [class.active-pill]="currentRole() === 'Operations Lead'" 
                  (click)="switchRole('Operations Lead', 'RBAC L3')">
                  Operations
                </button>
                <button 
                  type="button" 
                  class="role-pill" 
                  [class.active-pill]="currentRole() === 'Audit Inspector'" 
                  (click)="switchRole('Audit Inspector', 'RBAC L2')">
                  Auditor
                </button>
              </div>

              <div class="dropdown-divider"></div>

              <!-- Footer: Sign Out / Lock Session -->
              <div class="dropdown-footer">
                <button type="button" class="signout-btn" (click)="signout()" id="btn-lock-session">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>Lock Session / Sign Out</span>
                </button>
              </div>

            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: var(--bg-header);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
    }

    @media (max-width: 820px) {
      .nav-links {
        display: none;
      }
    }

    .live-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    /* PROFILE DROPDOWN CONTAINER */
    .profile-container {
      position: relative;
    }

    .admin-profile-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .admin-profile-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .admin-profile-btn.active {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .avatar {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
    }

    .profile-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }

    .profile-role {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    .dropdown-caret {
      color: var(--text-dim);
      transition: transform 0.2s ease;
      margin-left: 0.25rem;
    }

    .dropdown-caret.rotated {
      transform: rotate(180deg);
      color: #818cf8;
    }

    /* DROPDOWN PANEL */
    .dropdown-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 320px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.7), 0 0 24px rgba(99, 102, 241, 0.15);
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      z-index: 100;
    }

    .animate-dropdown {
      animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* User Header */
    .dropdown-user-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .header-email {
      font-size: 0.6875rem;
      color: var(--text-dim);
      margin-bottom: 0.3rem;
      font-family: var(--font-mono);
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.25);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 700;
      color: #a5b4fc;
      width: fit-content;
    }

    .role-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 6px #38bdf8;
    }

    .dropdown-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 0.85rem 0;
    }

    .dropdown-section-title {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }

    /* Actions Items */
    .dropdown-items {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.65rem;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      color: var(--text-main);
      width: 100%;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateX(2px);
    }

    .item-icon {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bg-icon-emerald { background: rgba(16, 185, 129, 0.14); }
    .bg-icon-indigo { background: rgba(99, 102, 241, 0.14); }
    .bg-icon-sky { background: rgba(56, 189, 248, 0.14); }
    .bg-icon-amber { background: rgba(245, 158, 11, 0.14); }

    .item-label-group {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .item-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .item-desc {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    /* Telemetry Box */
    .dropdown-telemetry {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-md);
      padding: 0.6rem 0.75rem;
    }

    .telemetry-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .tel-label {
      font-size: 0.5625rem;
      font-weight: 800;
      color: var(--text-dim);
      letter-spacing: 0.06em;
    }

    .tel-val {
      font-size: 0.6875rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .text-green { color: #34d399; }
    .text-cyan { color: #38bdf8; }

    /* Role Pills */
    .role-selector-pills {
      display: flex;
      gap: 0.4rem;
    }

    .role-pill {
      flex: 1;
      padding: 0.35rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      transition: all 0.2s ease;
      text-align: center;
    }

    .role-pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .active-pill {
      background: rgba(99, 102, 241, 0.2) !important;
      border-color: rgba(99, 102, 241, 0.4) !important;
      color: #818cf8 !important;
      font-weight: 700;
    }

    /* Sign Out */
    .dropdown-footer {
      padding-top: 0.25rem;
    }

    .signout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem;
      border-radius: var(--radius-md);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .signout-btn:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }

    @media (max-width: 640px) {
      .navbar {
        padding: 0 1rem;
      }
      .profile-info {
        display: none;
      }
      .dropdown-panel {
        width: 290px;
        right: -10px;
      }
    }
  `]
})
export class NavbarComponent {
  private router = inject(Router);
  private assetService = inject(AssetService);
  private elementRef = inject(ElementRef);

  public isDropdownOpen = signal<boolean>(false);
  public currentRole = signal<string>('Asset Manager');
  public currentRoleLevel = signal<string>('RBAC L4');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.isDropdownOpen.set(false);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  goToRoute(path: string, queryParams?: any) {
    this.closeDropdown();
    if (queryParams) {
      this.router.navigate([path], { queryParams });
    } else {
      this.router.navigate([path]);
    }
  }

  exportInventoryCSV() {
    this.assetService.getAssets().subscribe({
      next: (assets) => {
        if (!assets || assets.length === 0) {
          this.assetService.showToast('info', 'No Data', 'No assets available in inventory to export.');
          return;
        }

        const headers = ['ID', 'Asset Code', 'Asset Name', 'Category/Type', 'Serial Number', 'Purchase Date', 'Status', 'Assigned To', 'Location'];
        const rows = assets.map(a => [
          a.id,
          `"${a.asset_code || ''}"`,
          `"${(a.asset_name || '').replace(/"/g, '""')}"`,
          `"${a.asset_type || a.category || ''}"`,
          `"${a.serial_number || ''}"`,
          `"${a.purchase_date || ''}"`,
          `"${a.status || ''}"`,
          `"${(a.assigned_to || '').replace(/"/g, '""')}"`,
          `"${(a.location || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csvContent, 'IT_Asset_Fleet_Inventory.csv', 'text/csv;charset=utf-8;');
        this.assetService.showToast('success', 'Export Complete', `Successfully exported ${assets.length} hardware assets.`);
        this.closeDropdown();
      }
    });
  }

  exportAuditLedgerCSV() {
    this.assetService.getAssetHistory().subscribe({
      next: (history) => {
        if (!history || history.length === 0) {
          this.assetService.showToast('info', 'No Data', 'No audit logs available to export.');
          return;
        }

        const headers = ['Record ID', 'Asset ID', 'Asset Code', 'Asset Name', 'Action Type', 'Custodian', 'Action Date', 'Notes'];
        const rows = history.map(h => [
          h.id,
          h.asset_id,
          `"${h.asset_code || ''}"`,
          `"${(h.asset_name || '').replace(/"/g, '""')}"`,
          `"${h.action_type || ''}"`,
          `"${(h.employee || '').replace(/"/g, '""')}"`,
          `"${h.action_date || ''}"`,
          `"${(h.notes || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csvContent, 'IT_Asset_Audit_Ledger.csv', 'text/csv;charset=utf-8;');
        this.assetService.showToast('success', 'Export Complete', `Successfully exported ${history.length} audit records.`);
        this.closeDropdown();
      }
    });
  }

  switchRole(role: string, level: string) {
    this.currentRole.set(role);
    this.currentRoleLevel.set(level);
    this.assetService.showToast('info', 'Persona Switched', `Active role changed to ${role} (${level})`);
  }

  signout() {
    this.closeDropdown();
    this.assetService.showToast('info', 'Session Locked', 'Administrator session locked. Welcome back anytime.');
    this.router.navigate(['/home']);
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
