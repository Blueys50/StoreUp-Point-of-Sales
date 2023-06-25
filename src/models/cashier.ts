export interface Cashier {
    readonly cashierId?: number;
    cashierName?: string;
    pin?: number;
    lastLogin?: Date;
    lastLogout?: Date;
    createdBy?: string;
    createdDate?: Date;
    updatedBy?: string;
    updatedDate?: Date;
    isArchived?: boolean;
    archivedBy?: string;
    archivedDate?: Date;
    lastBackupDate?: Date;
  }
  