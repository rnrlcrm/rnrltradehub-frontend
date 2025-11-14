# Commodity Parameters API Specification

## Overview
This document specifies the backend API endpoints required to support the Commodity Parameters feature. The frontend is fully implemented and ready for integration.

## Database Schema

### Table: `commodity_parameters`

```sql
CREATE TABLE commodity_parameters (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  commodity_id BIGINT NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NULL,
  min_value DECIMAL(10,2) NULL,
  max_value DECIMAL(10,2) NULL,
  field_type ENUM('numeric', 'text', 'dropdown') NOT NULL,
  dropdown_options TEXT NULL, -- JSON array for dropdown options
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (commodity_id) REFERENCES commodities(id) ON DELETE CASCADE,
  INDEX idx_commodity_id (commodity_id),
  INDEX idx_active (is_active)
);
```

## API Endpoints

### 1. Get All Parameters for a Commodity

**Endpoint:** `GET /commodity/{commodityId}/parameters`

**Description:** Retrieves all parameters for a specific commodity.

**Path Parameters:**
- `commodityId` (number, required): The ID of the commodity

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "commodityId": 123,
      "parameterName": "Staple Length",
      "unit": "mm",
      "minValue": 20.0,
      "maxValue": 35.0,
      "fieldType": "numeric",
      "dropdownOptions": null,
      "isActive": true,
      "createdAt": "2024-11-14T10:00:00Z",
      "updatedAt": "2024-11-14T10:00:00Z"
    },
    {
      "id": 2,
      "commodityId": 123,
      "parameterName": "Micronaire",
      "unit": null,
      "minValue": 3.5,
      "maxValue": 5.0,
      "fieldType": "numeric",
      "dropdownOptions": null,
      "isActive": true,
      "createdAt": "2024-11-14T10:00:00Z",
      "updatedAt": "2024-11-14T10:00:00Z"
    },
    {
      "id": 3,
      "commodityId": 123,
      "parameterName": "Grade",
      "unit": null,
      "minValue": null,
      "maxValue": null,
      "fieldType": "dropdown",
      "dropdownOptions": ["A", "B", "C"],
      "isActive": true,
      "createdAt": "2024-11-14T10:00:00Z",
      "updatedAt": "2024-11-14T10:00:00Z"
    }
  ],
  "success": true
}
```

**Error Response:** `404 Not Found`
```json
{
  "data": null,
  "message": "Commodity not found",
  "success": false
}
```

---

### 2. Create Parameter

**Endpoint:** `POST /commodity/{commodityId}/parameters`

**Description:** Creates a new parameter for a commodity.

**Path Parameters:**
- `commodityId` (number, required): The ID of the commodity

**Request Body:**
```json
{
  "parameterName": "Staple Length",
  "unit": "mm",
  "minValue": 20.0,
  "maxValue": 35.0,
  "fieldType": "numeric",
  "dropdownOptions": null,
  "isActive": true
}
```

**Field Descriptions:**
- `parameterName` (string, required): Name of the parameter (e.g., "Staple Length", "Moisture", "Trash")
- `unit` (string, optional): Unit of measurement (e.g., "mm", "%", "g/tex")
- `minValue` (number, optional): Minimum allowed value (for numeric type)
- `maxValue` (number, optional): Maximum allowed value (for numeric type)
- `fieldType` (string, required): Type of field - one of: "numeric", "text", "dropdown"
- `dropdownOptions` (array of strings, optional): Required if fieldType is "dropdown"
- `isActive` (boolean, optional): Whether the parameter is active, defaults to true

**Validation Rules:**
1. `parameterName` must not be empty
2. If `fieldType` is "numeric":
   - `minValue` and `maxValue` must be numbers if provided
   - `minValue` must be less than `maxValue` if both provided
3. If `fieldType` is "dropdown":
   - `dropdownOptions` must be provided and contain at least one option
4. Parameter name must be unique within the commodity

**Response:** `201 Created`
```json
{
  "data": {
    "id": 1,
    "commodityId": 123,
    "parameterName": "Staple Length",
    "unit": "mm",
    "minValue": 20.0,
    "maxValue": 35.0,
    "fieldType": "numeric",
    "dropdownOptions": null,
    "isActive": true,
    "createdAt": "2024-11-14T10:00:00Z",
    "updatedAt": "2024-11-14T10:00:00Z"
  },
  "success": true,
  "message": "Parameter created successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "data": null,
  "message": "Parameter name already exists for this commodity",
  "success": false
}
```

---

### 3. Update Parameter

**Endpoint:** `PUT /commodity/parameters/{parameterId}`

**Description:** Updates an existing parameter.

**Path Parameters:**
- `parameterId` (number, required): The ID of the parameter to update

**Request Body:**
```json
{
  "parameterName": "Staple Length (Updated)",
  "unit": "mm",
  "minValue": 22.0,
  "maxValue": 38.0,
  "fieldType": "numeric",
  "dropdownOptions": null,
  "isActive": true
}
```

**Note:** All fields are optional in the update request. Only provided fields will be updated.

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "commodityId": 123,
    "parameterName": "Staple Length (Updated)",
    "unit": "mm",
    "minValue": 22.0,
    "maxValue": 38.0,
    "fieldType": "numeric",
    "dropdownOptions": null,
    "isActive": true,
    "createdAt": "2024-11-14T10:00:00Z",
    "updatedAt": "2024-11-14T10:30:00Z"
  },
  "success": true,
  "message": "Parameter updated successfully"
}
```

