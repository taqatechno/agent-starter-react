# RPC Contract

### Version: 1.8.0
**Project**: QCharity Voice Agent
**Last Updated**: 2025-01-17

---

## Overview

This document defines the RPC (Remote Procedure Call) contract between the QCharity voice agent (backend) and the web UI (frontend). All RPC methods, payloads, and responses must conform to this specification.

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
  "details": {
    "nameAr": "string",
    "nameEn": "string",
    "category": "orphan" | "student" | "teacher" | "special_needs" | "family",
    "birthdate": "string (ISO date)" | null,
    "gender": "male" | "female" | null,
    "country": {
      "id": "string (uuid)",
      "nameAr": "string",
      "nameEn": "string"
    },
    "additionalInfoAr": "string" | null,
    "additionalInfoEn": "string" | null
  },
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "status": "available" | "unavailable",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
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
      "details": {
        "nameAr": "محمد",
        "nameEn": "Mohammed",
        "category": "orphan",
        "birthdate": "2015-03-15",
        "gender": "male",
        "country": {
          "id": "c1234567-e89b-12d3-a456-426614174000",
          "nameAr": "فلسطين",
          "nameEn": "Palestine"
        },
        "additionalInfoAr": null,
        "additionalInfoEn": null
      },
      "payment": {
        "amountType": "fixed",
        "scheduleType": "monthly",
        "requiredAmount": 300,
        "defaultAmount": 300
      },
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
  "details": {
    "nameAr": "string",
    "nameEn": "string",
    "descriptionAr": "string" | null,
    "descriptionEn": "string" | null,
    "country": {
      "id": "string (uuid)",
      "nameAr": "string",
      "nameEn": "string"
    },
    "beneficiariesCount": number | null,
    "implementationDurationDays": number | null,
    "templateNumber": "string" | null
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
  "status": "active" | "completed" | "paused",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
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
      "details": {
        "nameAr": "جامع الرحمة الكبير",
        "nameEn": "Al-Rahma Grand Mosque",
        "descriptionAr": "بناء مسجد جديد في المنطقة",
        "descriptionEn": "Build new mosque in the area",
        "country": {
          "id": "c1234567-e89b-12d3-a456-426614174000",
          "nameAr": "السودان",
          "nameEn": "Sudan"
        },
        "beneficiariesCount": 500,
        "implementationDurationDays": 365,
        "templateNumber": "M-2024-001"
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
  "details": {
    "nameAr": "string",
    "nameEn": "string",
    "descriptionAr": "string" | null,
    "descriptionEn": "string" | null
  },
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "createdAt": "string (ISO timestamp)"
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
      "details": {
        "nameAr": "إطعام المساكين",
        "nameEn": "Feeding the Poor",
        "descriptionAr": "توفير وجبات للمحتاجين",
        "descriptionEn": "Provide meals for those in need"
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
  "details": {
    "nameAr": "string",
    "nameEn": "string",
    "descriptionAr": "string" | null,
    "descriptionEn": "string" | null
  },
  "payment": {
    "amountType": "fixed" | "flexible",
    "scheduleType": "one_time" | "monthly" | "flexible",
    "requiredAmount": number | null,
    "defaultAmount": number | null
  },
  "createdAt": "string (ISO timestamp)"
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
      "details": {
        "nameAr": "كفارة صيام",
        "nameEn": "Fasting Atonement",
        "descriptionAr": "كفارة الإفطار في رمضان",
        "descriptionEn": "Atonement for breaking fast in Ramadan"
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
  "amountQar": number,
  "paymentSchedule": "one_time" | "monthly",
  "status": "completed" | "pending" | "processing" | "failed" | "refunded",
  "notes": "string" | null,
  "createdAt": "string (ISO timestamp)",
  "donation_item": {
    "type": "project" | "charity" | "atonement" | "general",
    "details": {
      "nameAr": "string",
      "nameEn": "string",
      "descriptionAr": "string" | null,
      "descriptionEn": "string" | null,
      "country": {
        "id": "string (uuid)",
        "nameAr": "string",
        "nameEn": "string"
      } | null
      // Additional fields depending on type (project/charity/atonement)
    } | null  // null for general donations
  },
  "transaction": {
    "id": "string (uuid)",
    "status": "string"
  }
}
```

**Example - Show Donation Orders:**
```json
{
  "action": "show",
  "donations": [
    {
      "id": "a50e8400-e29b-41d4-a716-446655440100",
      "amountQar": 500,
      "paymentSchedule": "one_time",
      "status": "completed",
      "notes": "Donation for mosque project",
      "createdAt": "2024-12-15T10:30:00Z",
      "donation_item": {
        "type": "project",
        "details": {
          "nameAr": "جامع الرحمة الكبير",
          "nameEn": "Al-Rahma Grand Mosque",
          "descriptionAr": "بناء مسجد جديد في المنطقة",
          "descriptionEn": "Build new mosque in the area",
          "country": {
            "id": "c1234567-e89b-12d3-a456-426614174000",
            "nameAr": "السودان",
            "nameEn": "Sudan"
          }
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
  "amountQar": number,
  "paymentSchedule": "monthly",
  "status": "completed" | "pending" | "processing" | "failed" | "refunded",
  "createdAt": "string (ISO timestamp)",
  "sponsorship_item": {
    "type": "sponsorship",
    "details": {
      "nameAr": "string",
      "nameEn": "string",
      "category": "orphan" | "student" | "teacher" | "special_needs" | "family",
      "birthdate": "string (ISO date)" | null,
      "gender": "male" | "female" | null,
      "country": {
        "id": "string (uuid)",
        "nameAr": "string",
        "nameEn": "string"
      } | null,
      "additionalInfoAr": "string" | null,
      "additionalInfoEn": "string" | null
    }
  },
  "transaction": {
    "id": "string (uuid)",
    "status": "string"
  }
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
      "amountQar": 300,
      "paymentSchedule": "monthly",
      "status": "active",
      "createdAt": "2024-11-01T08:00:00Z",
      "sponsorship_item": {
        "type": "sponsorship",
        "details": {
          "nameAr": "محمد",
          "nameEn": "Mohammed",
          "category": "orphan",
          "birthdate": "2015-03-15",
          "gender": "male",
          "country": {
            "id": "c1234567-e89b-12d3-a456-426614174000",
            "nameAr": "فلسطين",
            "nameEn": "Palestine"
          },
          "additionalInfoAr": null,
          "additionalInfoEn": null
        }
      },
      "transaction": {
        "id": "d80e8400-e29b-41d4-a716-446655440201",
        "status": "active"
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

### Response Format

**Success Response (Show Action):**
```json
{
  "status": "success",
  "donations": [
    {
      "id": "a50e8400-e29b-41d4-a716-446655440100",
      "title": "بناء مسجد"
    }
  ],
  "sponsorships": [
    {
      "id": "c70e8400-e29b-41d4-a716-446655440200",
      "title": "محمد"
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
- `title` field for donations is extracted from `donation_item.details.nameAr`
  - For general donations (`type: "general"`): returns "تبرع عام"
  - For project/charity/atonement: extracts from `details.nameAr` field (falls back to `details.nameEn`)
- `title` field for sponsorships is extracted from `sponsorship_item.details.nameAr` (falls back to `details.nameEn`)
- Empty arrays are returned when no orders of that type are displayed
- Response includes all displayed orders with their IDs and titles for backend confirmation
- All entity data is wrapped in a `details` object with camelCase field naming (nameAr, nameEn, descriptionAr, etc.)

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
  "title": "بناء مسجد",
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
| RPC timeout | "RPC call timeout" |
| Network failure | "RPC call failed - [error details]" |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-10 | Initial contract with `client.displayCards` |
| 1.1.0 | 2025-01-10 | Added `agent.selectCard` for user interactions |
| 1.2.0 | 2025-01-10 | Added `client.controlCardModal` for modal control |
| 1.3.0 | 2025-01-11 | Added `Type` field and entity-specific schemas for all 5 entity types (sponsorship, project, faq, charity, atonement) |
| 1.4.0 | 2025-01-11 | Changed `cardId` from `number` to `string (uuid)` in all RPC methods (`client.controlCardModal` and `agent.selectCard`). Updated all examples to use UUID strings. |
| 1.5.0 | 2025-01-16 | Added `client.displayOrders` RPC for displaying user's donation and sponsorship orders. Includes DonationOrder and SponsorshipOrder schemas. |
| 1.6.0 | 2025-01-17 | Updated `client.displayOrders` response format to match `client.displayCards` pattern. Response now includes `donations` and `sponsorships` arrays with extracted `id` and `title` fields for backend confirmation. |
| 1.7.0 | 2025-01-17 | **BREAKING CHANGE**: Updated all entity schemas to reflect actual backend structure. Entity data now wrapped in `details` object with camelCase field naming (nameAr/nameEn instead of name.ar/name.en). Applies to sponsorships, projects, charities, atonements in both displayCards and displayOrders. FAQ cards remain unchanged with nested object format. |
| 1.7.1 | 2025-01-17 | Corrected order status values. Removed non-existent "active" and "cancelled" statuses. Valid statuses are: completed, pending, processing, failed, refunded. |
| 1.8.0 | 2025-01-17 | Added order interaction RPC methods: `client.controlOrderModal` (backend controls order modal open/close) and `agent.selectOrder` (frontend notifies backend when user selects an order). Mirrors the card modal pattern with orderId and orderType parameters. |

---

## Notes

- All RPC payloads must be valid JSON strings
- Backend returns frontend responses as-is (no modification)
- Only RPC failures (network, timeout) should return error strings
- Frontend is responsible for validating payload structure
- The `Type` field helps frontend route to appropriate UI components
- **Backend Data Structure**: Entity data is wrapped in a `details` object with camelCase field naming
  - Use `details.nameAr` / `details.nameEn` (not `name.ar` / `name.en`)
  - Use `details.descriptionAr` / `details.descriptionEn` (not `description.ar` / `description.en`)
  - Use `details.country.nameAr` / `details.country.nameEn` for country names
  - Applies to all entity types: sponsorships, projects, charities, atonements
  - FAQ cards use the old nested object format: `question.ar`, `answer.ar`, `category.ar`
