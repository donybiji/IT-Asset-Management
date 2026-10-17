import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div class="brand-info">
          <div class="brand-title">IT Assets</div>
          <div class="brand-subtitle">Enterprise Suite</div>
        </div>
      </div>

      <div class="nav-section-title">MAIN NAVIGATION</div>

      <nav class="nav-menu">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </a>

        <a routerLink="/assets" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Asset List</span>
        </a>

        <a routerLink="/assets/new" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Add Asset</span>
        </a>

        <a routerLink="/assign" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          <span>Assign Asset</span>
        </a>

        <div class="nav-section-title">RECORDS & AUDIT</div>

        <a routerLink="/history" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Asset History</span>
        </a>

        <a routerLink="/employees" routerLinkActive="active" class="nav-item">
          <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Employees</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="system-status">
          <div class="status-indicator"></div>
          <div class="status-details">
            <div class="status-text">PostgreSQL & Go API</div>
            <div class="status-sub">Port 8080 Active</div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      width: 260px;
      height: 100vh;
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      z-index: 40;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0 0.5rem 1.75rem 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 1.5rem;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }

    .brand-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      padding: 0.75rem 0.75rem 0.375rem;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #fff;
      transform: translateX(2px);
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.05) 100%);
      color: #818cf8;
      font-weight: 600;
      border-left: 3px solid #6366f1;
    }

    .nav-item.active .nav-icon {
      color: #818cf8;
    }

    .nav-icon {
      color: var(--text-dim);
      transition: color 0.2s;
    }

    .sidebar-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      padding: 0.75rem;
      border-radius: var(--radius-md);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      flex-shrink: 0;
    }

    .status-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .status-sub {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    @media (max-width: 900px) {
      .sidebar {
        width: 100%;
        height: auto;
        position: static;
        border-right: none;
        border-bottom: 1px solid var(--border-subtle);
      }
      .nav-menu {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .sidebar-footer {
        display: none;
      }
    }
  `]
})
export class SidebarComponent {
  private assetService = inject(AssetService);
}