**Error Response:** `404 Not Found`
```json
{
  "data": null,
  "message": "Parameter not found",
  "success": false
}
```

---

### 4. Delete Parameter

**Endpoint:** `DELETE /commodity/parameters/{parameterId}`

**Description:** Deletes a parameter.

**Path Parameters:**
- `parameterId` (number, required): The ID of the parameter to delete

**Response:** `200 OK`
```json
{
  "data": null,
  "success": true,
  "message": "Parameter deleted successfully"
}
```

**Error Response:** `404 Not Found`
```json
{
  "data": null,
  "message": "Parameter not found",
  "success": false
}
```

---

## Business Rules

1. **Cascade Delete**: When a commodity is deleted, all its parameters should be deleted automatically (handled by foreign key constraint).

2. **Soft Delete Option**: Consider implementing soft delete (is_active flag) instead of hard delete if historical data preservation is important.

3. **Validation**:
   - Parameter names should be unique within a commodity but can be reused across different commodities
   - Numeric min/max values should be validated if both are present
   - Dropdown options should be stored as JSON array

4. **Audit Trail**: Consider adding audit fields (created_by, updated_by) for tracking.

## Frontend Integration Notes

The frontend is fully implemented with:
- ✅ Complete CRUD operations
- ✅ Form validation
- ✅ Error handling with user-friendly messages
- ✅ Toast notifications for success/error
- ✅ Confirmation dialogs for destructive actions
- ✅ Active/inactive toggle functionality
- ✅ Support for all field types (numeric, text, dropdown)

## Testing the Integration

Once backend is implemented, test using these scenarios:

1. **Create Parameter**
   - Navigate to Settings > Commodity Master
   - Edit an existing commodity
   - Go to "Parameters" tab
   - Click "Add Parameter"
   - Fill in the form and save

2. **Edit Parameter**
   - In the Parameters tab, click "Edit" on any parameter
   - Modify values and save

3. **Delete Parameter**
   - In the Parameters tab, click "Delete" on any parameter
   - Confirm the deletion

4. **Toggle Active Status**
   - Click on the Active/Inactive badge to toggle status

## Example Use Cases

### Cotton Parameters
- Staple Length (numeric, unit: mm, min: 20, max: 35)
- Micronaire (numeric, min: 3.5, max: 5.0)
- Strength (numeric, unit: g/tex, min: 25, max: 35)
- Moisture (numeric, unit: %, max: 12)
- Trash (numeric, unit: %, max: 5)
- Grade (dropdown, options: ["A", "B", "C", "D"])

### Wheat Parameters
- Protein Content (numeric, unit: %, min: 10, max: 15)
- Moisture (numeric, unit: %, max: 12)
- Test Weight (numeric, unit: kg/hl, min: 75, max: 85)
- Gluten (numeric, unit: %, min: 24, max: 32)

## Contact

For any clarifications or issues during backend implementation, please refer to:
- Frontend Code: `src/components/commodity/CommodityParametersTab.tsx`
- API Client: `src/api/settingsApi.ts`
- Type Definitions: `src/types.ts`
