# QCharity Frontend Types Reference

Quick reference guide for building frontend applications using the QCharity MCP Server API types.

## Quick Start

```typescript
// Import Query Tool types
import type {
  QueryResponse,
  EntityQueryResponse,
  CustomQueryResponse,
  QueryPaginationMetadata
} from './lib/types/api/query';

// Import My Orders Tool types
import type {
  GetMyOrdersSuccess,
  DonationOrder,
  SponsorshipOrder,
  CreateDonationRequest,
  CreateSponsorshipRequest
} from './lib/types/api/orders';

// Import Entity types
import type {
  Sponsorship,
  Project,
  FAQ,
  CharityCatalog,
  AtonementCatalog,
  MosqueDetails,
  WaterDetails,
  HousingDetails
} from './lib/types/entities';

// Import Helper types
import type {
  BilingualText,
  PaymentConfig,
  CountryRef,
  TransactionStatus,
  PaymentSchedule
} from './lib/types/shared';
```

---

## Query Tool Response Types

### EntityQueryResponse (Structured Queries)

When you query for specific entities (sponsorships, projects, FAQs, charities, atonements), you get back:

```typescript
interface EntityQueryResponse<T> {
  success: boolean; // Whether the query succeeded
  type: 'entity';
  entityName: 'sponsorship' | 'project' | 'faq' | 'charity' | 'atonement';
  schema: string; // Same as entityName
  results: T[]; // Array of the specific entity type
  pagination: QueryPaginationMetadata;
  question: string; // Original question
  sql: string; // Generated SQL query
  executionTimeMs: number;
  message?: string; // Optional error details or warnings
  schemaTokens: number;
  timestamp: string; // ISO 8601 format
}
```

**Example Response:**

