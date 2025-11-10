# RPC Contract

### Version: 1.0.0
**Project**: QCharity Voice Agent
**Last Updated**: 2025-01-10

---

## Overview

This document defines the RPC (Remote Procedure Call) contract between the QCharity voice agent (backend) and the web UI (frontend). All RPC methods, payloads, and responses must conform to this specification.

---

## Backend → Frontend RPCs

### client.displayCards

**Purpose**: Display or hide charity project cards in the UI

**Request Payload:**

```json
{
  "action": "show" | "hide",
  "cards": [
    {
      "id": number,
      "title": "string",
      "description": "string"
    }
  ]
}
```

**Payload Fields:**
- `action` (string, required): Either "show" or "hide"
- `cards` (array, required): Array of card objects
  - Empty array `[]` when action is "hide"
  - Populated array when action is "show"

**Card Object Schema:**
```json
{
  "id": number,
  "title": "string",
  "description": "string"
}
```

**Success Response:**
```json
{
  "status": "success",
  "cards": [
    {
      "id": number,
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

**Example - Show Cards:**
```json
// Request
{
  "action": "show",
  "cards": [
    {
      "id": 0,
      "title": "card item 1",
      "description": "this is card 1, and this is a description"
    },
    {
      "id": 1,
      "title": "card item 2",
      "description": "this is card 2, featuring more content"
    }
  ]
}

// Expected Response
{
  "status": "success",
  "cards": [
    {"id": 0, "title": "card item 1"},
    {"id": 1, "title": "card item 2"}
  ]
}
```

**Example - Hide Cards:**
```json
// Request
{
  "action": "hide",
  "cards": []
}

// Expected Response
{
  "status": "success, cards are hidden"
}
```

---

## Frontend → Backend RPCs

_To be implemented_

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

---

## Notes

- All RPC payloads must be valid JSON strings
- Backend returns frontend responses as-is (no modification)
- Only RPC failures (network, timeout) should return error strings
- Frontend is responsible for validating payload structure
