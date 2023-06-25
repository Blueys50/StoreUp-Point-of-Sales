export interface Package {
  readonly packageId?: number;
  readonly itemId?: number;
  packageName?: string;
  packagePrice?: number;
  packageQty?: number;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
