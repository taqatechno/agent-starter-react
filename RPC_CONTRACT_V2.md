# RPC Contract V2

### Version: 2.0.0
**Project**: QCharity Voice Agent
**Last Updated**: 2025-01-18

---

## Overview

This document defines the RPC (Remote Procedure Call) contract between the QCharity voice agent (backend) and the web UI (frontend). All RPC methods, payloads, and responses must conform to this specification.

**Version 2.0.0** introduces **breaking changes** to align with the actual MCP server response structure. All bilingual text fields now use nested `BilingualText` objects instead of flattened `nameAr`/`nameEn` properties.

---

## Breaking Changes from V1.x

### BilingualText Structure Change

**V1.x (Deprecated)**:
```json
{
  "details": {
    "nameAr": "محمد",
    "nameEn": "Mohammed",
    "descriptionAr": "وصف",
    "descriptionEn": "Description"
  }
}
```

**V2.0 (Current)**:
```json
{
  "name": {
    "ar": "محمد",
    "en": "Mohammed"
  },
  "description": {
    "ar": "وصف",
    "en": "Description"
  }
}
```

### Migration Guide

**Frontend Changes Required**:
1. Update all references from `details.nameAr` → `name.ar`
2. Update all references from `details.nameEn` → `name.en`
3. Update all references from `details.descriptionAr` → `description.ar`
4. Update all references from `details.descriptionEn` → `description.en`
5. Update country name access from `country.nameAr` → `country.name.ar`
6. Update additional info access from `additionalInfoAr` → `additionalInfo.ar`

**Note**: FAQ schema remains unchanged as it already used the nested format.

---

## Backend → Frontend RPCs

### client.displayCards

**Purpose**: Display or hide entity cards in the UI

**Request Payload:**

```json
{
  "action": "show" | "hide",
  "Type": "sponsorship" | "project" | "faq" | "charity" | "atonement",
  "cards": Array<EntityType>
}
```

**Payload Fields:**
- `action` (string, required): Either "show" or "hide"
- `Type` (string, required for "show"): Entity type name
  - Determines the structure of card objects
  - Empty string `""` when action is "hide"
- `cards` (array, required): Array of entity objects
  - Empty array `[]` when action is "hide"
  - Entity-specific structure when action is "show"

---

### Entity Type Schemas

#### 1. Sponsorship Cards (`Type: "sponsorship"`)

