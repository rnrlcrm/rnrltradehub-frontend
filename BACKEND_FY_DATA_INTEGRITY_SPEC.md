# Backend API Requirements for Data Integrity
## Financial Year Split with End-to-End Data Integrity

**Version:** 2.0  
**Date:** 2025-11-13  
**Priority:** CRITICAL - NO COMPROMISE ON DATA INTEGRITY

---

## Overview

This document defines the backend API requirements for implementing Financial Year (FY) split with **complete data integrity** across all modules. The FY split must follow accounting principles with double-entry bookkeeping and ensure zero data loss or corruption.

### Key Principles

1. **Atomic Operations**: All FY split operations must be atomic (all-or-nothing)
2. **Double Entry**: All accounting entries must balance (Debit = Credit)
3. **Audit Trail**: Every operation must be logged
4. **Data Consistency**: Cross-module consistency must be maintained
5. **Rollback Support**: Failed operations must support rollback
6. **Zero Data Loss**: No transaction or record should be lost during split

---

## 1. Pre-Split Data Integrity Validation

### Endpoint: `POST /api/fy-management/validate-split`

**Purpose**: Run comprehensive data integrity checks before FY split

**Request:**
```json
{
  "financialYearId": 1,
  "validateModules": [
    "sales-contracts",
    "purchase-contracts",
    "invoices",
    "payments",
    "commissions",
    "delivery-orders",
    "disputes",
    "accounts-receivable",
    "accounts-payable",
    "inventory",
    "general-ledger"
  ],
  "checkTypes": [
    "orphaned-records",
    "accounting-balance",
    "pending-approvals",
    "cross-module-consistency",
    "duplicate-transactions",
    "foreign-key-integrity",
    "pending-reconciliations",
    "monetary-calculations",
    "incomplete-transactions",
    "tax-calculations"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "canProceedWithSplit": true,
    "overallStatus": "WARNING",
    "timestamp": "2025-03-31T23:59:59Z",
    "dataIntegrityReport": {
      "checks": [
        {
          "checkName": "Accounting Balance Check (Double Entry)",
          "status": "PASS",
          "message": "All accounting entries are balanced",
          "details": {
            "totalDebit": 10000000.00,
            "totalCredit": 10000000.00,
            "isBalanced": true,
            "openingBalance": 500000.00,
            "closingBalance": 500000.00,
            "variance": 0.00
          }
        },
        {
          "checkName": "Orphaned Records Check",
          "status": "PASS",
          "message": "No orphaned records found",
          "affectedRecords": 0,
          "affectedTables": []
        },
        {
          "checkName": "Cross-Module Consistency",
          "status": "PASS",
          "message": "All module data is consistent",
          "validations": [
            "Invoice totals match payment totals",
            "Contract amounts match delivery amounts",
            "Commission calculations are correct"
          ]
        },
        {
          "checkName": "Bank Reconciliation",
          "status": "WARNING",
          "message": "Some bank statements not reconciled",
          "affectedRecords": 3,
          "details": ["March statements pending"]
        }
      ]
    },
    "moduleWiseSummary": {
      "salesContracts": {
        "total": 65,
        "pending": 8,
        "ongoing": 12,
        "completed": 45,
        "toMigrate": 20,
        "toRetain": 45
      },
      "purchaseContracts": {
        "total": 53,
        "pending": 5,
        "ongoing": 10,
        "completed": 38,
        "toMigrate": 15,
        "toRetain": 38
      },
      "invoices": {
        "total": 173,
        "unpaid": 12,
        "partiallyPaid": 5,
        "paid": 156,
        "toMigrate": 17,
        "totalAmount": 2450000.00
      },
      "payments": {
        "total": 153,
        "pending": 8,
        "cleared": 145,
        "toMigrate": 8,
        "totalAmount": 850000.00
      },
      "commissions": {
        "total": 89,
        "due": 8,
        "paid": 78,
        "pending": 3,
        "toMigrate": 11,
        "totalAmount": 125000.00
      },
      "deliveryOrders": {
        "total": 152,
        "pending": 6,
        "inTransit": 4,
        "delivered": 142,
        "toMigrate": 10
      },
      "disputes": {
        "total": 20,
        "open": 3,
        "underReview": 2,
        "resolved": 15,
        "toMigrate": 5
      },
      "accountsReceivable": {
        "totalOutstanding": 1850000.00,
        "overdue": 450000.00,
        "records": 28
      },
      "accountsPayable": {
        "totalOutstanding": 1200000.00,
        "overdue": 250000.00,
        "records": 18
      },
      "inventory": {
        "openingStock": 15000,
        "closingStock": 18500,
        "valuationMethod": "WEIGHTED_AVERAGE",
        "value": 4625000.00
      },
      "generalLedger": {
        "totalEntries": 2456,
        "unpostedEntries": 0,
        "suspenseEntries": 0
      }
    },
    "accountingBalance": {
      "trialBalance": {
        "totalDebit": 10000000.00,
        "totalCredit": 10000000.00,
        "isBalanced": true
      },
      "profitAndLoss": {
        "revenue": 8500000.00,
        "expenses": 7200000.00,
        "netProfit": 1300000.00
      },
      "balanceSheet": {
        "assets": 5500000.00,
        "liabilities": 3200000.00,
        "equity": 2300000.00,
        "isBalanced": true
      }
    },
    "blockers": [],
    "warnings": [
      "3 bank statements pending reconciliation",
      "12 unpaid invoices will be migrated",
      "8 due commissions will be migrated"
    ]
  }
}
```

