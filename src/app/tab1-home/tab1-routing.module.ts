import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';
import { CashierPageComponent } from './cashier-page/cashier-page.component';
import { CustomerPageComponent } from './customer-page/customer-page.component';
import { PaymentMethodPageComponent } from './payment-method-page/payment-method-page.component';
import { ActionReportComponent } from './action-menu/action-report/action-report.component';

const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  },
  {
    path: 'cashier',
    component: CashierPageComponent,
  },
  {
    path: 'customer',
    component: CustomerPageComponent,
  },
  {
    path: 'payment-method',
    component: PaymentMethodPageComponent,
  },
  {
    path: 'action-report',
    component: ActionReportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab1PageRoutingModule {}
