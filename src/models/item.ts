export interface Item {
  readonly itemId?: number;
  itemCode?: string;
  itemName?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  stock?: number;
  isCountStock?: boolean;
  unitName?: string;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;
}
