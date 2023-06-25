export interface Company {
  companyName?: string;
  companyAddress?: string;
  currency?: string;
  footerText?: string;
  maxCharLine?: number;
  printer?: {
    name: string;
    address: string;
  };
  allowPrint?: boolean;
}

export namespace Company {
  export const storageKey = 'company';
}
