# User Permissions System

## Overview
The Megakem Loyalty App now features a granular, per-user permissions system that allows administrators to control what actions each co-admin can perform.

## Permission Types

### 1. **canDelete**
- **Description**: Allows user to delete scan records
- **Controls**:
  - Delete button in scan history (disabled if user lacks permission)
  - `handleDeleteScan()` function blocks execution with error message
- **Visual Indicator**: Red chip in Users table

### 2. **canExport**
- **Description**: Allows user to export data to CSV or JSON
- **Controls**:
  - Export CSV button (disabled)
  - Export JSON button (disabled)
  - `handleExportData()` function blocks execution with error message
- **Visual Indicator**: Blue chip in Users table

### 3. **canManageUsers**
- **Description**: Allows user to create, edit, and delete co-admin accounts
- **Controls**:
  - Add Co-Admin button (disabled)
  - Edit permissions button in Users table (disabled)
  - Delete user button in Users table (disabled)
  - `handleDeleteUser()` function blocks execution with error message
- **Visual Indicator**: Orange chip in Users table

### 4. **canManageProducts**
- **Description**: Allows user to create, edit, and delete products
- **Controls**:
  - Add Product button (disabled)
  - Edit product button in Products table (disabled)
  - Delete product button in Products table (disabled)
  - `handleDeleteProduct()` function blocks execution with error message
- **Visual Indicator**: Green chip in Users table

## Implementation Details

### Permission Storage
```javascript
user.permissions = {
  canDelete: true/false,
  canExport: true/false,
  canManageUsers: true/false,
  canManageProducts: true/false
}
```

### Permission Checking
```javascript
const hasPermission = (permission) => {
  // Find current logged-in user from users array
  const currentUser = users.find(u => u.email === adminEmail);
  
  // If user found, check their specific permission
  if (currentUser && currentUser.permissions) {
    return currentUser.permissions[permission] !== false;
  }
  
  // Default permissions for main admin or if permissions not set
  return userPermissions[permission] !== false;
};
```

### User Dialog Features
- **Create Mode**: Shows all fields including password (required)
- **Edit Mode**: Shows all fields except password (not required for permission changes)
- **Permission Toggles**: 4 switches for each permission type with descriptions
- **Save Logic**: 
  - Creates new user with permissions when no `_id` exists
  - Updates existing user permissions when `_id` exists

### Users Table Display
- **Permissions Column**: Shows colored chips for each enabled permission
  - Red: Delete permission
  - Blue: Export permission
  - Orange: Users permission
  - Green: Products permission
- **Actions Column**: 
  - Edit button (opens dialog with existing permissions)
  - Delete button (removes co-admin)
  - Both buttons disabled if current user lacks `canManageUsers` permission

### Activity Logging
The following permission-related actions are logged:
- User creation with permissions
- Permission updates for existing users
- User deletions
- Permission-denied actions

## Usage Flow

### Creating a Co-Admin with Custom Permissions
1. Admin clicks "Add Co-Admin" button (requires `canManageUsers`)
2. Dialog opens with all 4 permissions enabled by default
3. Admin customizes permissions using toggle switches
4. Admin fills in username, email, password, and saves
5. New co-admin is created with specified permissions
6. Activity log records the creation

### Editing Co-Admin Permissions
1. Admin clicks Edit button next to co-admin in Users table (requires `canManageUsers`)
2. Dialog opens pre-filled with existing user data and current permissions
3. Admin toggles permissions as needed
4. Admin saves changes (no password required for permission updates)
5. Permissions are updated in database
6. Activity log records the permission change

### Permission Enforcement
1. When co-admin logs in, their permissions are loaded from the database
2. Throughout the app, buttons are disabled based on permissions
3. Functions check permissions before executing actions
4. Users see error notifications when attempting unauthorized actions
5. Activity log records permission-denied attempts

## Backend Requirements

### User Model Updates
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String,
  permissions: {
    canDelete: Boolean,
    canExport: Boolean,
    canManageUsers: Boolean,
    canManageProducts: Boolean
  },
  isActive: Boolean,
  createdAt: Date
}
```

### API Endpoints
- **POST /api/auth/create-user**: Creates user with permissions object
- **PUT /api/auth/update-user/:id**: Updates user including permissions
- **GET /api/auth/users**: Returns all users with their permissions
- **DELETE /api/auth/users/:id**: Deletes user (requires canManageUsers)

### Authentication
- Login response should include user's permissions
- Permissions should be validated on both frontend and backend
- Backend should enforce permissions for all protected endpoints

## Security Considerations

1. **Frontend Validation**: UI buttons are disabled, but backend must also validate
2. **Permission Inheritance**: Main admin (admin@megakem.com) has all permissions by default
3. **Admin Hierarchy**: **ONLY the main admin can manage co-admins**. Co-admins CANNOT edit, create, or delete other co-admins, even if they have `canManageUsers` permission
4. **Main Admin Identification**: Main admin is identified by email address: admin@megakem.com
5. **Audit Trail**: All permission changes are logged in activity log
6. **Default Permissions**: New co-admins get all permissions enabled by default (can be customized during creation by main admin)

## Testing Checklist

- [ ] Create co-admin with all permissions
- [ ] Create co-admin with no permissions
- [ ] Create co-admin with mixed permissions
- [ ] Edit existing co-admin's permissions
- [ ] Verify buttons are disabled based on permissions
- [ ] Verify functions block unauthorized actions
- [ ] Verify error messages appear for permission-denied actions
- [ ] Verify activity log records permission changes
- [ ] Test with multiple co-admins with different permission sets
- [ ] Verify backend enforces permissions on API endpoints

## Future Enhancements

1. **Role-Based Templates**: Pre-configured permission sets for common roles
2. **Time-Based Permissions**: Permissions that expire after a certain date
3. **IP-Based Restrictions**: Limit certain actions to specific IP ranges
4. **Two-Factor Authentication**: Additional security for sensitive operations
5. **Permission History**: Track when permissions were changed and by whom
6. **Bulk Permission Management**: Change permissions for multiple users at once