---

## 2. Execute FY Split with Transaction Management

### Endpoint: `POST /api/fy-management/execute-split`

**Purpose**: Execute FY split with full transaction management and rollback support

**Request:**
```json
{
  "fromFinancialYearId": 1,
  "toFinancialYearCode": "2025-2026",
  "adminPassword": "encrypted_password",
  "acknowledgements": {
    "dataIntegrityValidated": true,
    "backupCompleted": true,
    "irreversibleAction": true,
    "allStakeholdersNotified": true
  },
  "splitConfiguration": {
    "createBackup": true,
    "backupLocation": "s3://backups/fy-split",
    "migrationStrategy": "SAFE_MODE",
    "rollbackOnError": true,
    "notifyOnCompletion": true,
    "generateReports": true
  },
  "dataMapping": {
    "salesContracts": {
      "migrateStatus": ["PENDING", "ONGOING"],
      "retainStatus": ["COMPLETED"],
      "archiveStatus": []
    },
    "purchaseContracts": {
      "migrateStatus": ["PENDING", "ONGOING"],
      "retainStatus": ["COMPLETED"],
      "archiveStatus": []
    },
    "invoices": {
      "migrateStatus": ["UNPAID", "PARTIALLY_PAID"],
      "retainStatus": ["PAID"],
      "archiveStatus": []
    },
    "payments": {
      "migrateStatus": ["PENDING"],
      "retainStatus": ["CLEARED"],
      "archiveStatus": ["CANCELLED"]
    },
    "commissions": {
      "migrateStatus": ["DUE", "PENDING"],
      "retainStatus": ["PAID"],
      "archiveStatus": []
    },
    "deliveryOrders": {
      "migrateStatus": ["PENDING", "IN_TRANSIT"],
      "retainStatus": ["DELIVERED"],
      "archiveStatus": []
    },
    "disputes": {
      "migrateStatus": ["OPEN", "UNDER_REVIEW"],
      "retainStatus": ["RESOLVED"],
      "archiveStatus": []
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "splitSummary": {
      "fromFY": "2024-2025",
      "toFY": "2025-2026",
      "executedBy": "admin@rnrl.com",
      "executedAt": "2025-04-01T00:00:01Z",
      "duration": "45 seconds",
      "status": "COMPLETED"
    },
    "executionSteps": [
      {
        "step": 1,
        "name": "Create Backup",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:01Z",
        "details": {
          "backupLocation": "s3://backups/fy-split/2024-2025_backup.sql",
          "size": "2.3 GB"
        }
      },
      {
        "step": 2,
        "name": "Validate Data Integrity",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:05Z",
        "details": {
          "checksRun": 10,
          "checksPassed": 9,
          "checksWarning": 1,
          "checksFailed": 0
        }
      },
      {
        "step": 3,
        "name": "Lock Current FY",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:06Z"
      },
      {
        "step": 4,
        "name": "Create New FY",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:07Z",
        "details": {
          "fyId": 2,
          "fyCode": "2025-2026",
          "startDate": "2025-04-01",
          "endDate": "2026-03-31"
        }
      },
      {
        "step": 5,
        "name": "Balance Opening Entries",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:08Z",
        "details": {
          "openingBalance": 500000.00,
          "entriesCreated": 45
        }
      },
      {
        "step": 6,
        "name": "Migrate Sales Contracts",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:12Z",
        "details": {
          "totalMigrated": 20,
          "pending": 8,
          "ongoing": 12
        }
      },
      {
        "step": 7,
        "name": "Migrate Purchase Contracts",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:15Z",
        "details": {
          "totalMigrated": 15,
          "pending": 5,
          "ongoing": 10
        }
      },
      {
        "step": 8,
        "name": "Migrate Invoices",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:20Z",
        "details": {
          "totalMigrated": 17,
          "unpaid": 12,
          "partiallyPaid": 5,
          "totalAmount": 2450000.00
        }
      },
      {
        "step": 9,
        "name": "Migrate Payments",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:23Z",
        "details": {
          "totalMigrated": 8,
          "totalAmount": 850000.00
        }
      },
      {
        "step": 10,
        "name": "Migrate Commissions",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:25Z",
        "details": {
          "totalMigrated": 11,
          "totalAmount": 125000.00
        }
      },
      {
        "step": 11,
        "name": "Migrate Delivery Orders",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:28Z",
        "details": {
          "totalMigrated": 10
        }
      },
      {
        "step": 12,
        "name": "Migrate Disputes",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:30Z",
        "details": {
          "totalMigrated": 5
        }
      },
      {
        "step": 13,
        "name": "Migrate Accounts Receivable",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:32Z",
        "details": {
          "totalMigrated": 28,
          "totalAmount": 1850000.00
        }
      },
      {
        "step": 14,
        "name": "Migrate Accounts Payable",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:34Z",
        "details": {
          "totalMigrated": 18,
          "totalAmount": 1200000.00
        }
      },
      {
        "step": 15,
        "name": "Carryforward Inventory",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:36Z",
        "details": {
          "closingStock": 18500,
          "value": 4625000.00,
          "method": "WEIGHTED_AVERAGE"
        }
      },
      {
        "step": 16,
        "name": "Balance General Ledger",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:38Z",
        "details": {
          "entriesMigrated": 156,
          "debitTotal": 10000000.00,
          "creditTotal": 10000000.00,
          "balanced": true
        }
      },
      {
        "step": 17,
        "name": "Update All FY References",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:40Z",
        "details": {
          "tablesUpdated": 25,
          "recordsUpdated": 1845
        }
      },
      {
        "step": 18,
        "name": "Verify All Balances",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:42Z",
        "details": {
          "verificationsRun": 8,
          "allPassed": true
        }
      },
      {
        "step": 19,
        "name": "Close Old FY",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:43Z"
      },
      {
        "step": 20,
        "name": "Generate Split Reports",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:45Z",
        "details": {
          "reportsGenerated": [
            "split_summary.pdf",
            "trial_balance.pdf",
            "migration_log.xlsx",
            "audit_trail.csv"
          ]
        }
      },
      {
        "step": 21,
        "name": "Create Audit Log",
        "status": "COMPLETED",
        "timestamp": "2025-04-01T00:00:46Z"
      }
    ],
    "migrationSummary": {
      "salesContractsMigrated": 20,
      "purchaseContractsMigrated": 15,
      "invoicesMigrated": 17,
      "paymentsMigrated": 8,
      "commissionsMigrated": 11,
      "deliveryOrdersMigrated": 10,
      "disputesMigrated": 5,
      "accountsReceivableMigrated": 28,
      "accountsPayableMigrated": 18,
      "inventoryCarriedForward": 18500,
      "generalLedgerEntriesMigrated": 156
    },
    "financialSummary": {
      "totalAmountMigrated": 5125000.00,
      "openingBalanceNewFY": 500000.00,
      "closingBalanceOldFY": 500000.00,
      "balanced": true
    }
  }
}
```

