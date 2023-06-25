export interface purchaseHeader {
  readonly purchaseHeaderId?: number;
  readonly cashierId?: number;
  readonly paymentMethodName?: number;
  totalItem?: number;
  totalPrice?: number;
  payment?: number;
  change?: number;
  isCredit?: boolean;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
