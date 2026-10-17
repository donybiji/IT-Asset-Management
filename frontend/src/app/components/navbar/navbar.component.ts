import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <div class="live-tag">
          <span class="live-dot"></span>
          <span>POSTGRESQL 16 LIVE</span>
        </div>
      </div>

      <div class="navbar-right">
        <a routerLink="/assets/new" class="btn btn-primary btn-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Asset</span>
        </a>

        <div class="admin-profile">
          <div class="avatar">IT</div>
          <div class="profile-info">
            <span class="profile-name">System Administrator</span>
            <span class="profile-role">Asset Manager</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: var(--bg-header);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: sticky;
      top: 0;
      z-index: 30;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
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

    .admin-profile {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding-left: 1rem;
      border-left: 1px solid var(--border-subtle);
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
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .profile-info {
      display: flex;
      flex-direction: column;
    }

    .profile-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #fff;
      line-height: 1.2;
    }

    .profile-role {
      font-size: 0.6875rem;
      color: var(--text-dim);
    }

    @media (max-width: 640px) {
      .navbar {
        padding: 0 1rem;
      }
      .profile-info {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {}
