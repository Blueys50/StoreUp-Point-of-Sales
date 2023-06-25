import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Cashier } from 'src/models/cashier';
import { QueryParams } from 'src/models/queryParams';
import { StorageService } from './storage.service';
import { Setting } from 'src/models/settings';
import { Customer } from 'src/models/customer';
import { PaymentMethod } from 'src/models/paymentMethod';
import { Item } from 'src/models/item';
import { MultiPrices } from 'src/models/multiPrice';
import { Package } from 'src/models/package';
import { wholesalePrice } from 'src/models/wholesalePrice';
import { salesHeader } from 'src/models/salesHeader';
import { salesDetail } from 'src/models/salesDetail';
import { purchaseHeader } from 'src/models/purchaseHeader';
import { purchaseDetail } from 'src/models/purchaseDetail';
import { endOfDay, format, isSameDay, isWithinInterval } from 'date-fns';
import { ReportQuery } from 'src/models/reportQuery';
import { sq } from 'date-fns/locale';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  purchaseListCache: any[] = [];
  databaseObj: SQLiteObject;
  tables = {
    cashiers: 'cashiers',
    customers: 'customers',
    paymentMethod: 'paymentMethod',
    items: 'items',
    multiPrice: 'multiPrice',
    package: 'package',
    wholesalePrice: 'wholesalePrice',
    salesHeader: 'salesHeader',
    salesDetail: 'salesDetail',
    purchaseHeader: 'purchaseHeader',
    purchaseDetail: 'purchaseDetail',
  };

  constructor(private sqlite: SQLite, private storageService: StorageService) {}

  async createDatabase(justCheck?: boolean) {
    await this.sqlite
      .create({
        name: 'storeUp',
        location: 'default',
      })
      .then(async (db: SQLiteObject) => {
        this.databaseObj = db;
        await this.databaseObj.executeSql('PRAGMA foreign_keys = ON;', []);
      })
      .catch((e) => {
        alert('error on creating database ' + JSON.stringify(e));
      });
    if (justCheck) {
      await this.createTables(true);
    }
  }

  async createTables(makeDefault?: boolean) {
    let basicTableCols = `createdBy varchar(255), createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, updatedBy varchar(255), updatedDate DATETIME, isArchived BOOLEAN DEFAULT 0, archivedBy varchar(255), archivedDate DATETIME, lastBackupDate DATETIME`;

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.cashiers} (cashierId INTEGER PRIMARY KEY AUTOINCREMENT, cashierName VARCHAR(255) NOT NULL, pin INTEGER, lastLogin DATETIME, lastLogout DATETIME, ${basicTableCols})`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.customers} (customerId INTEGER PRIMARY KEY AUTOINCREMENT, customerName VARCHAR(255) NOT NULL, customerInfo TEXT, customerEmail TEXT, customerPhone TEXT, ${basicTableCols})`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.paymentMethod} (paymentMethodName VARCHAR(255) PRIMARY KEY, ${basicTableCols})`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.items} (itemId INTEGER PRIMARY KEY AUTOINCREMENT, itemCode VARCHAR(255), itemName VARCHAR(255) NOT NULL, buyingPrice REAL, sellingPrice REAL NOT NULL, stock INTEGER, isCountStock BOOLEAN DEFAULT 0, unitName VARCHAR(255), ${basicTableCols})`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.multiPrice} (multiPriceId INTEGER PRIMARY KEY AUTOINCREMENT, price REAL, description VARCHAR(255) NOT NULL, ${basicTableCols}, itemId INTEGER, FOREIGN KEY (itemId) REFERENCES ${this.tables.items}(itemId))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.package} (packageId INTEGER PRIMARY KEY AUTOINCREMENT, packagePrice REAL, packageName VARCHAR(255) NOT NULL, packageQty INTEGER NOT NULL, ${basicTableCols}, itemId INTEGER, FOREIGN KEY (itemId) REFERENCES ${this.tables.items}(itemId))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.wholesalePrice} (wholesalePriceId INTEGER PRIMARY KEY AUTOINCREMENT, price REAL, minimumQty integer NOT NULL, ${basicTableCols}, itemId INTEGER, FOREIGN KEY (itemId) REFERENCES ${this.tables.items}(itemId))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.salesHeader} (salesHeaderId INTEGER PRIMARY KEY AUTOINCREMENT, totalPrice REAL, payment REAL, change REAL, totalItem integer NOT NULL, isCredit BOOLEAN DEFAULT 0, ${basicTableCols}, customerId INTEGER, cashierId INTEGER, paymentMethodName VARCHAR(255), FOREIGN KEY (customerId) REFERENCES ${this.tables.customers}(customerId), FOREIGN KEY (cashierId) REFERENCES ${this.tables.cashiers}(cashierId), FOREIGN KEY (paymentMethodName) REFERENCES ${this.tables.paymentMethod}(paymentMethodName))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.salesDetail} (salesDetailId INTEGER PRIMARY KEY AUTOINCREMENT, sellingPrice REAL, qty INTEGER, unit VARCHAR(255), ${basicTableCols}, salesDetailHeaderId INTEGER, itemId INTEGER, FOREIGN KEY (salesDetailHeaderId) REFERENCES ${this.tables.salesHeader}(salesHeaderId), FOREIGN KEY (itemId) REFERENCES ${this.tables.items}(itemId))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.purchaseHeader} (purchaseHeaderId INTEGER PRIMARY KEY AUTOINCREMENT, totalPrice REAL, payment REAL, change REAL, totalItem integer NOT NULL, isCredit BOOLEAN DEFAULT 0, ${basicTableCols}, cashierId INTEGER, paymentMethodName VARCHAR(255), FOREIGN KEY (cashierId) REFERENCES ${this.tables.cashiers}(cashierId), FOREIGN KEY (paymentMethodName) REFERENCES ${this.tables.paymentMethod}(paymentMethodName))`,
      []
    );

    await this.databaseObj.executeSql(
      `CREATE TABLE IF NOT EXISTS ${this.tables.purchaseDetail} (purchaseDetailId INTEGER PRIMARY KEY AUTOINCREMENT, sellingPrice REAL, qty INTEGER, unit VARCHAR(255), ${basicTableCols}, purchaseDetailHeaderId INTEGER, itemId INTEGER, FOREIGN KEY (purchaseDetailHeaderId) REFERENCES ${this.tables.purchaseHeader}(purchaseHeaderId), FOREIGN KEY (itemId) REFERENCES ${this.tables.items}(itemId))`,
      []
    );
    if (makeDefault) {
      await this.createDefaultData();
    }
  }
  async createDefaultData() {
    let d: Setting = await this.storageService.get(Setting.storageKey);
    let isNew = false;
    if (!d?.activeCashier) {
      let cashier: Cashier = {
        cashierId: 1,
        cashierName: 'Default Cashier',
      };
      await this.addCashier(cashier, true);
      isNew = true;
    }
    if (!d?.defaultCustomer) {
      let customer: Customer = {
        customerId: 1,
        customerName: 'Default Customer',
      };
      await this.addCustomer(customer, true);
      isNew = true;
    }
    if (!d?.defaultPaymentMethod) {
      let paymentMethod: PaymentMethod = {
        paymentMethodName: 'Cash',
      };
      await this.addPaymentMethod(paymentMethod, true);
      isNew = true;
    }
    if (isNew) {
      const cashierList = await this.getCashiers(1);
      const customerList = await this.getCustomer(1);
      const paymentMethodList = await this.getPaymentMethod('Cash');
      let setting: Setting | any = {
        activeCashier: cashierList[0],
        defaultCustomer: customerList[0],
        defaultPaymentMethod: paymentMethodList[0],
      };
      this.storageService.set(Setting.storageKey, setting);
    }

    // let a = await this.storageService.get(Setting.storageKey);
  }

  getTime() {
    let currentDate = new Date();
    let iso8601Date = currentDate.toISOString();
    return iso8601Date;
  }

  async getAddSQL(
    table: string,
    item: salesHeader | any,
    isDefault?: boolean,
    isBackup?: boolean
  ): Promise<string> {
    let time = this.getTime();
    let sql = `INSERT INTO ${table} (createdDate`;
    let sqlValue = ` VALUES ('${time}'`;
    if (!isDefault) {
      let setting: Setting = await this.storageService.get(Setting.storageKey);
      let activeCashier;
      if (setting?.activeCashier) {
        activeCashier = setting.activeCashier?.cashierName;
      }
      sql += `, createdBy`;
      sqlValue += `, '${activeCashier}'`;
    }
    if (isBackup) {
      sql = `INSERT INTO ${table} (`;
      sqlValue = ` VALUES (`;
    }
    let firstKey = true;
    for (let key in item) {
      let value = item[key];
      if (firstKey && isBackup) {
        if (value) {
          sql += ` ${key}`;
          if (!isNaN(value) && typeof +value === 'number') {
            sqlValue += ` ${value}`;
          } else {
            sqlValue += ` '${value}'`;
          }
          firstKey = false;
        }
      } else {
        if (value) {
          sql += `, ${key}`;
          if (!isNaN(value) && typeof +value === 'number') {
            sqlValue += `, ${value}`;
          } else {
            sqlValue += `, '${value}'`;
          }
        }
      }
    }
    sql += `)`;
    sqlValue += `)`;
    return sql + sqlValue;
  }

  async getEditSql(
    table: string,
    item,
    key: string,
    id?: number,
    idString?: string,
    updatedBy?: string
  ): Promise<string> {
    let time = this.getTime();
    let setting: Setting = await this.storageService.get(Setting.storageKey);
    let activeCashier = setting.activeCashier?.cashierName;
    let sqlStatement = `UPDATE ${table} SET updatedBy = '${
      updatedBy ? updatedBy : activeCashier
    }', updatedDate = '${time}'`;
    for (let key in item) {
      let value = item[key];
      if (value || key == 'isArchived' || key == 'isCredit') {
        if (
          !isNaN(value) &&
          typeof +value === 'number' &&
          (key == 'isArchived' || key == 'isCredit')
        ) {
          sqlStatement += `, ${key} = ${value}`;
        } else if (typeof value === 'boolean') {
          sqlStatement += `, ${key} = ${value ? 1 : 0}`;
          let updateStatement = value
            ? `, archivedBy = '${activeCashier}', archivedDate = '${time}'`
            : '';
          sqlStatement += updateStatement;
        } else {
          sqlStatement += `, ${key} = '${value}'`;
        }
      }
    }
    if (idString) {
      sqlStatement += ` WHERE ${key} = '${idString}'`;
    } else {
      sqlStatement += ` WHERE ${key} = ${id}`;
    }
    return sqlStatement;
  }

  async getGetSql(
    table: string,
    keyName: string,
    sortBy: string,
    keyId?: string,
    id?: number,
    params?: QueryParams,
    idString?,
    useOrderBy?
  ): Promise<string> {
    let sql = `SELECT * FROM ${table}`;
    if (id && !idString) sql += ` WHERE ${keyId} = ${id}`;
    else if (idString) {
      sql += ` WHERE ${keyId} = '${idString}'`;
    } else {
      let whereClause = '';
      if (params?.search) {
        const search = params.search.toLowerCase();
        if (table != this.tables.items) {
          whereClause += `${keyName} COLLATE NOCASE LIKE '%${search}%'`;
        } else {
          whereClause += `(${keyName} COLLATE NOCASE LIKE '%${search}%' OR itemCode COLLATE NOCASE LIKE '%${search}%')`;
        }
      }
      if (params?.isArchived !== undefined) {
        const isArchived = params.isArchived ? 1 : 0;
        whereClause += `${
          whereClause ? ' AND ' : ''
        }isArchived = ${isArchived}`;
      }

      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }

      if (params?.limit) {
        sql += ` LIMIT ${params.limit}`;
      }
      if (params?.offset) {
        sql += ` OFFSET ${params.offset}`;
      }
    }
    if (!useOrderBy) {
      sql += ` ORDER BY ${sortBy} ASC`;
    }
    return sql;
  }

  async checkPaymentNameIsUnique(name: string) {
    let sql = `SELECT * FROM ${this.tables.paymentMethod} WHERE paymentMethodName = '${name}'`;
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const paymentMethod: PaymentMethod[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          paymentMethod.push(res.rows.item(i));
        }
        return paymentMethod;
      })
      .catch((e) => {
        return 'Error on getting categories ' + JSON.stringify(e);
      });
  }

  async addCashier(cashier: Cashier, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.cashiers,
      cashier,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Cashier created successfully';
      })
      .catch((e) => {
        if (!isDefault) {
          alert('Error on making cashier');
        }
        return 'Error on creating cashier ' + JSON.stringify(e);
      });
  }

  async getCashiers(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.cashiers,
      'cashierName',
      'cashierName',
      'cashierId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const cashiers: Cashier[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          cashiers.push(res.rows.item(i));
        }
        return cashiers;
      })
      .catch((e) => {
        return 'Error on getting categories ' + JSON.stringify(e);
      });
  }

  async editCashier(cashier: Cashier, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.cashiers,
      cashier,
      'cashierId',
      cashier.cashierId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating cashier');
        return 'Error on updating cashier ' + JSON.stringify(e);
      });
  }

  async addMultPrice(multiPrice: MultiPrices, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.multiPrice,
      multiPrice,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'MultiPrice created successfully';
      })
      .catch((e) => {
        alert('Error on making MultiPrice');
        return 'Error on creating MultiPrice ' + JSON.stringify(e);
      });
  }

  async getMultiPrice(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.multiPrice,
      '',
      'multiPriceId',
      'itemId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const multiPrices: MultiPrices[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          multiPrices.push(res.rows.item(i));
        }
        return multiPrices;
      })
      .catch((e) => {
        return 'Error on getting multiPrice ' + JSON.stringify(e);
      });
  }

  async editMultiPrice(multiPrices: MultiPrices, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.multiPrice,
      multiPrices,
      'multiPriceId',
      multiPrices.multiPriceId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating multiPrice');
        return 'Error on updating multiPrice ' + JSON.stringify(e);
      });
  }

  async addWholesalePrice(wholesalePrice: wholesalePrice, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.wholesalePrice,
      wholesalePrice,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Wholesale price created successfully';
      })
      .catch((e) => {
        alert('Error on making wholesalePrice');
        return 'Error on creating wholesalePrice ' + JSON.stringify(e);
      });
  }

  async getWholesalePrice(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.wholesalePrice,
      '',
      'wholesalePriceId',
      'itemId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const wholesalePrice: wholesalePrice[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          wholesalePrice.push(res.rows.item(i));
        }
        return wholesalePrice;
      })
      .catch((e) => {
        return 'Error on getting wholesalePrice ' + JSON.stringify(e);
      });
  }

  async editWholesalePrice(wholesalePrice: wholesalePrice, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.wholesalePrice,
      wholesalePrice,
      'wholesalePriceId',
      wholesalePrice.wholesalePriceId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating wholesale price');
        return 'Error on updating wholesale price  ' + JSON.stringify(e);
      });
  }

  async addSalesHeader(salesHeader: salesHeader, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.salesHeader,
      salesHeader,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then((result) => {
        return result.insertId;
      })
      .catch((e) => {
        alert('Error on making salesHeader');
        return 'Error on creating salesHeader ' + JSON.stringify(e);
      });
  }

  async getSalesHeader(reportQuery?: ReportQuery, isBackupdata?: boolean) {
    let sql = `SELECT salesHeader.*, cashiers.cashierName as createdByCashier, customers.customerName as customerName FROM ${this.tables.salesHeader} JOIN customers ON salesHeader.customerId = customers.customerId JOIN cashiers ON salesHeader.cashierId = cashiers.cashierId`;
    if (reportQuery) {
      let startdate = format(reportQuery?.startDate as any, 'yyyy-MM-dd');
      let endDate = format(reportQuery?.endDate as any, 'yyyy-MM-dd');
      if (
        !isSameDay(reportQuery?.startDate as any, reportQuery?.endDate as any)
      ) {
        sql =
          sql +
          ` WHERE DATE(salesHeader.createdDate) BETWEEN '${startdate}' AND '${endDate}'`;
      } else {
        sql = sql + ` WHERE DATE(salesHeader.createdDate) = '${startdate}'`;
      }
      if (reportQuery.showOnlyId) {
        sql = sql + ` AND salesHeader.customerId = ${reportQuery.showOnlyId}`;
      }
    }
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const salesHeader: salesHeader[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          const date = new Date(res.rows.item(i).createdDate);
          const formattedDate = format(date, 'dd MMMM yyyy, HH:mm');
          let sh: salesHeader | any = {
            ...res.rows.item(i),
            createdDateFormatted: formattedDate,
          };
          if (isBackupdata) {
            delete sh.createdDateFormatted;
            delete sh.createdByCashier;
            delete sh.customerName;
          }
          salesHeader.push(sh);
        }
        console.log(salesHeader);
        return salesHeader;
      })
      .catch((e) => {
        console.log(e);
        return 'Error on getting salesHeader ' + JSON.stringify(e);
      });
  }

  async editSalesHeader(salesHeader: salesHeader, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.salesHeader,
      salesHeader,
      'salesHeaderId',
      salesHeader.salesHeaderId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating salesHeader ');
        return 'Error on updating salesHeader   ' + JSON.stringify(e);
      });
  }

  async addSalesDetail(salesDetail: salesDetail, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.salesDetail,
      salesDetail,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'salesDetail price created successfully';
      })
      .catch((e) => {
        alert('Error on making salesDetail');
        console.log(e);
        return 'Error on creating salesDetail ' + JSON.stringify(e);
      });
  }

  async getSalesDetail(
    id?: number,
    params?: QueryParams,
    reportQuery?: ReportQuery
  ) {
    let sql = await this.getGetSql(
      this.tables.salesDetail,
      '',
      'salesDetailId',
      'salesDetailHeaderId',
      id,
      params,
      undefined,
      true
    );
    if (reportQuery) {
      let startdate = format(reportQuery?.startDate as any, 'yyyy-MM-dd');
      let endDate = format(reportQuery?.endDate as any, 'yyyy-MM-dd');
      if (
        !isSameDay(reportQuery?.startDate as any, reportQuery?.endDate as any)
      ) {
        sql =
          sql +
          ` WHERE DATE(createdDate) BETWEEN '${startdate}' AND '${endDate}'`;
      } else {
        sql = sql + ` WHERE DATE(createdDate) = '${startdate}'`;
      }
    }
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const salesDetail: salesDetail[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          salesDetail.push(res.rows.item(i));
        }
        return salesDetail;
      })
      .catch((e) => {
        console.log(e);
        return 'Error on getting salesDetail ' + JSON.stringify(e);
      });
  }

  async editSalesDetail(salesDetail: salesDetail, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.salesDetail,
      salesDetail,
      'salesDetailId',
      salesDetail.salesDetailId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating salesDetail');
        return 'Error on updating salesDetail  ' + JSON.stringify(e);
      });
  }

  async addPurchaseHeader(purchaseHeader: purchaseHeader, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.purchaseHeader,
      purchaseHeader,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then((result) => {
        return result.insertId;
      })
      .catch((e) => {
        alert('Error on making purchaseHeader');
        return 'Error on creating purchaseHeader ' + JSON.stringify(e);
      });
  }

  async getPurchaseHeader(reportQuery?: ReportQuery, isBackupData?: boolean) {
    let sql = `SELECT purchaseHeader.*, cashiers.cashierName as createdByCashier FROM ${this.tables.purchaseHeader} JOIN cashiers ON purchaseHeader.cashierId = cashiers.cashierId`;
    if (reportQuery) {
      let startdate = format(reportQuery?.startDate as any, 'yyyy-MM-dd');
      let endDate = format(reportQuery?.endDate as any, 'yyyy-MM-dd');
      if (
        !isSameDay(reportQuery?.startDate as any, reportQuery?.endDate as any)
      ) {
        sql =
          sql +
          ` WHERE DATE(purchaseHeader.createdDate) BETWEEN '${startdate}' AND '${endDate}'`;
      } else {
        sql = sql + ` WHERE DATE(purchaseHeader.createdDate) = '${startdate}'`;
      }
    }
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const purchaseHeader: purchaseHeader[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          const date = new Date(res.rows.item(i).createdDate);
          const formattedDate = format(date, 'dd MMMM yyyy, HH:mm');
          let ph: purchaseHeader | any = {
            ...res.rows.item(i),
            createdDateFormatted: formattedDate,
          };
          if (isBackupData) {
            delete ph.createdDateFormatted;
            delete ph.createdByCashier;
          }
          purchaseHeader.push(ph);
        }
        return purchaseHeader;
      })
      .catch((e) => {
        return 'Error on getting purchaseHeader ' + JSON.stringify(e);
      });
  }

  async editPurchaseHeader(purchaseHeader: purchaseHeader, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.purchaseHeader,
      purchaseHeader,
      'purchaseHeaderId',
      purchaseHeader.purchaseHeaderId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating purchaseHeader ');
        return 'Error on updating purchaseHeader   ' + JSON.stringify(e);
      });
  }

  async addPurchaseDetail(
    addPurchaseDetail: purchaseDetail,
    isDefault?: boolean
  ) {
    let sqlStatement = await this.getAddSQL(
      this.tables.purchaseDetail,
      addPurchaseDetail,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'addPurchaseDetail price created successfully';
      })
      .catch((e) => {
        alert('Error on making addPurchaseDetail');
        console.log(e);
        return 'Error on creating addPurchaseDetail ' + JSON.stringify(e);
      });
  }

  async getPurchaseDetail(
    id?: number,
    params?: QueryParams,
    reportQuery?: ReportQuery
  ) {
    let sql = await this.getGetSql(
      this.tables.purchaseDetail,
      '',
      'purchaseDetailId',
      'purchaseDetailHeaderId',
      id,
      params,
      undefined,
      true
    );
    if (reportQuery) {
      let startdate = format(reportQuery?.startDate as any, 'yyyy-MM-dd');
      let endDate = format(reportQuery?.endDate as any, 'yyyy-MM-dd');
      if (
        !isSameDay(reportQuery?.startDate as any, reportQuery?.endDate as any)
      ) {
        sql =
          sql +
          ` WHERE DATE(createdDate) BETWEEN '${startdate}' AND '${endDate}'`;
      } else {
        sql = sql + ` WHERE DATE(createdDate) = '${startdate}'`;
      }
      console.log(sql);
    }
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const purchaseDetail: purchaseDetail[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          purchaseDetail.push(res.rows.item(i));
        }
        return purchaseDetail;
      })
      .catch((e) => {
        return [];
        // return 'Error on getting purchaseDetail ' + JSON.stringify(e);
      });
  }

  async editPurchaseDetail(purchaseDetail: purchaseDetail, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.purchaseDetail,
      purchaseDetail,
      'purchaseDetailId',
      purchaseDetail.purchaseDetailId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating purchaseDetail');
        return 'Error on updating purchaseDetail  ' + JSON.stringify(e);
      });
  }

  async addPackage(pack: Package, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.package,
      pack,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Package created successfully';
      })
      .catch((e) => {
        alert('Error on making Package');
        return 'Error on creating Package ' + JSON.stringify(e);
      });
  }

  async getPackage(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.package,
      '',
      'packageId',
      'itemId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const packs: Package[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          packs.push(res.rows.item(i));
        }
        return packs;
      })
      .catch((e) => {
        return 'Error on getting packages ' + JSON.stringify(e);
      });
  }

  async editPackage(pack: Package, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.package,
      pack,
      'packageId',
      pack.packageId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating package');
        return 'Error on updating package ' + JSON.stringify(e);
      });
  }

  async addItem(item: Item, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(this.tables.items, item, isDefault);
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then((result) => {
        return result.insertId;
        return 'Item created successfully';
      })
      .catch((e) => {
        alert('Error on making Item');
        return 'Error on creating Item ' + JSON.stringify(e);
      });
  }

  async getItems(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.items,
      'itemName',
      'itemId',
      'itemId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const items: Item[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          items.push(res.rows.item(i));
        }
        return items;
      })
      .catch((e) => {
        return 'Error on getting items ' + JSON.stringify(e);
      });
  }

  async editItem(item: Item, updatedBy?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.items,
      item,
      'itemId',
      item.itemId as any,
      '',
      updatedBy
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating item');
        return 'Error on updating item ' + JSON.stringify(e);
      });
  }

  async addPaymentMethod(paymentMethod: PaymentMethod, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.paymentMethod,
      paymentMethod,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Payment method created successfully';
      })
      .catch((e) => {
        if (!isDefault) alert('Error on making payment method');
        return 'Error on creating payment method ' + JSON.stringify(e);
      });
  }

  async getPaymentMethod(id?: string, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.paymentMethod,
      'paymentMethodName',
      'paymentMethodName',
      'paymentMethodName',
      undefined,
      params,
      id
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const cashiers: Cashier[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          cashiers.push(res.rows.item(i));
        }
        return cashiers;
      })
      .catch((e) => {
        return 'Error on getting payment method ' + JSON.stringify(e);
      });
  }

  async editPaymentMethod(paymentMethod: PaymentMethod, oldName?: string) {
    let sqlStatement = await this.getEditSql(
      this.tables.paymentMethod,
      paymentMethod,
      'paymentMethodName',
      undefined,
      oldName ? oldName : paymentMethod.paymentMethodName
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating payment method');
        return 'Error on updating payment method ' + JSON.stringify(e);
      });
  }

  async deletePaymentMethod(paymentMethod: PaymentMethod) {
    let sqlStatement = `DELETE FROM ${this.tables.paymentMethod} WHERE paymentMethodName = '${paymentMethod.paymentMethodName}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on deleting payment method');
        return 'Error on deleting payment method ' + JSON.stringify(e);
      });
  }

  async deleteMultiPrice(multiPrice: MultiPrices) {
    let sqlStatement = `DELETE FROM ${this.tables.multiPrice} WHERE multiPriceId = '${multiPrice.multiPriceId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on deleting multiPrice');
        return 'Error on deleting multiPrice ' + JSON.stringify(e);
      });
  }

  async deletePackage(pack: Package) {
    let sqlStatement = `DELETE FROM ${this.tables.package} WHERE packageId = '${pack.packageId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on deleting package');
        return 'Error on deleting package ' + JSON.stringify(e);
      });
  }

  async deleteWholesalePrice(wp: wholesalePrice) {
    let sqlStatement = `DELETE FROM ${this.tables.wholesalePrice} WHERE wholesalePriceId = '${wp.wholesalePriceId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on wholesale price');
        return 'Error on wholesale price ' + JSON.stringify(e);
      });
  }

  async deleteSalesDetail(sd: salesDetail) {
    let sqlStatement = `DELETE FROM ${this.tables.salesDetail} WHERE salesDetailId = '${sd.salesDetailId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on salesDetail ');
        return 'Error on salesDetail  ' + JSON.stringify(e);
      });
  }

  async deletePurchaseDetail(pd: purchaseDetail) {
    let sqlStatement = `DELETE FROM ${this.tables.purchaseDetail} WHERE purchaseDetailId = '${pd.purchaseDetailId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on purchaseDetail ');
        return 'Error on purchaseDetail  ' + JSON.stringify(e);
      });
  }

  async deletePurchaseHeader(ph: purchaseHeader) {
    let sqlStatement = `DELETE FROM ${this.tables.purchaseHeader} WHERE purchaseHeaderId = '${ph.purchaseHeaderId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on purchaseHeader ');
        return 'Error on purchaseHeader  ' + JSON.stringify(e);
      });
  }

  async deleteSalesHeader(sh: salesHeader) {
    let sqlStatement = `DELETE FROM ${this.tables.salesHeader} WHERE salesHeaderId = '${sh.salesHeaderId}'`;
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on salesHeader ');
        return 'Error on salesHeader  ' + JSON.stringify(e);
      });
  }

  async addCustomer(customer: Customer, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      this.tables.customers,
      customer,
      isDefault
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Customer created successfully';
      })
      .catch((e) => {
        if (!isDefault) alert('Error on making cashier');
        return 'Error on creating cashier ' + JSON.stringify(e);
      });
  }

  async getCustomer(id?: number, params?: QueryParams) {
    let sql = await this.getGetSql(
      this.tables.customers,
      'customerName',
      'customerName',
      'customerId',
      id,
      params
    );
    return this.databaseObj
      .executeSql(sql, [])
      .then((res) => {
        const customer: Customer[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          customer.push(res.rows.item(i));
        }
        return customer;
      })
      .catch((e) => {
        return 'Error on getting categories ' + JSON.stringify(e);
      });
  }

  async editCustomer(customer: Customer) {
    let sqlStatement = await this.getEditSql(
      this.tables.customers,
      customer,
      'customerId',
      customer.customerId as any
    );
    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Success';
      })
      .catch((e) => {
        alert('Error on updating customer');
        return 'Error on updating customer ' + JSON.stringify(e);
      });
  }

  async updateLastBackup(currentDate: string) {
    const tableNames: string[] = await this.fetchTableNames();
    for (const tableName of tableNames) {
      const updateQuery = `UPDATE ${tableName} SET lastBackupDate = '${currentDate}'`;
      if (tableName != 'sqlite_sequence') {
        try {
          let a = await this.databaseObj.executeSql(updateQuery, []);
        } catch (error) {
          console.log(tableName, error);
        }
      }
    }
  }

  async fetchTableNames(): Promise<string[]> {
    const query = 'SELECT name FROM sqlite_master WHERE type = "table"';
    const result = await this.databaseObj.executeSql(query, []);
    const tableNames: string[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      tableNames.push(result.rows.item(i).name);
    }

    return tableNames;
  }

  async dropTables(table: string) {
    let query = `DROP TABLE IF EXISTS ${table}`;
    try {
      await this.databaseObj.executeSql(query, []);
    } catch (error) {
      console.log(table, error);
    }
  }

  async addBackupData(tableName: string, cashier, isDefault?: boolean) {
    let sqlStatement = await this.getAddSQL(
      tableName,
      cashier,
      isDefault,
      true
    );

    return this.databaseObj
      .executeSql(sqlStatement, [])
      .then(() => {
        return 'Cashier created successfully';
      })
      .catch((e) => {
        console.log(tableName, e);
        return `Error on making ${tableName}` + JSON.stringify(e);
      });
  }
}
