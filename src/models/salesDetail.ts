export interface salesDetail {
  readonly salesDetailId?: number;
  readonly salesDetailHeaderId?: number;
  readonly itemId?: number;
  sellingPrice?: number;
  unit?: string;
  qty?: number;
  createdBy?: string;
  createdDate?: Date;
  updatedBy?: string;
  updatedDate?: Date;
  isArchived?: boolean;
  archivedBy?: string;
  archivedDate?: Date;
  lastBackupDate?: Date;

  //Only for view
  stockAfter?: number;
  itemName?: string;
  itemCode?: string;
  isCountStock?: boolean;
  totalPrice?: number;
}