```json
{
  "success": true,
  "type": "entity",
  "entityName": "sponsorship",
  "schema": "sponsorship",
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "category": "orphan",
      "name": { "ar": "أحمد", "en": "Ahmed" },
      "birthdate": "2015-03-15",
      "gender": "male",
      "country": {
        "id": "c7f3a1b2-4d6e-8f9a-1b2c-3d4e5f6a7b8c",
        "name": { "ar": "فلسطين", "en": "Palestine" },
        "isoCode": "PS"
      },
      "payment": {
        "amountType": "fixed",
        "scheduleType": "monthly",
        "requiredAmount": 300.00,
        "defaultAmount": null
      },
      "additionalInfo": { "ar": "يتيم من غزة", "en": "Orphan from Gaza" },
      "status": "available",
      "createdAt": "2025-01-10T12:00:00.000Z",
      "updatedAt": "2025-01-10T12:00:00.000Z"
    }
  ],
  "pagination": {
    "totalCount": 150,
    "currentPage": 1,
    "totalPages": 8,
    "limit": 20,
    "offset": 0,
    "rowCount": 20,
    "hasMore": true,
    "hasPrevious": false,
    "nextOffset": 20,
    "previousOffset": null
  },
  "question": "Show me available orphan sponsorships",
  "sql": "SELECT * FROM sponsorships WHERE category = 'orphan' AND status = 'available' LIMIT 20",
  "executionTimeMs": 45,
  "schemaTokens": 1200,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### CustomQueryResponse (Aggregations/Joins)

For complex queries involving aggregations, joins, or custom computations:

```typescript
interface CustomQueryResponse {
  success: boolean; // Whether the query succeeded
  type: 'custom';
  results: Record<string, any>[]; // Raw data rows
  pagination: QueryPaginationMetadata;
  question: string;
  sql: string;
  executionTimeMs: number;
  message?: string; // Optional error details or warnings
  schemaTokens: number;
  timestamp: string;
}
```

**Example Response:**

```json
{
  "success": true,
  "type": "custom",
  "results": [
    {
      "category": "orphan",
      "total_count": 85,
      "avg_amount": 300.00
    },
    {
      "category": "student",
      "total_count": 45,
      "avg_amount": 250.00
    }
  ],
  "pagination": {
    "totalCount": 5,
    "currentPage": 1,
    "totalPages": 1,
    "limit": 20,
    "offset": 0,
    "rowCount": 5,
    "hasMore": false,
    "hasPrevious": false,
    "nextOffset": null,
    "previousOffset": null
  },
  "question": "Show me sponsorship statistics by category",
  "sql": "SELECT category, COUNT(*) as total_count, AVG(payment_amount) as avg_amount FROM sponsorships GROUP BY category",
  "executionTimeMs": 32,
  "schemaTokens": 850,
  "timestamp": "2025-01-15T10:35:00.000Z"
}
```

### QueryPaginationMetadata

Comprehensive pagination information included in all query responses:

```typescript
interface QueryPaginationMetadata {
  totalCount: number;      // Total number of results
  currentPage: number;     // Current page number (1-indexed)
  totalPages: number;      // Total number of pages
  limit: number;           // Maximum items per page
  offset: number;          // Current offset (0-indexed)
  rowCount: number;        // Number of rows in current page
  hasMore: boolean;        // Whether there are more results
  hasPrevious: boolean;    // Whether there are previous results
  nextOffset: number | null;     // Offset for next page
  previousOffset: number | null; // Offset for previous page
}
```

---

## My Orders Tool Response Types

### GetMyOrdersSuccess

Main response when fetching user's orders:

```typescript
interface GetMyOrdersSuccess {
  donations: DonationOrder[];
  sponsorships: SponsorshipOrder[];
  pagination: {
    donations?: PaginationMetadata;  // Optional
    sponsorships?: PaginationMetadata;  // Optional
  };
}
```

**Example Response:**

```json
{
  "donations": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "amountQar": "500.00",
      "paymentSchedule": "one_time",
      "status": "completed",
      "notes": "For the new mosque project",
      "createdAt": "2025-01-10T15:30:00.000Z",
      "donation_item": {
        "type": "project",
        "details": {
          "id": "p1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": { "ar": "بناء مسجد", "en": "Mosque Construction" },
          "description": { "ar": "بناء مسجد في غزة", "en": "Building a mosque in Gaza" },
          "type": "mosque",
          "country": {
            "id": "c1",
            "name": { "ar": "فلسطين", "en": "Palestine" },
            "isoCode": "PS"
          },
          "funding": {
            "targetAmount": 100000.00,
            "raisedAmount": 45000.00,
            "percentageRaised": 45.0
          },
          "payment": {
            "amountType": "flexible",
            "scheduleType": "one_time",
            "requiredAmount": null,
            "defaultAmount": 100.00
          },
          "beneficiariesCount": 500,
          "implementationDurationDays": 180,
          "templateNumber": "M-2025-001",
          "status": "active",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "updatedAt": "2025-01-10T00:00:00.000Z"
        }
      },
      "transaction": {
        "id": "t1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "completed"
      }
    }
  ],
  "sponsorships": [
    {
      "id": "s1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "amountQar": "300.00",
      "paymentSchedule": "monthly",
      "status": "completed",
      "createdAt": "2025-01-05T10:00:00.000Z",
      "sponsorship_item": {
        "type": "sponsorship",
        "details": {
          "id": "sp1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "category": "orphan",
          "name": { "ar": "محمد", "en": "Mohammed" },
          "birthdate": "2016-06-20",
          "gender": "male",
          "country": {
            "id": "c2",
            "name": { "ar": "اليمن", "en": "Yemen" },
            "isoCode": "YE"
          },
          "payment": {
            "amountType": "fixed",
            "scheduleType": "monthly",
            "requiredAmount": 300.00,
            "defaultAmount": null
          },
          "additionalInfo": null,
          "status": "available",
          "createdAt": "2024-12-01T00:00:00.000Z",
          "updatedAt": "2025-01-05T00:00:00.000Z"
        }
      },
      "transaction": {
        "id": "t2b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "completed"
      }
    }
  ],
  "pagination": {
    "donations": {
      "total": 5,
      "limit": 10,
      "offset": 0
    },
    "sponsorships": {
      "total": 3,
      "limit": 10,
      "offset": 0
    }
  }
}
```

### DonationOrder

Complete structure of a donation order with embedded item details:

```typescript
interface DonationOrder {
  id: string;
  amountQar: string; // Decimal as string (e.g., "500.00")
  paymentSchedule: PaymentSchedule;
  donation_item: {
    type: DonationTargetType;
    details: Project | CharityCatalog | AtonementCatalog | null;
  };
  status: TransactionStatus; // Order status
  notes: string | null;
  createdAt: string; // ISO 8601 timestamp
  transaction: {
    id: string;
    status: TransactionStatus;
  };
}
```

**Notes:**
- `amountQar` is a string representation of a decimal number
- `status` represents the order status, not just the transaction
- `donation_item.details` contains the full entity object (Project, CharityCatalog, or AtonementCatalog)
- `donation_item.details` is null for general donations

### SponsorshipOrder

Complete structure of a sponsorship order with embedded item details:

```typescript
interface SponsorshipOrder {
  id: string;
  amountQar: string; // Decimal as string (e.g., "300.00")
  paymentSchedule: PaymentSchedule; // Always 'monthly' for sponsorships
  sponsorship_item: {
    type: 'sponsorship';
    details: Sponsorship;
  };
  status: TransactionStatus; // Order status
  createdAt: string; // ISO 8601 timestamp
  transaction: {
    id: string;
    status: TransactionStatus;
  };
}
```

**Notes:**
- `amountQar` is a string representation of a decimal number
- `status` represents the order status, not just the transaction
- `sponsorship_item.details` contains the full Sponsorship object

### Order Creation Requests

```typescript
// Create a donation order
interface CreateDonationRequest {
  targetType: 'project' | 'charity' | 'atonement' | 'general';
  donation_item_id: string | null; // UUID or null for general donations
  amountQar: number; // Must be positive
  paymentSchedule: 'one_time' | 'monthly';
  notes?: string; // Optional, max 1000 characters
}

