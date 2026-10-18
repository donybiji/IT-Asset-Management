import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetHistory, isAvailable, isAssigned, isUnderRepair, isRetired } from '../../models/asset.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container animate-fade-in">
      
      <!-- HERO EXECUTIVE BANNER -->
      <section class="hero-card">
        <div class="hero-ambient-glow"></div>
        <div class="hero-mesh-grid"></div>

        <div class="hero-layout">
          <!-- Left Column: Executive Value Proposition -->
          <div class="hero-left">
            <div class="hero-badge-pill">
              <span class="pulse-beacon"></span>
              <span class="badge-text">ENTERPRISE ASSET GOVERNANCE PLATFORM</span>
              <span class="badge-version">v2.4 LTS</span>
            </div>

            <h1 class="hero-headline">
              Intelligent Hardware Lifecycle &amp; <br />
              <span class="gradient-text">IT Inventory Operations</span>
            </h1>

            <p class="hero-lead">
              Centralized hardware asset tracking from procurement to decommissioning. Enforce hardware uniqueness, 
              prevent allocation conflicts, automate return workflows, and maintain an immutable PostgreSQL audit trail.
            </p>

            <!-- Primary CTAs -->
            <div class="hero-cta-group">
              <button (click)="navigateToDashboard()" class="btn-primary-glow" id="btn-enter-dashboard">
                <div class="btn-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div class="btn-text-content">
                  <span class="btn-title">Launch Operations Dashboard</span>
                  <span class="btn-subtitle">Real-time telemetry &amp; analytics</span>
                </div>
                <svg class="chevron-forward" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <a routerLink="/assets" class="btn-secondary-glass" id="btn-browse-assets">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <span>Browse Asset Inventory</span>
              </a>
            </div>

            <!-- Architecture Micro-Badges -->
            <div class="tech-spec-bar">
              <div class="spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Go 1.22 REST API (0.8ms p99)</span>
              </div>
              <div class="spec-divider">•</div>
              <div class="spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
                <span>PostgreSQL 16 ACID Audit</span>
              </div>
              <div class="spec-divider">•</div>
              <div class="spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Unique Serial Lock Enforced</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive System Telemetry Hologram -->
          <div class="hero-right">
            <div class="telemetry-console">
              <!-- Window Bar -->
              <div class="console-header">
                <div class="window-dots">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                </div>
                <div class="console-title">
                  <span class="console-prompt">SYS:</span> TELEMETRY_CORE_ACTIVE
                </div>
                <div class="status-live-tag">
                  <span class="live-dot-sm"></span>
                  <span>ONLINE</span>
                </div>
              </div>

              <!-- Console Body -->
              <div class="console-body">
                <!-- Node Status Grid -->
                <div class="console-stat-row">
                  <div class="console-chip">
                    <span class="chip-label">DB Engine</span>
                    <span class="chip-val text-green">Postgres 16 OK</span>
                  </div>
                  <div class="console-chip">
                    <span class="chip-label">Go Backend</span>
                    <span class="chip-val text-cyan">Port :8080</span>
                  </div>
                  <div class="console-chip">
                    <span class="chip-label">Concurrency</span>
                    <span class="chip-val text-purple">Mutex Shield</span>
                  </div>
                </div>

                <!-- Interactive Workflow Topology -->
                <div class="topology-box">
                  <div class="topology-title">HARDWARE LIFECYCLE TOPOLOGY</div>
                  <div class="topology-flow">
                    <div class="topo-node">
                      <div class="topo-icon-circle bg-emerald">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                      </div>
                      <span>Procure</span>
                    </div>

                    <div class="topo-connector">
                      <div class="connector-line"></div>
                    </div>

                    <div class="topo-node">
                      <div class="topo-icon-circle bg-indigo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                      </div>
                      <span>Stock</span>
                    </div>

                    <div class="topo-connector">
                      <div class="connector-line"></div>
                    </div>

                    <div class="topo-node">
                      <div class="topo-icon-circle bg-sky">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                      </div>
                      <span>Assign</span>
                    </div>

                    <div class="topo-connector">
                      <div class="connector-line"></div>
                    </div>

                    <div class="topo-node">
                      <div class="topo-icon-circle bg-amber">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      </div>
                      <span>Audit</span>
                    </div>
                  </div>
                </div>

                <!-- Instant Action Trigger Hub -->
                <div class="console-actions">
                  <button (click)="navigateToRoute('/assets/new')" class="console-btn btn-action-add">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Register Hardware</span>
                  </button>

                  <button (click)="navigateToRoute('/assign')" class="console-btn btn-action-assign">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                    <span>Assign Equipment</span>
                  </button>
                </div>

                <!-- Redirection Callout Notice -->
                <div class="console-footer-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>Fast client-side routing via Angular's <code>Router.navigate(['/dashboard'])</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- LIVE INVENTORY HEALTH CARDS -->
      <section class="section-block">
        <div class="section-top-bar">
          <div class="section-title-group">
            <span class="section-kicker">REAL-TIME TELEMETRY</span>
            <h2 class="section-title">Live Hardware Inventory Health</h2>
          </div>
          <div class="section-meta-pill">
            <span class="live-dot-green"></span>
            <span>PostgreSQL 16 &amp; Go REST Engine Synchronized</span>
          </div>
        </div>

        <div class="stats-glass-grid">
          <!-- Total Assets Card -->
          <div class="stat-glass-card card-glow-indigo" (click)="navigateToDashboard()">
            <div class="stat-card-header">
              <span class="stat-category-label">TOTAL ASSET FLEET</span>
              <div class="stat-icon-wrapper bg-icon-indigo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </div>
            </div>

            <div class="stat-number-wrap">
              <span class="stat-hero-number">{{ totalCount() }}</span>
              <span class="stat-unit">Units</span>
            </div>

            <div class="stat-distribution-meter">
              <div class="meter-bar">
                <div class="meter-segment seg-available" [style.width.%]="getPercent(availableCount())"></div>
                <div class="meter-segment seg-assigned" [style.width.%]="getPercent(assignedCount())"></div>
                <div class="meter-segment seg-repair" [style.width.%]="getPercent(repairCount())"></div>
              </div>
              <div class="meter-legend">
                <span>Active Database Records</span>
                <span class="meter-ratio">100% Monitored</span>
              </div>
            </div>

            <div class="stat-card-action">
              <span>View full dashboard metrics &rarr;</span>
            </div>
          </div>

          <!-- Available in Stock Card -->
          <div class="stat-glass-card card-glow-emerald" (click)="navigateToRoute('/assets', { status: 'AVAILABLE' })">
            <div class="stat-card-header">
              <span class="stat-category-label text-emerald">AVAILABLE IN STOCK</span>
              <div class="stat-icon-wrapper bg-icon-emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>

            <div class="stat-number-wrap">
              <span class="stat-hero-number text-emerald">{{ availableCount() }}</span>
              <span class="stat-badge-tag tag-emerald">{{ getPercent(availableCount()) }}% of Stock</span>
            </div>

            <p class="stat-description">
              Unassigned hardware physically present in inventory and ready for immediate employee distribution.
            </p>

            <div class="stat-card-action text-emerald">
              <span>Filter available assets &rarr;</span>
            </div>
          </div>

          <!-- Currently Assigned Card -->
          <div class="stat-glass-card card-glow-sky" (click)="navigateToRoute('/assets', { status: 'ASSIGNED' })">
            <div class="stat-card-header">
              <span class="stat-category-label text-sky">CURRENTLY ASSIGNED</span>
              <div class="stat-icon-wrapper bg-icon-sky">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>

            <div class="stat-number-wrap">
              <span class="stat-hero-number text-sky">{{ assignedCount() }}</span>
              <span class="stat-badge-tag tag-sky">{{ getPercent(assignedCount()) }}% Deployed</span>
            </div>

            <p class="stat-description">
              Hardware actively deployed across personnel with custodian verification and employee registry binding.
            </p>

            <div class="stat-card-action text-sky">
              <span>Inspect active assignments &rarr;</span>
            </div>
          </div>

          <!-- Under Repair Card -->
          <div class="stat-glass-card card-glow-amber" (click)="navigateToRoute('/assets', { status: 'UNDER_REPAIR' })">
            <div class="stat-card-header">
              <span class="stat-category-label text-amber">UNDER MAINTENANCE</span>
              <div class="stat-icon-wrapper bg-icon-amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
            </div>

            <div class="stat-number-wrap">
              <span class="stat-hero-number text-amber">{{ repairCount() }}</span>
              <span class="stat-badge-tag tag-amber">Safety Guarded</span>
            </div>

            <p class="stat-description">
              Equipment under diagnostics or vendor service. Allocation locked by system rules until certified.
            </p>

            <div class="stat-card-action text-amber">
              <span>View repair queue &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      <!-- OPERATIONS FAST-TRACK NAVIGATION HUB -->
      <section class="section-block">
        <div class="section-top-bar">
          <div class="section-title-group">
            <span class="section-kicker">CONTROL CENTER</span>
            <h2 class="section-title">Operations Fast-Track Navigation</h2>
          </div>
          <span class="section-subtitle-text">Direct 1-click routing into management consoles</span>
        </div>

        <div class="hub-grid">
          <!-- Hub Card 1: Dashboard -->
          <div class="hub-interactive-card" (click)="navigateToDashboard()">
            <div class="hub-accent-bar bg-gradient-indigo"></div>
            <div class="hub-card-top">
              <div class="hub-icon-box bg-box-indigo">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <span class="hub-tag">EXECUTIVE COCKPIT</span>
            </div>

            <h3 class="hub-heading">Operations Dashboard</h3>
            <p class="hub-desc">
              Holistic visual command center showcasing stock distribution, type breakdown, utilization metrics, and recent asset registrations.
            </p>

            <div class="hub-footer">
              <span class="hub-action-link">
                <span>Open Dashboard</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>

          <!-- Hub Card 2: Inventory -->
          <div class="hub-interactive-card" (click)="navigateToRoute('/assets')">
            <div class="hub-accent-bar bg-gradient-sky"></div>
            <div class="hub-card-top">
              <div class="hub-icon-box bg-box-sky">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <span class="hub-tag">CATALOG &amp; SEARCH</span>
            </div>

            <h3 class="hub-heading">Asset Inventory</h3>
            <p class="hub-desc">
              Filter hardware by Status, Asset Type, or search by Asset Code and Serial Number. Perform quick assignments, returns, and repairs.
            </p>

            <div class="hub-footer">
              <span class="hub-action-link">
                <span>Manage Inventory</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>

          <!-- Hub Card 3: Assign -->
          <div class="hub-interactive-card" (click)="navigateToRoute('/assign')">
            <div class="hub-accent-bar bg-gradient-emerald"></div>
            <div class="hub-card-top">
              <div class="hub-icon-box bg-box-emerald">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <span class="hub-tag">ALLOCATION WORKFLOW</span>
            </div>

            <h3 class="hub-heading">Equipment Allocation</h3>
            <p class="hub-desc">
              Allocate available hardware to employees with automated conflict prevention, employee directory lookups, and department notes.
            </p>

            <div class="hub-footer">
              <span class="hub-action-link">
                <span>Allocate Hardware</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>

          <!-- Hub Card 4: History -->
          <div class="hub-interactive-card" (click)="navigateToRoute('/history')">
            <div class="hub-accent-bar bg-gradient-amber"></div>
            <div class="hub-card-top">
              <div class="hub-icon-box bg-box-amber">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <span class="hub-tag">COMPLIANCE LEDGER</span>
            </div>

            <h3 class="hub-heading">Audit Trail &amp; History</h3>
            <p class="hub-desc">
              Complete chronological audit trail recording assignments, returns, repairs, and decommission events with CSV export capabilities.
            </p>

            <div class="hub-footer">
              <span class="hub-action-link">
                <span>Review Audit Trail</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- LIVE RECENT ASSET OPERATIONS FEED -->
      <section class="section-block">
        <div class="section-top-bar">
          <div class="section-title-group">
            <span class="section-kicker">AUDIT ACTIVITY FEED</span>
            <h2 class="section-title">Latest Recorded Operations</h2>
          </div>
          <a routerLink="/history" class="btn btn-outline btn-sm">
            <span>View Full Audit Ledger</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>

        <div class="activity-feed-glass card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Event Action</th>
                  <th>Hardware Identifier</th>
                  <th>Asset Name</th>
                  <th>Custodian / Target</th>
                  <th>Timestamp</th>
                  <th>Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (item of recentHistory(); track item.id) {
                  <tr class="feed-row">
                    <td>
                      <span [class]="getActionBadgeClass(item.action_type)">
                        {{ item.action_type }}
                      </span>
                    </td>
                    <td>
                      <span class="code-font font-bold text-sky">{{ item.asset_code }}</span>
                    </td>
                    <td class="font-medium text-white">
                      {{ item.asset_name || 'Hardware Unit' }}
                    </td>
                    <td>
                      @if (item.employee) {
                        <div class="custodian-badge">
                          <span class="custodian-avatar">{{ item.employee.charAt(0) }}</span>
                          <span>{{ item.employee }}</span>
                        </div>
                      } @else {
                        <span class="text-dim">--</span>
                      }
                    </td>
                    <td class="text-muted text-sm">
                      {{ item.action_date | date:'medium' }}
                    </td>
                    <td class="text-dim text-sm notes-cell">
                      {{ item.notes || 'System transaction recorded.' }}
                    </td>
                  </tr>
                }
                @if (recentHistory().length === 0) {
                  <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                      No recent asset history events recorded.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ENTERPRISE DEFENSE-IN-DEPTH RULES SECTION -->
      <section class="rules-card-section">
        <div class="rules-hero-header">
          <div class="rules-badge-accent">DEFENSE-IN-DEPTH ARCHITECTURE</div>
          <h2 class="rules-main-title">Enforced System Business Rules</h2>
          <p class="rules-lead">
            Every operational asset transition is verified through PostgreSQL transactional constraints and Go concurrent mutex guards:
          </p>
        </div>

        <div class="rules-matrix-grid">
          <!-- Rule 1 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-emerald-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-emerald">CONCURRENCY GUARD</div>
              <h4 class="matrix-name">Single-Allocation Integrity</h4>
              <p class="matrix-desc">
                An asset cannot be assigned if it is already allocated to another employee. Simultaneous assignment attempts are blocked.
              </p>
            </div>
          </div>

          <!-- Rule 2 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-amber-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-amber">MAINTENANCE SHIELD</div>
              <h4 class="matrix-name">Repair Exclusion Guard</h4>
              <p class="matrix-desc">
                An asset marked under repair cannot be assigned to any staff member until it has been inspected and returned to Available status.
              </p>
            </div>
          </div>

          <!-- Rule 3 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-red-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-red">TERMINAL LOCK</div>
              <h4 class="matrix-name">Decommission Lockout</h4>
              <p class="matrix-desc">
                A retired asset is placed into permanent archive state and can never be assigned, preventing ghost equipment from entering production.
              </p>
            </div>
          </div>

          <!-- Rule 4 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-indigo-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-indigo">ACID AUDIT LOG</div>
              <h4 class="matrix-name">Automated Return Audit</h4>
              <p class="matrix-desc">
                Returning an asset atomically resets custodian status and writes an indelible historical entry with previous employee and notes.
              </p>
            </div>
          </div>

          <!-- Rule 5 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-sky-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-sky">DATABASE CONSTRAINT</div>
              <h4 class="matrix-name">Global Hardware Uniqueness</h4>
              <p class="matrix-desc">
                Asset codes and manufacturer serial numbers are enforced strictly unique by database B-Tree indexes, preventing duplicate assets.
              </p>
            </div>
          </div>

          <!-- Rule 6 -->
          <div class="matrix-card">
            <div class="matrix-icon bg-purple-soft">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="matrix-content">
              <div class="matrix-tag text-purple">DIRECTORY SYNCHRONIZATION</div>
              <h4 class="matrix-name">Custodian Auto-Sync</h4>
              <p class="matrix-desc">
                Active possession counts across the employee directory update in real-time with automated cascade updates upon any allocation or return.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      gap: 3rem;
      padding-bottom: 4rem;
    }

    /* HERO EXECUTIVE BANNER */
    .hero-card {
      position: relative;
      background: linear-gradient(135deg, rgba(19, 27, 46, 0.85) 0%, rgba(13, 19, 34, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-xl);
      padding: 3.5rem 3rem;
      overflow: hidden;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
    }

    .hero-ambient-glow {
      position: absolute;
      top: -160px;
      right: 15%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      filter: blur(60px);
    }

    .hero-mesh-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 32px 32px;
      opacity: 0.6;
      pointer-events: none;
    }

    .hero-layout {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 3rem;
      align-items: center;
    }

    @media (max-width: 1100px) {
      .hero-layout {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      .hero-card {
        padding: 2.25rem 1.75rem;
      }
    }

    /* Hero Left */
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(99, 102, 241, 0.14);
      border: 1px solid rgba(99, 102, 241, 0.35);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
    }

    .pulse-beacon {
      width: 8px;
      height: 8px;
      background: #38bdf8;
      border-radius: 50%;
      box-shadow: 0 0 10px #38bdf8;
      animation: pulse 2s infinite;
    }

    .badge-text {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #a5b4fc;
    }

    .badge-version {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
    }

    .hero-headline {
      font-size: 2.75rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.18;
      letter-spacing: -0.025em;
      margin-bottom: 1.25rem;
    }

    @media (max-width: 768px) {
      .hero-headline {
        font-size: 2rem;
      }
    }

    .gradient-text {
      background: linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-lead {
      font-size: 1.05rem;
      color: #94a3b8;
      line-height: 1.65;
      margin-bottom: 2rem;
      max-width: 620px;
    }

    /* Hero CTAs */
    .hero-cta-group {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin-bottom: 2.25rem;
    }

    .btn-primary-glow {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.6rem;
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-primary-glow:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -4px rgba(99, 102, 241, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    .btn-primary-glow:hover .chevron-forward {
      transform: translateX(4px);
    }

    .btn-icon-wrapper {
      background: rgba(255, 255, 255, 0.15);
      padding: 0.45rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-text-content {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .btn-title {
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .btn-subtitle {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.75);
    }

    .chevron-forward {
      transition: transform 0.2s ease;
      margin-left: 0.25rem;
    }

    .btn-secondary-glass {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md);
      padding: 0.95rem 1.4rem;
      color: #e2e8f0;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }

    .btn-secondary-glass:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      transform: translateY(-2px);
    }

    .tech-spec-bar {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .spec-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 500;
    }

    .spec-divider {
      color: rgba(255, 255, 255, 0.2);
    }

    /* Hero Right: Telemetry Hologram Console */
    .telemetry-console {
      background: rgba(10, 15, 26, 0.85);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.12);
    }

    .console-header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .window-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .console-title {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }

    .console-prompt {
      color: #818cf8;
    }

    .status-live-tag {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #34d399;
      background: rgba(16, 185, 129, 0.12);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .live-dot-sm {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
      animation: pulse 1.5s infinite;
    }

    .console-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .console-stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .console-chip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-sm);
      padding: 0.6rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .chip-label {
      font-size: 0.6875rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }

    .chip-val {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .text-green { color: #34d399; }
    .text-cyan { color: #38bdf8; }
    .text-purple { color: #c084fc; }

    /* Topology Box */
    .topology-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: 1rem;
    }

    .topology-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.08em;
      margin-bottom: 0.75rem;
    }

    .topology-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .topo-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.6875rem;
      color: #cbd5e1;
      font-weight: 600;
    }

    .topo-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .bg-emerald { background: #10b981; }
    .bg-indigo { background: #6366f1; }
    .bg-sky { background: #0284c7; }
    .bg-amber { background: #f59e0b; }

    .topo-connector {
      flex: 1;
      padding: 0 0.4rem;
      display: flex;
      align-items: center;
    }

    .connector-line {
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(99, 102, 241, 0.5) 50%, rgba(255, 255, 255, 0.1) 100%);
    }

    .console-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .console-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-action-add {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
      color: #a5b4fc;
    }
    .btn-action-add:hover {
      background: #6366f1;
      color: #ffffff;
    }

    .btn-action-assign {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.35);
      color: #7dd3fc;
    }
    .btn-action-assign:hover {
      background: #0284c7;
      color: #ffffff;
    }

    .console-footer-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
      color: #64748b;
      line-height: 1.4;
      background: rgba(255, 255, 255, 0.02);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
    }

    .console-footer-note code {
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: var(--font-mono);
    }

    /* SECTION COMMON BLOCKS */
    .section-block {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }

    .section-title-group {
      display: flex;
      flex-direction: column;
    }

    .section-kicker {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #818cf8;
      letter-spacing: 0.08em;
      margin-bottom: 0.2rem;
    }

    .section-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }

    .section-subtitle-text {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .section-meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #34d399;
    }

    .live-dot-green {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
    }

    /* STATS GLASS GRID */
    .stats-glass-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    @media (max-width: 1024px) {
      .stats-glass-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-glass-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-glass-card {
      background: rgba(19, 27, 46, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .stat-glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      transition: background 0.2s ease;
    }

    .card-glow-indigo:hover {
      border-color: rgba(99, 102, 241, 0.45);
      box-shadow: 0 16px 32px -8px rgba(99, 102, 241, 0.25);
      transform: translateY(-3px);
    }
    .card-glow-indigo::before { background: linear-gradient(90deg, #6366f1, #818cf8); }

    .card-glow-emerald:hover {
      border-color: rgba(16, 185, 129, 0.45);
      box-shadow: 0 16px 32px -8px rgba(16, 185, 129, 0.25);
      transform: translateY(-3px);
    }
    .card-glow-emerald::before { background: linear-gradient(90deg, #10b981, #34d399); }

    .card-glow-sky:hover {
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 16px 32px -8px rgba(56, 189, 248, 0.25);
      transform: translateY(-3px);
    }
    .card-glow-sky::before { background: linear-gradient(90deg, #0284c7, #38bdf8); }

    .card-glow-amber:hover {
      border-color: rgba(245, 158, 11, 0.45);
      box-shadow: 0 16px 32px -8px rgba(245, 158, 11, 0.25);
      transform: translateY(-3px);
    }
    .card-glow-amber::before { background: linear-gradient(90deg, #d97706, #fbbf24); }

    .stat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-category-label {
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #94a3b8;
    }

    .stat-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bg-icon-indigo { background: rgba(99, 102, 241, 0.15); }
    .bg-icon-emerald { background: rgba(16, 185, 129, 0.15); }
    .bg-icon-sky { background: rgba(56, 189, 248, 0.15); }
    .bg-icon-amber { background: rgba(245, 158, 11, 0.15); }

    .stat-number-wrap {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
    }

    .stat-hero-number {
      font-size: 2.75rem;
      font-weight: 800;
      line-height: 1;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .stat-unit {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #64748b;
    }

    .stat-badge-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }

    .tag-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .tag-sky { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .tag-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

    .stat-description {
      font-size: 0.8125rem;
      color: #94a3b8;
      line-height: 1.45;
      margin: 0;
      flex: 1;
    }

    .stat-distribution-meter {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-top: 0.2rem;
    }

    .meter-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
    }

    .meter-segment {
      height: 100%;
    }

    .seg-available { background: #10b981; }
    .seg-assigned { background: #38bdf8; }
    .seg-repair { background: #f59e0b; }

    .meter-legend {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: #64748b;
    }

    .meter-ratio {
      font-weight: 600;
      color: #818cf8;
    }

    .stat-card-action {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #818cf8;
      display: flex;
      align-items: center;
      transition: color 0.15s ease;
    }

    .stat-glass-card:hover .stat-card-action {
      color: #ffffff;
    }

    .text-emerald { color: #34d399; }
    .text-sky { color: #38bdf8; }
    .text-amber { color: #fbbf24; }

    /* OPERATIONS FAST-TRACK NAVIGATION HUB */
    .hub-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    @media (max-width: 1100px) {
      .hub-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .hub-grid {
        grid-template-columns: 1fr;
      }
    }

    .hub-interactive-card {
      background: rgba(19, 27, 46, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      padding: 1.75rem 1.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .hub-interactive-card:hover {
      background: rgba(24, 34, 58, 0.85);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15);
    }

    .hub-accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .bg-gradient-indigo { background: linear-gradient(90deg, #6366f1, #a5b4fc); }
    .bg-gradient-sky { background: linear-gradient(90deg, #0284c7, #38bdf8); }
    .bg-gradient-emerald { background: linear-gradient(90deg, #10b981, #6ee7b7); }
    .bg-gradient-amber { background: linear-gradient(90deg, #f59e0b, #fde68a); }

    .hub-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .hub-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bg-box-indigo { background: rgba(99, 102, 241, 0.14); }
    .bg-box-sky { background: rgba(56, 189, 248, 0.14); }
    .bg-box-emerald { background: rgba(16, 185, 129, 0.14); }
    .bg-box-amber { background: rgba(245, 158, 11, 0.14); }

    .hub-tag {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.08em;
    }

    .hub-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.65rem;
    }

    .hub-desc {
      font-size: 0.8125rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1.5rem;
      flex: 1;
    }

    .hub-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 0.85rem;
    }

    .hub-action-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: #818cf8;
      transition: all 0.2s ease;
    }

    .hub-interactive-card:hover .hub-action-link {
      color: #ffffff;
      transform: translateX(4px);
    }

    /* RECENT OPERATIONS ACTIVITY FEED */
    .activity-feed-glass {
      padding: 0;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }

    .feed-row {
      transition: background-color 0.15s ease;
    }

    .feed-row:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .custodian-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .custodian-avatar {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      border-radius: 50%;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .notes-cell {
      max-width: 240px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* RULES DEFENSE-IN-DEPTH SECTION */
    .rules-card-section {
      background: linear-gradient(180deg, rgba(19, 27, 46, 0.8) 0%, rgba(13, 19, 34, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-xl);
      padding: 3rem 2.5rem;
      backdrop-filter: blur(16px);
    }

    @media (max-width: 768px) {
      .rules-card-section {
        padding: 2rem 1.5rem;
      }
    }

    .rules-hero-header {
      margin-bottom: 2.25rem;
    }

    .rules-badge-accent {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.08em;
      margin-bottom: 0.4rem;
    }

    .rules-main-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.4rem;
    }

    .rules-lead {
      font-size: 0.875rem;
      color: #94a3b8;
      max-width: 720px;
    }

    .rules-matrix-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    @media (max-width: 1024px) {
      .rules-matrix-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .rules-matrix-grid {
        grid-template-columns: 1fr;
      }
    }

    .matrix-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .matrix-card:hover {
      background: rgba(24, 34, 58, 0.6);
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateY(-2px);
    }

    .matrix-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bg-emerald-soft { background: rgba(16, 185, 129, 0.15); }
    .bg-amber-soft { background: rgba(245, 158, 11, 0.15); }
    .bg-red-soft { background: rgba(239, 68, 68, 0.15); }
    .bg-indigo-soft { background: rgba(99, 102, 241, 0.15); }
    .bg-sky-soft { background: rgba(56, 189, 248, 0.15); }
    .bg-purple-soft { background: rgba(192, 132, 252, 0.15); }

    .matrix-content {
      display: flex;
      flex-direction: column;
    }

    .matrix-tag {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin-bottom: 0.25rem;
    }

    .text-red { color: #f87171; }
    .text-indigo { color: #818cf8; }

    .matrix-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.35rem;
    }

    .matrix-desc {
      font-size: 0.75rem;
      color: #94a3b8;
      line-height: 1.45;
      margin: 0;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }
  `]
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private assetService = inject(AssetService);

  public totalCount = signal<number>(0);
  public availableCount = signal<number>(0);
  public assignedCount = signal<number>(0);
  public repairCount = signal<number>(0);
  public recentHistory = signal<AssetHistory[]>([]);

  ngOnInit() {
    this.loadStats();
    this.loadRecentActivity();
  }

  loadStats() {
    this.assetService.getAssets().subscribe({
      next: (assets) => {
        let avail = 0;
        let assigned = 0;
        let repair = 0;

        for (const a of assets) {
          if (isAvailable(a.status)) avail++;
          else if (isAssigned(a.status)) assigned++;
          else if (isUnderRepair(a.status)) repair++;
        }

        this.totalCount.set(assets.length);
        this.availableCount.set(avail);
        this.assignedCount.set(assigned);
        this.repairCount.set(repair);
      }
    });
  }

  loadRecentActivity() {
    this.assetService.getAssetHistory(undefined, undefined, undefined, 5).subscribe({
      next: (history) => {
        this.recentHistory.set(history || []);
      }
    });
  }

  getPercent(count: number): number {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getActionBadgeClass(action: string): string {
    const lower = (action || '').toLowerCase();
    if (lower.includes('creat')) return 'badge badge-available';
    if (lower.includes('assign')) return 'badge badge-assigned';
    if (lower.includes('return')) return 'badge badge-available';
    if (lower.includes('repair')) return 'badge badge-repair';
    if (lower.includes('retire')) return 'badge badge-retired';
    return 'badge badge-assigned';
  }

  // Programmatic Redirection Methods
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToRoute(path: string, queryParams?: any) {
    if (queryParams) {
      this.router.navigate([path], { queryParams });
    } else {
      this.router.navigate([path]);
    }
  }
}