---

## 3. Rollback Support

### Endpoint: `POST /api/fy-management/rollback-split`

**Purpose**: Emergency rollback if FY split encounters critical errors

**Important**: This endpoint should be heavily restricted and require multi-factor authentication

**Request:**
```json
{
  "splitExecutionId": "split_2025_001",
  "rollbackReason": "Critical data integrity issue detected",
  "adminPassword": "encrypted_password",
  "secondaryApproverPassword": "encrypted_password",
  "confirmationCode": "ROLLBACK-2025-001"
}
```

---

## 4. Module-Specific Data Integrity Endpoints

### 4.1 Sales Contracts Integrity
`GET /api/sales-contracts/integrity-check?fyId=1`

### 4.2 Purchase Contracts Integrity
`GET /api/purchase-contracts/integrity-check?fyId=1`

### 4.3 Invoices Integrity
`GET /api/invoices/integrity-check?fyId=1`

### 4.4 Payments Integrity
`GET /api/payments/integrity-check?fyId=1`

### 4.5 General Ledger Balance
`GET /api/accounting/ledger-balance?fyId=1`

---

## 5. Database Requirements

### 5.1 Transaction Management
- Use database transactions for all FY split operations
- Set isolation level to `SERIALIZABLE` for critical operations
- Implement savepoints for granular rollback

