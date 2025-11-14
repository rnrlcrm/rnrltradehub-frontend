# Commodity Parameters Feature - User Guide

## Overview

The Commodity Parameters feature allows administrators and back office staff to define and manage quality and specification parameters for each commodity. This is essential for commodities like Cotton, where parameters such as Staple Length, Micronaire, Strength, Moisture, and Trash need to be tracked.

## Accessing the Feature

1. Navigate to **Settings** from the main menu
2. Click on **Commodity Master** tab
3. Click **Edit** on any existing commodity
4. You will see two tabs:
   - **Commodity Details**: The main commodity information
   - **Parameters**: The new parameters management section

> **Note**: The Parameters tab is only available when editing an existing commodity, not when creating a new one. This ensures that parameters are added after the commodity is properly set up.

## User Interface Layout

### Main View (Empty State)

When no parameters are defined:
```
┌─────────────────────────────────────────────────────────────┐
│ Commodity Parameters                    [Add Parameter]     │
│ Manage quality and specification parameters for this        │
│ commodity                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   No parameters defined yet                  │
│                                                              │
│                   [Add First Parameter]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Main View (With Parameters)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Commodity Parameters                                    [Add Parameter]       │
│ Manage quality and specification parameters for this commodity                │
├───────────────────────────────────────────────────────────────────────────────┤
│ Parameter Name │ Unit │ Field Type │ Range/Options │ Status   │ Actions     │
├────────────────┼──────┼────────────┼───────────────┼──────────┼─────────────┤
│ Staple Length  │ mm   │ [numeric]  │ 20.0 to 35.0  │ [Active] │ Edit Delete │
│ Micronaire     │ -    │ [numeric]  │ 3.5 to 5.0    │ [Active] │ Edit Delete │
│ Strength       │g/tex │ [numeric]  │ 25.0 to 35.0  │ [Active] │ Edit Delete │
│ Moisture       │ %    │ [numeric]  │ - to 12.0     │ [Active] │ Edit Delete │
│ Grade          │ -    │ [dropdown] │ A, B, C, D    │ [Active] │ Edit Delete │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Add/Edit Parameter Modal

```
┌─────────────────────────────────────────────────────┐
│ Add Parameter                              [×]      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Parameter Name *                                     │
│ [Staple Length                                    ]  │
│                                                      │
│ Field Type *                                         │
│ [Numeric ▼]                                          │
│                                                      │
│ Unit (Optional)                                      │
│ [mm                                              ]   │
│                                                      │
│ Min Value (Optional)    Max Value (Optional)         │
│ [20.0              ]    [35.0                    ]   │
│                                                      │
│ ☑ Active                                             │
│                                                      │
│                           [Cancel]  [Create]         │
└─────────────────────────────────────────────────────┘
```

## How to Use

### Adding a New Parameter

1. Click **"Add Parameter"** button
2. Fill in the form:
   - **Parameter Name** (required): e.g., "Staple Length"
   - **Field Type** (required): Choose from:
     - **Numeric**: For numerical values with optional min/max range
     - **Text**: For free-form text
     - **Dropdown**: For predefined options
   - **Unit** (optional): e.g., "mm", "%", "g/tex"
   - For **Numeric** type:
     - **Min Value** (optional): Minimum allowed value
     - **Max Value** (optional): Maximum allowed value
   - For **Dropdown** type:
     - **Dropdown Options** (required): Comma-separated values (e.g., "A, B, C, D")
   - **Active**: Check to make the parameter active
3. Click **"Create"**

### Editing a Parameter

1. Click **"Edit"** next to the parameter you want to modify
2. Update the fields as needed
3. Click **"Update"**

### Deleting a Parameter

1. Click **"Delete"** next to the parameter
2. Confirm the deletion in the popup dialog
3. The parameter will be permanently removed

### Toggling Active Status

1. Click on the **Active/Inactive** badge in the Status column
2. The status will toggle immediately
3. Inactive parameters remain in the system but are marked as not active

## Field Types Explained

### Numeric
- Used for measurable quantities
- Supports optional min/max range
- Examples: Staple Length (20-35 mm), Moisture (max 12%), Strength (25-35 g/tex)
- Displays as: "20.0 to 35.0" in the table

### Text
- Used for free-form text descriptions
- No range restrictions
- Examples: Quality Notes, Origin Description
- Displays as: "-" in the range column

### Dropdown
- Used for predefined options
- Requires comma-separated options
- Examples: Grade (A, B, C, D), Color (White, Yellow, Spotted)
- Displays as: "A, B, C, D" in the table

## Common Parameter Examples

### For Cotton:
- **Staple Length**: Numeric, Unit: mm, Min: 20, Max: 35
- **Micronaire**: Numeric, Min: 3.5, Max: 5.0
- **Strength**: Numeric, Unit: g/tex, Min: 25, Max: 35
- **Moisture**: Numeric, Unit: %, Max: 12
- **Trash**: Numeric, Unit: %, Max: 5
- **Grade**: Dropdown, Options: A, B, C, D

### For Wheat:
- **Protein Content**: Numeric, Unit: %, Min: 10, Max: 15
- **Moisture**: Numeric, Unit: %, Max: 12
- **Test Weight**: Numeric, Unit: kg/hl, Min: 75, Max: 85
- **Gluten**: Numeric, Unit: %, Min: 24, Max: 32

## Validation Rules

1. **Parameter Name** cannot be empty
2. For **Numeric** type:
   - Min/Max values must be valid numbers if provided
   - Min value cannot be greater than Max value
3. For **Dropdown** type:
   - At least one option must be provided
4. **Parameter names must be unique** within the same commodity

## Tips

- ✅ Add all common parameters for a commodity to standardize quality tracking
- ✅ Use appropriate units for clarity (mm, %, g/tex, etc.)
- ✅ Set realistic min/max ranges based on industry standards
- ✅ Use dropdown for standardized grades or classifications
- ✅ Keep parameter names clear and concise
- ✅ Mark parameters as inactive instead of deleting if they might be needed later

## Notifications

The system provides feedback for all actions:
- ✅ **Success**: Green toast notification in top-right corner
- ❌ **Error**: Red toast notification with error details
- ⚠️ **Validation**: Red error messages below form fields
- ℹ️ **Confirmation**: Dialog boxes for destructive actions (delete)

## Backend Requirements

This feature requires backend API implementation. See:
- **COMMODITY_PARAMETERS_API_SPEC.md** for complete API specification
- **COMMODITY_PARAMETERS_IMPLEMENTATION.md** for implementation summary

Once backend is deployed, this feature will be fully functional and ready for production use.

## Support

For issues or questions:
- Contact the development team
- Refer to API documentation in project root
- Check implementation summary for technical details
