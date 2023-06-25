export interface Customer {
  readonly customerId?: number;
  customerName?: string;
  customerInfo?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
