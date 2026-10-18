import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { Asset, isAssigned, normalizeStatus } from '../../models/asset.model';

@Component({
  selector: 'app-edit-asset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="edit-asset-page animate-fade-in">
      <div class="page-header compact-header">
        <div>
          <h1 class="page-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Asset: <span style="color: #818cf8; font-family: var(--font-mono);">{{ assetData.asset_code }}</span></span>
          </h1>
          <p class="page-subtitle">Modify specifications, location, or status of this registered hardware item.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/assets" class="btn btn-secondary btn-sm">
            &larr; Back to Asset List
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="card state-box">
        <div class="spinner"></div>
        <p style="margin-top: 1rem;">Loading asset record from database...</p>
      </div>

      <!-- Edit Form -->
      <div class="card form-container" *ngIf="!loading">
        <!-- Error Banner from API -->
        <div *ngIf="apiError" class="api-error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <div>
            <strong>Update Error:</strong> {{ apiError }}
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #editForm="ngForm">
          <div class="form-grid">
            <!-- Asset Code (Read Only) -->
            <div class="form-group">
              <label class="form-label">Asset Code (Permanent ID)</label>
              <input 
                type="text" 
                [value]="assetData.asset_code" 
                disabled 
                class="form-control" 
                style="opacity: 0.6; cursor: not-allowed; font-family: var(--font-mono);"
              />
              <span style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.25rem; display: block;">
                Asset code is an immutable hardware identifier.
              </span>
            </div>

            <!-- Asset Name -->
            <div class="form-group">
              <label class="form-label">
                Asset Name <span class="required">*</span>
              </label>
              <input 
                type="text" 
                name="asset_name"
                [(ngModel)]="assetData.asset_name" 
                required 
                #nameModel="ngModel"
                class="form-control"
                [class.is-invalid]="nameModel.invalid && (nameModel.dirty || nameModel.touched || submitted)"
              />
              <div *ngIf="nameModel.invalid && (nameModel.dirty || nameModel.touched || submitted)" class="error-feedback">
                Asset Name is required.
              </div>
            </div>

            <!-- Asset Type -->
            <div class="form-group">
              <label class="form-label">
                Asset Type <span class="required">*</span>
              </label>
              <select 
                name="asset_type"
                [(ngModel)]="assetData.asset_type" 
                required 
                #typeModel="ngModel"
                class="form-select"
                [class.is-invalid]="typeModel.invalid && (typeModel.dirty || typeModel.touched || submitted)"
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Desktop">Desktop</option>
                <option value="Server">Server</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Tablet">Tablet</option>
                <option value="Networking">Networking</option>
                <option value="Peripheral">Peripheral</option>
                <option value="Audio/Video">Audio/Video</option>
                <option value="Other">Other</option>
              </select>
              <div *ngIf="typeModel.invalid && (typeModel.dirty || typeModel.touched || submitted)" class="error-feedback">
                Asset Type is required.
              </div>
            </div>

            <!-- Serial Number -->
            <div class="form-group">
              <label class="form-label">
                Serial Number <span class="required">*</span>
              </label>
              <input 
                type="text" 
                name="serial_number"
                [(ngModel)]="assetData.serial_number" 
                required 
                #serialModel="ngModel"
                class="form-control"
                [class.is-invalid]="serialModel.invalid && (serialModel.dirty || serialModel.touched || submitted)"
              />
              <div *ngIf="serialModel.invalid && (serialModel.dirty || serialModel.touched || submitted)" class="error-feedback">
                Serial Number is required.
              </div>
            </div>

            <!-- Purchase Date -->
            <div class="form-group">
              <label class="form-label">Purchase Date</label>
              <input 
                type="date" 
                name="purchase_date"
                [(ngModel)]="assetData.purchase_date" 
                class="form-control"
              />
            </div>

            <!-- Location -->
            <div class="form-group">
              <label class="form-label">Physical Location</label>
              <input 
                type="text" 
                name="location"
                [(ngModel)]="assetData.location" 
                placeholder="e.g. Building A - Room 402" 
                class="form-control"
              />
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="form-label">Current Status</label>
              <select name="status" [(ngModel)]="assetData.status" class="form-select">
                <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                <option value="ASSIGNED">ASSIGNED (Allocated)</option>
                <option value="UNDER_REPAIR">UNDER_REPAIR (Maintenance)</option>
                <option value="RETIRED">RETIRED (Decommissioned)</option>
              </select>
            </div>

            <!-- Assigned To (If assigned) -->
            <div class="form-group" *ngIf="isAssignedStatus()">
              <label class="form-label">Assigned Employee</label>
              <input 
                type="text" 
                name="assigned_to"
                [(ngModel)]="assetData.assigned_to" 
                placeholder="Employee full name"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/assets" class="btn btn-secondary btn-sm">Cancel</a>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving">
              <span *ngIf="saving" class="spinner" style="width: 14px; height: 14px; margin-right: 6px;"></span>
              <span>{{ saving ? 'Saving Changes...' : 'Save Changes' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .edit-asset-page {
      max-width: 680px;
      margin: 0 auto;
    }

    .compact-header {
      margin-bottom: 1.25rem;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .page-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .form-container {
      padding: 1.5rem 1.75rem;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-container {
        padding: 1.25rem;
      }
    }

    .form-group {
      margin-bottom: 0.25rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      display: block;
    }

    .form-control, .form-select {
      height: 38px;
      padding: 0.45rem 0.75rem;
      font-size: 0.84rem;
      border-radius: var(--radius-sm);
    }

    .api-error-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: #fca5a5;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    .form-actions .btn {
      padding: 0.5rem 1.1rem;
      font-size: 0.8125rem;
    }
  `]
})
export class EditAssetComponent implements OnInit {
  private assetService = inject(AssetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public assetId = 0;
  public assetData: Partial<Asset> = {};
  public loading = true;
  public saving = false;
  public submitted = false;
  public apiError: string | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.assetId = parseInt(idParam, 10);
      this.loadAsset();
    } else {
      this.router.navigate(['/assets']);
    }
  }

  loadAsset() {
    this.loading = true;
    this.assetService.getAssetById(this.assetId).subscribe({
      next: (asset) => {
        this.assetData = { ...asset };
        if (!this.assetData.asset_type && this.assetData.category) {
          this.assetData.asset_type = this.assetData.category;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isAssignedStatus(): boolean {
    return isAssigned(this.assetData.status);
  }

  onSubmit() {
    this.submitted = true;
    this.apiError = null;

    if (!this.assetData.asset_type && this.assetData.category) {
      this.assetData.asset_type = this.assetData.category;
    }
    if (!this.assetData.category && this.assetData.asset_type) {
      this.assetData.category = this.assetData.asset_type;
    }

    if (!this.assetData.asset_name || !this.assetData.asset_type || !this.assetData.serial_number) {
      return;
    }

    // If status is not ASSIGNED, clear assigned_to
    if (!this.isAssignedStatus()) {
      this.assetData.assigned_to = null;
    }

    this.saving = true;
    this.assetService.updateAsset(this.assetId, this.assetData).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/assets']);
      },
      error: (err) => {
        this.saving = false;
        if (typeof err.error === 'string') {
          this.apiError = err.error;
        } else if (err.error?.message) {
          this.apiError = err.error.message;
        } else {
          this.apiError = 'Failed to update asset. Please check network connection and serial number uniqueness.';
        }
      }
    });
  }
}
