export interface wholesalePrice {
  readonly wholesalePriceId?: number;
  readonly itemId?: number;
  price?: number;
  minimumQty?: number;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