### 5.2 Constraints
```sql
-- All tables must have FY reference
ALTER TABLE sales_contracts ADD CONSTRAINT fk_financial_year 
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id);

-- Accounting entries must balance
ALTER TABLE accounting_entries ADD CONSTRAINT chk_balance
  CHECK (debit_total = credit_total);

-- No orphaned records
ALTER TABLE invoices ADD CONSTRAINT fk_contract
  FOREIGN KEY (contract_id) REFERENCES sales_contracts(id) 
  ON DELETE RESTRICT;
```

### 5.3 Audit Tables
Every table must have corresponding audit table:
```sql
CREATE TABLE sales_contracts_audit (
  audit_id BIGSERIAL PRIMARY KEY,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  record_id BIGINT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW(),
  financial_year_id INT
);
```

---

## 6. Performance Requirements

- Pre-split validation: < 30 seconds
- FY split execution: < 2 minutes for 100K transactions
- Rollback: < 1 minute
- Zero downtime during split execution

---

## 7. Security Requirements

1. Multi-factor authentication for FY split
2. Rate limiting: Max 1 FY split per day
3. IP whitelisting for admin operations
4. Encrypted audit logs
5. Automated backup before any operation
6. Real-time monitoring and alerts

---

## 8. Notification Requirements

Send notifications at:
- Split validation completion
- Split execution start
- Each major step completion
- Split execution completion
- Any errors or warnings

Notification channels:
- Email to all admins
- SMS to primary admin
- Slack/Teams integration
- In-app notifications

---

## Implementation Priority

**Phase 1 (Critical - Week 1)**:
- [ ] Data integrity validation endpoints
- [ ] Basic FY split execution
- [ ] Audit logging

**Phase 2 (High - Week 2)**:
- [ ] Module-specific migration
- [ ] Rollback support
- [ ] Comprehensive reporting

**Phase 3 (Medium - Week 3)**:
- [ ] Performance optimization
- [ ] Real-time monitoring
- [ ] Automated testing

---

## Success Criteria

✅ Zero data loss during FY split  
✅ All accounting entries balanced  
✅ All foreign keys intact  
✅ Complete audit trail  
✅ Successful rollback capability  
✅ < 2 minutes execution time  
✅ 100% uptime during operation  

---

**NO COMPROMISE ON DATA INTEGRITY**