**Card Object Schema:**
```json
{
  "id": "string (uuid)",
  "category": "orphan" | "student" | "teacher" | "special_needs" | "family",
  "name": {
    "ar": "string",
    "en": "string"
  },
  "birthdate": "string (ISO date)" | null,
  "gender": "male" | "female" | null,
  "country": {
    "id": "string (uuid)",
    "name": {
      "ar": "string",
      "en": "string"
    },
    "isoCode": "string"
  },
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "additionalInfo": {
    "ar": "string",
    "en": "string"
  } | null,
  "status": "available" | "unavailable",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

**TypeScript Interface:**
```typescript
interface Sponsorship {
  id: string;
  category: 'orphan' | 'student' | 'teacher' | 'special_needs' | 'family';
  name: BilingualText;
  birthdate: string | null;
  gender: 'male' | 'female' | null;
  country: CountryRef;
  payment: PaymentConfig;
  additionalInfo: BilingualText | null;
  status: 'available' | 'unavailable';
  createdAt: string;
  updatedAt: string;
}
```

**Example - Show Sponsorship Cards:**
```json
{
  "action": "show",
  "Type": "sponsorship",
  "cards": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "category": "orphan",
      "name": {
        "ar": "محمد",
        "en": "Mohammed"
      },
      "birthdate": "2015-03-15",
      "gender": "male",
      "country": {
        "id": "c1234567-e89b-12d3-a456-426614174000",
        "name": {
          "ar": "فلسطين",
          "en": "Palestine"
        },
        "isoCode": "PS"
      },
      "payment": {
        "amountType": "fixed",
        "scheduleType": "monthly",
        "requiredAmount": 300,
        "defaultAmount": 300
      },
      "additionalInfo": null,
      "status": "available",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2. Project Cards (`Type: "project"`)

**Card Object Schema:**
```json
{
  "id": "string (uuid)",
  "type": "mosque" | "housing" | "water",
  "name": {
    "ar": "string",
    "en": "string"
  },
  "description": {
    "ar": "string",
    "en": "string"
  } | null,
  "country": {
    "id": "string (uuid)",
    "name": {
      "ar": "string",
      "en": "string"
    },
    "isoCode": "string"
  },
  "funding": {
    "targetAmount": number,
    "raisedAmount": number,
    "percentageRaised": number
  },
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "beneficiariesCount": number | null,
  "implementationDurationDays": number | null,
  "templateNumber": "string" | null,
  "details": MosqueDetails | WaterDetails | HousingDetails | null,
  "status": "active" | "completed" | "paused",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

**TypeScript Interface:**
```typescript
interface Project {
  id: string;
  type: 'mosque' | 'housing' | 'water';
  name: BilingualText;
  description: BilingualText | null;
  country: CountryRef;
  funding: {
    targetAmount: number;
    raisedAmount: number;
    percentageRaised: number;
  };
  payment: PaymentConfig;
  beneficiariesCount: number | null;
  implementationDurationDays: number | null;
  templateNumber: string | null;
  details?: MosqueDetails | WaterDetails | HousingDetails | null;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}
```

**Example - Show Project Cards:**
```json
{
  "action": "show",
  "Type": "project",
  "cards": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "type": "mosque",
      "name": {
        "ar": "جامع الرحمة الكبير",
        "en": "Al-Rahma Grand Mosque"
      },
      "description": {
        "ar": "بناء مسجد جديد في المنطقة",
        "en": "Build new mosque in the area"
      },
      "country": {
        "id": "c1234567-e89b-12d3-a456-426614174000",
        "name": {
          "ar": "السودان",
          "en": "Sudan"
        },
        "isoCode": "SD"
      },
      "funding": {
        "targetAmount": 500000,
        "raisedAmount": 250000,
        "percentageRaised": 50
      },
      "payment": {
        "amountType": "flexible",
        "scheduleType": "one_time",
        "requiredAmount": null,
        "defaultAmount": 1000
      },
      "beneficiariesCount": 500,
      "implementationDurationDays": 365,
      "templateNumber": "M-2024-001",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

---

#### 3. FAQ Cards (`Type: "faq"`)

**Card Object Schema:**
```json
{
  "id": "string (uuid)",
  "category": {
    "ar": "string",
    "en": "string"
  },
  "question": {
    "ar": "string",
    "en": "string"
  },
  "answer": {
    "ar": "string",
    "en": "string"
  },
  "status": "published" | "draft" | "archived",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

**TypeScript Interface:**
```typescript
interface FAQ {
  id: string;
  category: BilingualText;
  question: BilingualText;
  answer: BilingualText;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

**Example - Show FAQ Cards:**
```json
{
  "action": "show",
  "Type": "faq",
  "cards": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440002",
      "category": {
        "ar": "الزكاة",
        "en": "Zakat"
      },
      "question": {
        "ar": "كيف أحسب الزكاة؟",
        "en": "How do I calculate Zakat?"
      },
      "answer": {
        "ar": "الزكاة هي 2.5% من المدخرات السنوية",
        "en": "Zakat is 2.5% of annual savings"
      },
      "status": "published",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 4. Charity Catalog Cards (`Type: "charity"`)

**Card Object Schema:**
```json
{
  "id": "string (uuid)",
  "type": "sadaqah" | "feeding_poor" | "clothes_donation" | "calamity_relief" | "remove_affliction",
  "name": {
    "ar": "string",
    "en": "string"
  },
  "description": {
    "ar": "string",
    "en": "string"
  } | null,
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "createdAt": "string (ISO timestamp)"
}
```

**TypeScript Interface:**
```typescript
interface CharityCatalog {
  id: string;
  type: 'sadaqah' | 'feeding_poor' | 'clothes_donation' | 'calamity_relief' | 'remove_affliction';
  name: BilingualText;
  description: BilingualText | null;
  payment: PaymentConfig;
  createdAt: string;
}
```

**Example - Show Charity Cards:**
```json
{
  "action": "show",
  "Type": "charity",
  "cards": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440003",
      "type": "feeding_poor",
      "name": {
        "ar": "إطعام المساكين",
        "en": "Feeding the Poor"
      },
      "description": {
        "ar": "توفير وجبات للمحتاجين",
        "en": "Provide meals for those in need"
      },
      "payment": {
        "amountType": "flexible",
        "scheduleType": "one_time",
        "requiredAmount": null,
        "defaultAmount": 50
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 5. Atonement Catalog Cards (`Type: "atonement"`)

**Card Object Schema:**
```json
{
  "id": "string (uuid)",
  "type": "debtors" | "atonement" | "aqiqah" | "vows" | "purge_income" | "fasting_kafara",
  "name": {
    "ar": "string",
    "en": "string"
  },
  "description": {
    "ar": "string",
    "en": "string"
  } | null,
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "createdAt": "string (ISO timestamp)"
}
```

**TypeScript Interface:**
```typescript
interface AtonementCatalog {
  id: string;
  type: 'debtors' | 'atonement' | 'aqiqah' | 'vows' | 'purge_income' | 'fasting_kafara';
  name: BilingualText;
  description: BilingualText | null;
  payment: PaymentConfig;
  createdAt: string;
}
```

**Example - Show Atonement Cards:**
```json
{
  "action": "show",
  "Type": "atonement",
  "cards": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440004",
      "type": "fasting_kafara",
      "name": {
        "ar": "كفارة صيام",
        "en": "Fasting Atonement"
      },
      "description": {
        "ar": "كفارة الإفطار في رمضان",
        "en": "Atonement for breaking fast in Ramadan"
      },
      "payment": {
        "amountType": "fixed",
        "scheduleType": "one_time",
        "requiredAmount": 150,
        "defaultAmount": 150
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Hide Cards Example

**Example - Hide Cards (All Types):**
```json
{
  "action": "hide",
  "Type": "",
  "cards": []
}
```

---

### Response Format

**Success Response:**
```json
{
  "status": "success",
  "cards": [
    {
      "id": "string",
      "title": "string"
    }
  ]
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

### client.controlCardModal

**Purpose**: Open or close a card detail modal

**Request Payload:**

```json
{
  "action": "open" | "close",
  "cardId": "string (uuid)"  // Required for "open", omitted for "close"
}
```

**Payload Fields:**
- `action` (string, required): Either "open" or "close"
- `cardId` (string, optional): Card ID to open modal for (UUID string)
  - Required when action is "open"
  - Omitted when action is "close"

**Success Response:**
```json
{
  "status": "success",
  "cardId": "string (uuid)"  // Included for "open" action
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

**Example - Open Modal:**
```json
// Request
{
  "action": "open",
  "cardId": "550e8400-e29b-41d4-a716-446655440005"
}

// Expected Response
{
  "status": "success",
  "cardId": "550e8400-e29b-41d4-a716-446655440005"
}
```

**Example - Close Modal:**
```json
// Request
{
  "action": "close"
}

// Expected Response
{
  "status": "success"
}
```

---

### client.displayOrders

**Purpose**: Display or hide user's donation and sponsorship orders in the UI

**Request Payload:**

```json
{
  "action": "show" | "hide",
  "donations": Array<DonationOrder>,
  "sponsorships": Array<SponsorshipOrder>
}
```

**Payload Fields:**
- `action` (string, required): Either "show" or "hide"
- `donations` (array, required): Array of donation order objects
  - Empty array `[]` when action is "hide"
  - Full order objects when action is "show"
- `sponsorships` (array, required): Array of sponsorship order objects
  - Empty array `[]` when action is "hide"
  - Full order objects when action is "show"

---

### Order Type Schemas

#### DonationOrder Schema

**Order Object Schema:**
```json
{
  "id": "string (uuid)",
  "amountQar": "string",
  "paymentSchedule": "one_time" | "monthly",
  "status": "completed" | "pending" | "processing" | "failed" | "refunded",
  "notes": "string" | null,
  "createdAt": "string (ISO timestamp)",
  "donation_item": {
    "type": "project" | "charity" | "atonement" | "general",
    "details": Project | CharityCatalog | AtonementCatalog | null
  },
  "transaction": {
    "id": "string (uuid)",
    "status": "completed" | "pending" | "processing" | "failed" | "refunded"
  }
}
```

**TypeScript Interface:**
```typescript
interface DonationOrder {
  id: string;
  amountQar: string;  // Decimal as string (e.g., "500.00")
  paymentSchedule: PaymentSchedule;
  status: TransactionStatus;
  notes: string | null;
  createdAt: string;
  donation_item: {
    type: DonationTargetType;
    details: Project | CharityCatalog | AtonementCatalog | null;
  };
  transaction: {
    id: string;
    status: TransactionStatus;
  };
}
```

**Example - Show Donation Orders:**
```json
{
  "action": "show",
  "donations": [
    {
      "id": "a50e8400-e29b-41d4-a716-446655440100",
      "amountQar": "500.00",
      "paymentSchedule": "one_time",
      "status": "completed",
      "notes": "Donation for mosque project",
      "createdAt": "2024-12-15T10:30:00Z",
      "donation_item": {
        "type": "project",
        "details": {
          "id": "p1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "type": "mosque",
          "name": {
            "ar": "جامع الرحمة الكبير",
            "en": "Al-Rahma Grand Mosque"
          },
          "description": {
            "ar": "بناء مسجد جديد في المنطقة",
            "en": "Build new mosque in the area"
          },
          "country": {
            "id": "c1234567-e89b-12d3-a456-426614174000",
            "name": {
              "ar": "السودان",
              "en": "Sudan"
            },
            "isoCode": "SD"
          },
          "funding": {
            "targetAmount": 500000,
            "raisedAmount": 250000,
            "percentageRaised": 50
          },
          "payment": {
            "amountType": "flexible",
            "scheduleType": "one_time",
            "requiredAmount": null,
            "defaultAmount": 1000
          },
          "beneficiariesCount": 500,
          "implementationDurationDays": 365,
          "templateNumber": "M-2024-001",
          "status": "active",
          "createdAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-01-10T00:00:00Z"
        }
      },
      "transaction": {
        "id": "b60e8400-e29b-41d4-a716-446655440101",
        "status": "completed"
      }
    }
  ],
  "sponsorships": []
}
```

---

#### SponsorshipOrder Schema

**Order Object Schema:**
```json
{
  "id": "string (uuid)",
  "amountQar": "string",
  "paymentSchedule": "monthly",
  "status": "completed" | "pending" | "processing" | "failed" | "refunded",
  "createdAt": "string (ISO timestamp)",
  "sponsorship_item": {
    "type": "sponsorship",
    "details": Sponsorship
  },
  "transaction": {
    "id": "string (uuid)",
    "status": "completed" | "pending" | "processing" | "failed" | "refunded"
  }
}
```

**TypeScript Interface:**
```typescript
interface SponsorshipOrder {
  id: string;
  amountQar: string;  // Decimal as string (e.g., "300.00")
  paymentSchedule: 'monthly';
  status: TransactionStatus;
  createdAt: string;
  sponsorship_item: {
    type: 'sponsorship';
    details: Sponsorship;
  };
  transaction: {
    id: string;
    status: TransactionStatus;
  };
}
```

**Example - Show Sponsorship Orders:**
```json
{
  "action": "show",
  "donations": [],
  "sponsorships": [
    {
      "id": "c70e8400-e29b-41d4-a716-446655440200",
      "amountQar": "300.00",
      "paymentSchedule": "monthly",
      "status": "completed",
      "createdAt": "2024-11-01T08:00:00Z",
      "sponsorship_item": {
        "type": "sponsorship",
        "details": {
          "id": "sp1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "category": "orphan",
          "name": {
            "ar": "محمد",
            "en": "Mohammed"
          },
          "birthdate": "2015-03-15",
          "gender": "male",
          "country": {
            "id": "c1234567-e89b-12d3-a456-426614174000",
            "name": {
              "ar": "فلسطين",
              "en": "Palestine"
            },
            "isoCode": "PS"
          },
          "payment": {
            "amountType": "fixed",
            "scheduleType": "monthly",
            "requiredAmount": 300,
            "defaultAmount": null
          },
          "additionalInfo": null,
          "status": "available",
          "createdAt": "2024-12-01T00:00:00Z",
          "updatedAt": "2025-01-05T00:00:00Z"
        }
      },
      "transaction": {
        "id": "d80e8400-e29b-41d4-a716-446655440201",
        "status": "completed"
      }
    }
  ]
}
```

---

### Hide Orders Example

**Example - Hide Orders:**
```json
{
  "action": "hide",
  "donations": [],
  "sponsorships": []
}
```

---

### Response Format (Display Orders)

**Success Response (Show Action):**
```json
{
  "status": "success",
  "donations": [
    {
      "id": "a50e8400-e29b-41d4-a716-446655440100",
      "title": "Al-Rahma Grand Mosque"
    }
  ],
  "sponsorships": [
    {
      "id": "c70e8400-e29b-41d4-a716-446655440200",
      "title": "Mohammed"
    }
  ]
}
```

**Success Response (Hide Action):**
```json
{
  "status": "success"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

**Response Notes:**
- `title` field for donations is extracted from `donation_item.details.name.en` (or `.ar`)
  - For general donations (`type: "general"`): returns "General Donation" or "تبرع عام"
- `title` field for sponsorships is extracted from `sponsorship_item.details.name.en` (or `.ar`)
- Empty arrays are returned when no orders of that type are displayed

---

### client.controlOrderModal

**Purpose**: Open or close an order detail modal

**Request Payload:**

```json
{
  "action": "open" | "close",
  "orderId": "string (uuid)",  // Required for "open", omitted for "close"
  "orderType": "donation" | "sponsorship"  // Required for "open", omitted for "close"
}
```

**Payload Fields:**
- `action` (string, required): Either "open" or "close"
- `orderId` (string, optional): Order ID to open modal for (UUID string)
  - Required when action is "open"
  - Omitted when action is "close"
- `orderType` (string, optional): Type of order ("donation" or "sponsorship")
  - Required when action is "open"
  - Omitted when action is "close"

**Success Response (Open Action):**
```json
{
  "status": "success",
  "orderId": "string (uuid)",
  "orderType": "donation" | "sponsorship",
  "message": "order {orderId} of type {orderType} is open"
}
```

**Success Response (Close Action):**
```json
{
  "status": "success"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

**Example - Open Order Modal:**
```json
// Request
{
  "action": "open",
  "orderId": "a50e8400-e29b-41d4-a716-446655440100",
  "orderType": "donation"
}

// Expected Response
{
  "status": "success",
  "orderId": "a50e8400-e29b-41d4-a716-446655440100",
  "orderType": "donation",
  "message": "order a50e8400-e29b-41d4-a716-446655440100 of type donation is open"
}
```

**Example - Close Order Modal:**
```json
// Request
{
  "action": "close"
}

// Expected Response
{
  "status": "success"
}
```

---

## Frontend → Backend RPCs

### agent.selectCard

**Purpose**: Notify agent that user selected a card

**Request Payload:**

```json
{
  "cardId": "string (uuid)",
  "title": "string",
  "action": "select"
}
```

**Payload Fields:**
- `cardId` (string, required): Unique identifier of the selected card (UUID)
- `title` (string, required): Display title of the selected card
- `action` (string, required): Action type - currently always "select"

**Response:**
- Success: `"success"`
- Error: `"error: <message>"`

**Example - Card Selection:**
```json
// Request
{
  "cardId": "550e8400-e29b-41d4-a716-446655440006",
  "title": "Al-Rahma Grand Mosque",
  "action": "select"
}

// Expected Response
"success"
```

**Example - Error:**
```json
// Request (missing data)
{
  "cardId": null
}

// Expected Response
"error: missing cardId"
```

---

### agent.selectOrder

**Purpose**: Notify agent that user selected an order

**Request Payload:**

```json
{
  "orderId": "string (uuid)",
  "orderType": "donation" | "sponsorship",
  "action": "select"
}
```

**Payload Fields:**
- `orderId` (string, required): Unique identifier of the selected order (UUID)
- `orderType` (string, required): Type of order - either "donation" or "sponsorship"
- `action` (string, required): Action type - currently always "select"

**Response:**
- Success: `"success"`
- Error: `"error: <message>"`

**Example - Order Selection (Donation):**
```json
// Request
{
  "orderId": "a50e8400-e29b-41d4-a716-446655440100",
  "orderType": "donation",
  "action": "select"
}

// Expected Response
"success"
```

**Example - Order Selection (Sponsorship):**
```json
// Request
{
  "orderId": "c70e8400-e29b-41d4-a716-446655440200",
  "orderType": "sponsorship",
  "action": "select"
}

// Expected Response
"success"
```

**Example - Error:**
```json
// Request (missing data)
{
  "orderId": null
}

// Expected Response
"error: missing orderId"
```

---

## TypeScript Type Definitions

### Core Types

```typescript
// Bilingual text structure (all user-facing text)
interface BilingualText {
  ar: string;  // Arabic text
  en: string;  // English text
}

// Country reference (auto-expanded by backend)
interface CountryRef {
  id?: string;  // UUID (may not be present in some responses)
  name: BilingualText;  // Always expanded
  isoCode: string;  // ISO country code (e.g., "PS", "YE", "SD")
}

// Payment configuration
interface PaymentConfig {
  amountType: 'fixed' | 'flexible';
  scheduleType: 'one_time' | 'monthly' | 'flexible';
  requiredAmount: number | null;  // Required amount (nullable)
  defaultAmount: number | null;   // Default/suggested amount (nullable)
}

// Transaction status
type TransactionStatus =
  | 'pending'      // Transaction initiated
  | 'processing'   // Being processed by payment gateway
  | 'completed'    // Successfully completed
  | 'failed'       // Failed to process
  | 'refunded';    // Refunded to user

// Payment schedule
type PaymentSchedule = 'one_time' | 'monthly' | 'flexible';

// Donation target type
type DonationTargetType = 'project' | 'charity' | 'atonement' | 'general';
```

### Project Detail Types

```typescript
// Mosque-specific details
interface MosqueDetails {
  capacity: number;           // Number of worshippers
  areaSqm: number | null;     // Total area in square meters
  hasMinaret: boolean;        // Whether mosque has a minaret
  hasDome: boolean;           // Whether mosque has a dome
}

// Water project details
interface WaterDetails {
  type: 'drilling_shallow_well' | 'drilling_deep_well';
  depthMeters: number | null;           // Depth of well in meters
  capacityLitersPerHour: number | null; // Water output capacity per hour
}

// Housing project details
interface HousingDetails {
  type: 'build_house' | 'maintenance_furniture' | 'building_residences';
  numUnits: number;           // Number of housing units
  roomsPerUnit: number | null; // Rooms per unit
  areaSqm: number | null;     // Area per unit in square meters
}
```

### Tool Response Types

```typescript
// Query Tool Pagination
interface QueryPaginationMetadata {
  totalCount: number;        // Total number of results
  currentPage: number;       // Current page number (1-indexed)
  totalPages: number;        // Total number of pages
  limit: number;             // Maximum items per page
  offset: number;            // Current offset (0-indexed)
  rowCount: number;          // Number of rows in current page
  hasMore: boolean;          // Whether there are more results
  hasPrevious: boolean;      // Whether there are previous results
  nextOffset: number | null;     // Offset for next page
  previousOffset: number | null; // Offset for previous page
}

// Entity Query Response (from queryQCharityDatabase)
interface EntityQueryResponse<T> {
  success: boolean;
  type: 'entity';
  entityName: 'sponsorship' | 'project' | 'faq' | 'charity' | 'atonement';
  schema: string;  // Same as entityName
  results: T[];    // Array of entity objects
  pagination: QueryPaginationMetadata;
  question: string;
  sql: string;
  executionTimeMs: number;
  message?: string;
  schemaTokens: number;
  timestamp: string;  // ISO 8601
}

// Custom Query Response (from queryQCharityDatabase)
interface CustomQueryResponse {
  success: boolean;
  type: 'custom';
  results: Record<string, any>[];  // Raw data rows
  pagination: QueryPaginationMetadata;
  question: string;
  sql: string;
  executionTimeMs: number;
  message?: string;
  schemaTokens: number;
  timestamp: string;  // ISO 8601
}

// Orders Pagination (simple)
interface PaginationMetadata {
  total: number;   // Total number of items
  limit: number;   // Items per page
  offset: number;  // Current offset
}

// Get My Orders Response
interface GetMyOrdersSuccess {
  donations: DonationOrder[];
  sponsorships: SponsorshipOrder[];
  pagination?: {
    donations?: PaginationMetadata;
    sponsorships?: PaginationMetadata;
  };
}
```

---

## Error Handling

### Standard Error Format

All errors must follow this structure:

```json
{
  "status": "error",
  "message": "Human-readable error description"
}
```

### Common Error Scenarios

| Scenario | Error Message |
|----------|---------------|
| Invalid action value | "Invalid action. Use 'show' or 'hide'" |
| Missing cards array | "cards array is required" |
| Missing BilingualText fields | "Missing required BilingualText field: name" |
| RPC timeout | "RPC call timeout" |
| Network failure | "RPC call failed - [error details]" |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-01-18 | **BREAKING CHANGE**: Updated all entity schemas to use BilingualText nested objects. Changed from flat `nameAr`/`nameEn` to nested `name.ar`/`name.en` structure. This reflects the actual MCP server response format. |
| 1.8.0 | 2025-01-17 | Added order interaction RPC methods (V1.x - deprecated) |
| 1.0.0 | 2025-01-10 | Initial contract (V1.x - deprecated) |

See `RPC_CONTRACT.md` for complete V1.x version history (deprecated).

---

## Notes

- All RPC payloads must be valid JSON strings
- Backend passes MCP server responses directly to frontend without transformation
- Only RPC failures (network, timeout) should return error strings
- Frontend is responsible for validating payload structure
- The `Type` field helps frontend route to appropriate UI components
- **BilingualText Structure**: All user-facing text uses nested objects (`{ar: "", en: ""}`)
  - Access via `entity.name.ar` or `entity.name.en`
  - Applies to: name, description, additionalInfo
  - Country names: `country.name.ar` / `country.name.en`
  - FAQ fields: `category`, `question`, `answer` (already use this format)
- **No Data Transformation**: Backend caches and forwards MCP responses as-is
- **Backward Compatibility**: V1.x format is deprecated and no longer supported

---

## See Also

- `TOOL_TYPES_SCHEMA.md` - Complete TypeScript type definitions for MCP tool responses
- `RPC_CONTRACT.md` - Deprecated V1.x contract (for reference only)
- `RPC_GUIDE.md` - Implementation guide for RPC handlers