// Create a sponsorship order
interface CreateSponsorshipRequest {
  sponsorshipId: string; // UUID
  paymentSchedule: 'monthly';
}
```

---

## Entity Types (Shared)

All entity types are used in both Query Tool responses and My Orders donation/sponsorship items.

### Sponsorship

```typescript
interface Sponsorship {
  id: string; // UUID
  category: 'orphan' | 'student' | 'teacher' | 'special_needs' | 'family';
  name: BilingualText;
  birthdate: string | null; // ISO 8601 date (nullable)
  gender: 'male' | 'female' | null; // Nullable
  country: CountryRef; // Auto-expanded (Nov 2024+)
  payment: PaymentConfig; // Note: field name is 'payment', not 'paymentConfig'
  additionalInfo: BilingualText | null; // Nullable
  status: 'available' | 'unavailable';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Project

```typescript
interface Project {
  id: string; // UUID
  type: 'mosque' | 'housing' | 'water';
  name: BilingualText;
  description: BilingualText | null; // Nullable
  country: CountryRef; // Auto-expanded (Nov 2024+)
  payment: PaymentConfig; // Note: field name is 'payment', not 'paymentConfig'
  funding: {
    targetAmount: number;
    raisedAmount: number;
    percentageRaised: number; // 0-100
  };
  beneficiariesCount: number | null; // Nullable
  implementationDurationDays: number | null; // Nullable
  templateNumber: string | null; // e.g., "M-2025-001" (nullable)
  status: 'active' | 'completed' | 'paused';
  details?: MosqueDetails | WaterDetails | HousingDetails | null; // Type-specific details
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

#### Project Detail Types

Projects have type-specific details based on their `type` field:

**MosqueDetails** (when `type` is `'mosque'`):
```typescript
interface MosqueDetails {
  capacity: number;           // Number of worshippers the mosque can accommodate
  areaSqm: number | null;     // Total area in square meters
  hasMinaret: boolean;        // Whether the mosque has a minaret
  hasDome: boolean;           // Whether the mosque has a dome
}
```

**WaterDetails** (when `type` is `'water'`):
```typescript
interface WaterDetails {
  type: 'drilling_shallow_well' | 'drilling_deep_well';
  depthMeters: number | null;           // Depth of the well in meters
  capacityLitersPerHour: number | null; // Water output capacity per hour
}
```

**HousingDetails** (when `type` is `'housing'`):
```typescript
interface HousingDetails {
  type: 'build_house' | 'maintenance_furniture' | 'building_residences';
  numUnits: number;           // Number of housing units
  roomsPerUnit: number | null; // Rooms per unit
  areaSqm: number | null;     // Area per unit in square meters
}
```

### FAQ

```typescript
interface FAQ {
  id: string; // UUID
  category: BilingualText;
  question: BilingualText;
  answer: BilingualText;
  status: 'published' | 'draft' | 'archived';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### CharityCatalog

```typescript
interface CharityCatalog {
  id: string; // UUID
  type: 'sadaqah' | 'feeding_poor' | 'clothes_donation' | 'calamity_relief' | 'remove_affliction';
  name: BilingualText;
  description: BilingualText | null; // Nullable
  payment: PaymentConfig; // Note: field name is 'payment', not 'paymentConfig'
  createdAt: string; // ISO 8601
  // Note: No updatedAt field
}
```

### AtonementCatalog

```typescript
interface AtonementCatalog {
  id: string; // UUID
  type: 'debtors' | 'atonement' | 'aqiqah' | 'vows' | 'purge_income' | 'fasting_kafara';
  name: BilingualText;
  description: BilingualText | null; // Nullable
  payment: PaymentConfig; // Note: field name is 'payment', not 'paymentConfig'
  createdAt: string; // ISO 8601
  // Note: No updatedAt field
}
```

---

## Helper Types

### BilingualText

All user-facing text in the system is bilingual (Arabic and English):

```typescript
interface BilingualText {
  ar: string; // Arabic text
  en: string; // English text
}

// Usage example
const mosqueName: BilingualText = {
  ar: "مسجد النور",
  en: "Al-Noor Mosque"
};
```

### PaymentConfig

Defines how payments work for each entity:

```typescript
interface PaymentConfig {
  amountType: 'fixed' | 'flexible';
  scheduleType: 'one_time' | 'monthly' | 'flexible';
  requiredAmount: number | null; // Required amount (nullable)
  defaultAmount: number | null; // Default/suggested amount (nullable)
}

// Examples:
// Fixed monthly sponsorship: { amountType: 'fixed', scheduleType: 'monthly', requiredAmount: 300, defaultAmount: null }
// Flexible one-time donation: { amountType: 'flexible', scheduleType: 'one_time', requiredAmount: null, defaultAmount: 100 }
```

**Note:** The `amountType` values are `'fixed'` or `'flexible'` (not `'variable'` or `'minimum'`).

### CountryRef

**IMPORTANT:** As of November 2024, CountryRef fields are auto-expanded by the backend. You'll always receive the full country object, not just an ID.

```typescript
interface CountryRef {
  id?: string; // UUID (may not be present in some responses)
  name?: BilingualText; // Auto-expanded
  isoCode?: string;     // Auto-expanded (e.g., "PS", "YE", "SY")
}

// You'll typically receive (with ID):
{
  "id": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": { "ar": "فلسطين", "en": "Palestine" },
  "isoCode": "PS"
}

// Or sometimes (without ID):
{
  "name": { "ar": "فلسطين", "en": "Palestine" },
  "isoCode": "PS"
}
```

### TransactionStatus

```typescript
type TransactionStatus =
  | 'pending'      // Transaction initiated
  | 'processing'   // Being processed by payment gateway
  | 'completed'    // Successfully completed
  | 'failed'       // Failed to process
  | 'refunded';    // Refunded to user
```

### PaymentSchedule

```typescript
type PaymentSchedule = 'one_time' | 'monthly' | 'flexible';
```

### DonationTargetType

```typescript
type DonationTargetType = 'project' | 'charity' | 'atonement' | 'general';
```

### PaginationMetadata

Simple pagination info (used in My Orders):

```typescript
interface PaginationMetadata {
  total: number;  // Total number of items
  limit: number;  // Items per page
  offset: number; // Current offset
}
```