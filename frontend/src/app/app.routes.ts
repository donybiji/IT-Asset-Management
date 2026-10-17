import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AssetListComponent } from './pages/asset-list/asset-list.component';
import { AddAssetComponent } from './pages/add-asset/add-asset.component';
import { EditAssetComponent } from './pages/edit-asset/edit-asset.component';
import { AssignAssetComponent } from './pages/assign-asset/assign-asset.component';
import { AssetHistoryComponent } from './pages/asset-history/asset-history.component';
import { EmployeesComponent } from './pages/employees/employees.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | IT Asset Management' },
  { path: 'assets', component: AssetListComponent, title: 'Asset Inventory | IT Asset Management' },
  { path: 'assets/new', component: AddAssetComponent, title: 'Register Asset | IT Asset Management' },
  { path: 'assets/edit/:id', component: EditAssetComponent, title: 'Edit Asset | IT Asset Management' },
  { path: 'assign', component: AssignAssetComponent, title: 'Assign Asset | IT Asset Management' },
  { path: 'history', component: AssetHistoryComponent, title: 'Asset Audit History | IT Asset Management' },
  { path: 'employees', component: EmployeesComponent, title: 'Employees Directory | IT Asset Management' },
  { path: '**', redirectTo: 'dashboard' }
];
