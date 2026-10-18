import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetStatus } from '../../models/asset.model';

@Component({
  selector: 'app-add-asset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="add-asset-page animate-fade-in">
      <div class="page-header compact-header">
        <div>
          <h1 class="page-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>Register New IT Asset</span>
          </h1>
          <p class="page-subtitle">Add a newly procured hardware asset or workstation to PostgreSQL inventory.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/assets" class="btn btn-secondary btn-sm">
            &larr; Back to Asset List
          </a>
        </div>
      </div>

      <div class="card form-container">
        <!-- Error Banner from API -->
        <div *ngIf="apiError" class="api-error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <div>
            <strong>Registration Error:</strong> {{ apiError }}
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #assetForm="ngForm">
          <div class="form-grid">
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
                placeholder="e.g. ThinkPad X1 Carbon Gen 11" 
                class="form-control"
                [class.is-invalid]="nameModel.invalid && (nameModel.dirty || nameModel.touched || submitted)"
              />
              <div *ngIf="nameModel.invalid && (nameModel.dirty || nameModel.touched || submitted)" class="error-feedback">
                Asset Name is required.
              </div>
            </div>

            <!-- Asset Code -->
            <div class="form-group">
              <label class="form-label">
                Asset Code (Unique ID) <span class="required">*</span>
              </label>
              <div class="input-with-action">
                <input 
                  type="text" 
                  name="asset_code"
                  [(ngModel)]="assetData.asset_code" 
                  required 
                  #codeModel="ngModel"
                  placeholder="e.g. ASSET-007" 
                  class="form-control"
                  [class.is-invalid]="codeModel.invalid && (codeModel.dirty || codeModel.touched || submitted)"
                />
                <button type="button" (click)="generateAssetCode()" class="btn btn-secondary btn-sm generate-btn" title="Generate next code">
                  Auto
                </button>
              </div>
              <div *ngIf="codeModel.invalid && (codeModel.dirty || codeModel.touched || submitted)" class="error-feedback">
                Asset Code is required and must be unique.
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
                <option value="">-- Select Asset Type --</option>
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
                placeholder="e.g. LNV-TP-994821" 
                class="form-control"
                [class.is-invalid]="serialModel.invalid && (serialModel.dirty || serialModel.touched || submitted)"
              />
              <div *ngIf="serialModel.invalid && (serialModel.dirty || serialModel.touched || submitted)" class="error-feedback">
                Serial Number is required and must be unique.
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
              <label class="form-label">Location / Storage Room</label>
              <input 
                type="text" 
                name="location"
                [(ngModel)]="assetData.location" 
                placeholder="e.g. Floor 2 - IT Server Room or HQ Warehouse" 
                class="form-control"
              />
            </div>

            <!-- Initial Status -->
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label">Initial Status</label>
              <select name="status" [(ngModel)]="assetData.status" class="form-select">
                <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                <option value="UNDER_REPAIR">UNDER_REPAIR (Maintenance)</option>
                <option value="RETIRED">RETIRED (Decommissioned)</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/assets" class="btn btn-secondary btn-sm">Cancel</a>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="submitting">
              <span *ngIf="submitting" class="spinner" style="width: 14px; height: 14px; margin-right: 6px;"></span>
              <span>{{ submitting ? 'Saving Asset...' : 'Register Asset in Database' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .add-asset-page {
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

    .input-with-action {
      display: flex;
      gap: 0.4rem;
    }

    .generate-btn {
      flex-shrink: 0;
      height: 38px;
      padding: 0 0.75rem;
      font-size: 0.75rem;
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
export class AddAssetComponent {
  private assetService = inject(AssetService);
  private router = inject(Router);

  public assetData: Partial<Asset> = {
    asset_name: '',
    asset_code: '',
    asset_type: '',
    category: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    location: 'Main IT Storage Room',
    status: 'AVAILABLE'
  };

  public submitted = false;
  public submitting = false;
  public apiError: string | null = null;

  generateAssetCode() {
    const random = Math.floor(100 + Math.random() * 900);
    this.assetData.asset_code = `ASSET-${random}`;
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

    if (!this.assetData.asset_name || !this.assetData.asset_code || !this.assetData.asset_type || !this.assetData.serial_number) {
      return;
    }

    this.submitting = true;
    this.assetService.createAsset(this.assetData).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/assets']);
      },
      error: (err) => {
        this.submitting = false;
        if (typeof err.error === 'string') {
          this.apiError = err.error;
        } else if (err.error?.message) {
          this.apiError = err.error.message;
        } else {
          this.apiError = 'Failed to save asset. Please verify PostgreSQL connection and unique asset code / serial number.';
        }
      }
    });
  }
}
