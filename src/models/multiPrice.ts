export interface MultiPrices {
  readonly multiPriceId?: number;
  readonly itemId?: number;
  description?: string;
  price?: number;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
