# Admin User Guide - Megakem Loyalty App

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Members & Loyalty Points](#managing-members--loyalty-points)
4. [Product Management](#product-management)
5. [Scan Management](#scan-management)
6. [Cash Rewards Management](#cash-rewards-management)
7. [Analytics & Reporting](#analytics--reporting)
8. [System Configuration](#system-configuration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

1. **Navigate to the Application**
   - Open your browser and go to the Megakem Loyalty App URL
   
2. **Login as Admin**
   - Click on "Admin Panel" button on the welcome screen
   - Enter your admin email and password
   - Default admin credentials can be found in `LOGIN_CREDENTIALS.md`

3. **Admin Dashboard**
   - After successful login, you'll see the admin dashboard with multiple tabs

### Admin Interface Overview

The admin panel consists of several main sections accessible via tabs:
- **Dashboard** - Overview of key metrics and statistics
- **Scan Management** - View and manage all product scans
- **Product Management** - Add, edit, and configure products
- **Members & Loyalty Points** - Manage member accounts and points
- **Cash Rewards** - Calculate and track cash rewards for applicators
- **Analytics** - Advanced analytics and reporting
- **User Management** - Manage admin users and permissions

---

## Dashboard Overview

### Key Metrics Displayed

1. **Scan Statistics**
   - Total scans count
   - Applicator vs. Customer scans
   - Recent scans (last 24 hours)
   - Weekly scan trends

2. **Member Statistics**
   - Total members
   - Members by tier (Bronze, Silver, Gold, Platinum)
   - Members by role (Applicator vs. Customer)
   - Total points distributed

3. **Product Performance**
   - Top scanned products
   - Product performance charts
   - Category distribution

4. **Visual Analytics**
   - Daily scan trends (bar charts)
   - Tier distribution (pie charts)
   - Role distribution charts

### Refreshing Data

- Click the **Refresh** button (circular arrow icon) to update dashboard data
- Data automatically updates when you switch between tabs

---

## Managing Members & Loyalty Points

### Viewing Members

1. Navigate to **"Members & Loyalty Points"** tab
2. View complete member list with:
   - Member ID
   - Name and contact details
   - Role (Applicator/Customer)
   - Current points and tier
   - Total scans
   - Last scan date

### Searching and Filtering Members

**Search Members:**
- Use the search box to find members by:
  - Member ID
  - Name
  - Phone number

**Filter Members:**
- **By Role:** Select "All", "Applicator", or "Customer"
- **By Tier:** Filter by Bronze, Silver, Gold, or Platinum
- **Sort Options:** Sort by points, scans, or date

### Managing Member Points

**Update Member Points:**

1. Find the member in the list
2. Click the **Edit/Update Points** button for that member
3. Choose operation:
   - **Set Points:** Replace current points with a new value
   - **Add Points:** Increase points by specified amount
   - **Subtract Points:** Decrease points by specified amount
4. Enter the point value
5. Click **Save**

**Important Notes:**
- Points cannot be negative (minimum is 0)
- Tier is automatically updated based on new points
- All point changes are logged

### Understanding Tier System

Member tiers are automatically assigned based on point thresholds:

| Tier     | Default Points Threshold | Benefits                           |
|----------|--------------------------|-------------------------------------|
| Bronze   | 0 - 1,999 points         | Standard rewards                    |
| Silver   | 2,000 - 4,999 points     | 5% bonus on rewards                 |
| Gold     | 5,000 - 9,999 points     | 10% bonus + priority support        |
| Platinum | 10,000+ points           | 15% bonus + exclusive benefits      |

*Note: Thresholds are configurable - see [System Configuration](#system-configuration)*

### Syncing Members from Scans

If you need to rebuild member data from existing scans:

1. Navigate to **Members & Loyalty Points** tab
2. Click **"Sync Members from Scans"** button
3. Confirm the operation
4. System will:
   - Create new members from scans
   - Update existing member information
   - Recalculate all points
   - Update tier assignments

**When to Use Sync:**
- After bulk data import
- After system configuration changes
- To fix data inconsistencies
- After restoring from backup

---

## Product Management

### Viewing Products

1. Navigate to **"Product Management"** tab
2. View all products with:
   - Product number/code
   - Product name
   - Category/pack size
   - Price
   - Points configuration
   - Active/Inactive status

### Adding New Products

1. Click **"Add New Product"** button
2. Fill in product details:
   - **Product Number:** Unique identifier (e.g., "MK-001")
   - **Product Name:** Full product name
   - **Category:** Product category or pack size
   - **Price:** Product price (used for points calculation)
   - **Description:** Optional product description
3. Click **Save**

### Editing Products

1. Find the product in the list
2. Click **Edit** button
3. Modify any field
4. Click **Save Changes**

### Configuring Product Points

**Price-Based Points (Default):**
- Points = Product Price ÷ 1000
- Example: Rs. 25,000 product = 25 points
- Applicators get 10% bonus automatically

**Product-Specific Points:**
1. Click **"Configure Points"** for a product
2. Choose option:
   - **Use Default (Price-Based):** Leave blank
   - **Fixed Points Per Product:** Enter specific point value
   - **Points Per Pack Size:** Set different points for each pack size
3. Save configuration

**Pack Size Pricing:**
- Some products have multiple pack sizes with different prices
- Configure pricing for each pack size:
  - 1kg, 5kg, 10kg, 25kg, etc.
  - Each size can have different points

### Bulk Product Operations

**Export Products:**
1. Click **"Export to Excel"** button
2. Excel file downloads with all product data

**Import Products:**
1. Prepare Excel file with columns:
   - productNo, name, category, price, description
2. Click **"Import from Excel"**
3. Select file
4. Confirm import

**Delete Products:**
- Click **Delete** button next to product
- Confirm deletion
- **Warning:** Cannot be undone!

---

## Scan Management

### Viewing Scans

1. Navigate to **"Scan Management"** tab
2. View all scans with:
   - Date and time
   - Member ID and name
   - Role (Applicator/Customer)
   - Product details
   - Batch number and bag number
   - Quantity/pack size
   - Price
   - Points earned

### Filtering Scans

**Filter Options:**
- **By Role:** Applicator or Customer
- **By Date Range:** Custom date picker
- **By Member ID:** Search specific member
- **By Phone:** Search by phone number

### Live Scan Feed

- Shows most recent 100 scans
- Auto-refreshes to show new scans
- Real-time monitoring of scanning activity

### Exporting Scan Data

1. Apply desired filters
2. Click **"Export to Excel"** button
3. Download Excel file with filtered data
4. Includes all scan details and timestamps

### Deleting Scans

**When to Delete:**
- Duplicate scans (though system prevents these)
- Error corrections
- Data cleanup

**How to Delete:**
1. Find the scan in the list
2. Click **Delete** button
3. Confirm deletion
4. **Note:** Points will need manual adjustment if scan had points

---

## Cash Rewards Management

### Understanding Cash Rewards

Cash rewards are **only for Applicators** and calculated based on:
- Monthly purchase value (sum of all scanned product prices)
- Tiered percentage rates (higher purchases = higher rates)

### Cash Reward Tiers

| Purchase Value Range          | Reward Rate |
|-------------------------------|-------------|
| Rs. 0 - 250,000               | 4.50%       |
| Rs. 250,001 - 500,000         | 5.00%       |
| Rs. 500,001 - 750,000         | 5.50%       |
| Rs. 750,001 - 1,000,000       | 6.00%       |
| Above Rs. 1,000,000           | 6.50%       |

**Example Calculation:**
- Monthly purchases: Rs. 600,000
- Breakdown:
  - First Rs. 250,000 × 4.5% = Rs. 11,250
  - Next Rs. 250,000 × 5.0% = Rs. 12,500
  - Remaining Rs. 100,000 × 5.5% = Rs. 5,500
- **Total Reward: Rs. 29,250**

### Calculating Cash Rewards

1. Navigate to **"Cash Rewards"** tab
2. Select year and month
3. Click **"Calculate Rewards for All Applicators"**
4. System will:
   - Calculate purchase value from scans
   - Apply tiered reward rates
   - Display rewards for each applicator

### Viewing Individual Applicator Rewards

1. Search for applicator by Member ID
2. View reward history:
   - Monthly purchase values
   - Calculated rewards
   - Payment status
   - Total rewards earned

### Marking Rewards as Paid

1. Find the applicator and month
2. Verify reward amount
3. Click **"Mark as Paid"** button
4. Confirm payment
5. Record updates with:
   - Payment date
   - Total paid rewards increased

### Exporting Reward Reports

1. Select month and year
2. Click **"Export Rewards Report"**
3. Excel file includes:
   - Applicator details
   - Purchase values
   - Reward calculations
   - Payment status

---

## Analytics & Reporting

### Available Reports

1. **Dashboard Analytics**
   - Overall system statistics
   - Trend analysis
   - Performance metrics

2. **Member Analytics**
   - Member growth over time
   - Tier distribution
   - Engagement metrics

3. **Product Performance**
   - Top products by scans
   - Category analysis
   - Product trends

4. **Scan Analytics**
   - Daily/weekly/monthly trends
   - Role-based analysis
   - Location-based insights (if data available)

### Generating Custom Reports

1. Navigate to **Analytics** tab
2. Select report type
3. Choose date range
4. Apply filters (role, tier, product, etc.)
5. Click **"Generate Report"**
6. View or export results

### Exporting Analytics Data

All reports can be exported to:
- **Excel (.xlsx)** - For detailed analysis
- **PDF** - For sharing and printing
- **CSV** - For data processing

---

## System Configuration

### Configuring Loyalty Tier Thresholds

1. Navigate to **"Loyalty Configuration"** section
2. Click **"Configure Tier Thresholds"**
3. Set point requirements:
   - Bronze: Starting points (default: 0)
   - Silver: Points required (default: 2,000)
   - Gold: Points required (default: 5,000)
   - Platinum: Points required (default: 10,000)
4. Click **Save**
5. All member tiers will update automatically

### Configuring Points Calculation Method

**Available Methods:**

1. **Price-Based (Default)**
   - Points = Price ÷ Divisor
   - Set divisor (default: 1000)
   - Set applicator bonus percentage (default: 10%)

2. **Product-Based**
   - Set specific points per product
   - Override price-based calculation
   - Can vary by pack size

3. **Fixed**
   - Same points for all products
   - Simpler but less flexible

**How to Configure:**
1. Navigate to **"Loyalty Configuration"**
2. Select points calculation method
3. Set parameters:
   - Price divisor (if price-based)
   - Applicator bonus percentage
   - Fixed points value (if fixed method)
4. Save changes

### Applicator Bonus Configuration

- Default: 10% extra points for applicators
- Configurable from 0% to 100%
- Applied automatically on all scans
- Example: Product worth 20 points
  - Customer: 20 points
  - Applicator: 22 points (20 + 10% bonus)

---

## Best Practices

### Data Management

1. **Regular Backups**
   - System auto-backs up daily
   - Manual backups before major changes
   - Test restore procedures periodically

2. **Data Validation**
   - Review scan data weekly
   - Check for anomalies or duplicates
   - Verify member information accuracy

3. **System Maintenance**
   - Monitor system performance
   - Archive old data (scans older than 2 years)
   - Regular database optimization

### Member Management

1. **Regular Reviews**
   - Audit member points quarterly
   - Verify tier assignments
   - Clean up inactive members

2. **Communication**
   - Notify members of tier changes
   - Send reward redemption reminders
   - Update members on policy changes

3. **Dispute Resolution**
   - Review member complaints promptly
   - Check scan history for discrepancies
   - Adjust points when errors confirmed

### Cash Rewards

1. **Monthly Process**
   - Calculate rewards by 5th of following month
   - Review all calculations before approval
   - Process payments by 15th of month
   - Mark as paid immediately after payment

2. **Documentation**
   - Export monthly reward reports
   - Keep payment records for 5 years
   - Document any manual adjustments

3. **Verification**
   - Cross-check with scan data
   - Verify product prices are correct
   - Confirm no duplicate scans included

### Security

1. **User Access**
   - Use strong passwords
   - Change passwords every 90 days
   - Don't share admin credentials
   - Log out when finished

2. **Data Privacy**
   - Protect member information
   - Follow data protection policies
   - Secure exported files
   - Limit data access to authorized personnel

3. **Audit Trail**
   - System logs all admin actions
   - Review logs monthly
   - Report suspicious activity
   - Maintain accountability

---

## Troubleshooting

### Common Issues and Solutions

#### Members Not Showing Points

**Problem:** Member has scans but no points
**Solutions:**
1. Check loyalty configuration is enabled
2. Verify products have prices
3. Run "Sync Members from Scans"
4. Check for system errors in logs

#### Duplicate Scans

**Problem:** Same batch scanned twice
**Solution:**
- System prevents duplicates automatically
- If duplicate exists (old data), delete one
- Only one scan per batch per role allowed

#### Cash Rewards Not Calculating

**Problem:** Reward shows Rs. 0
**Solutions:**
1. Verify member is an applicator (not customer)
2. Check scans have price data
3. Confirm month/year selection is correct
4. Verify products have prices in system

#### Points Not Updating

**Problem:** Scan added but member points unchanged
**Solutions:**
1. Refresh the member list
2. Check points calculation configuration
3. Verify product has valid price
4. Run manual sync if needed

#### Login Issues

**Problem:** Cannot access admin panel
**Solutions:**
1. Check username/email is correct
2. Use "Forgot Password" if needed
3. Clear browser cache
4. Contact system administrator
5. Check if account is active

#### Data Export Failing

**Problem:** Excel export not working
**Solutions:**
1. Check browser allows downloads
2. Reduce date range (too much data)
3. Clear browser cache
4. Try different browser
5. Check disk space

#### Slow Performance

**Problem:** System running slowly
**Solutions:**
1. Reduce number of displayed records
2. Use date filters to limit data
3. Clear browser cache
4. Close unnecessary tabs
5. Contact IT if persistent

### Getting Help

**Support Channels:**
1. Check this guide first
2. Review system documentation
3. Contact system administrator
4. Email: support@megakem.com
5. Phone: [Contact Number]

**When Reporting Issues:**
- Describe the problem clearly
- Include screenshots if possible
- Note exact error messages
- Mention when issue started
- List steps taken so far

### System Requirements

**Recommended Browser:**
- Google Chrome (latest version)
- Mozilla Firefox (latest version)
- Microsoft Edge (latest version)

**Internet Connection:**
- Minimum: 2 Mbps
- Recommended: 5+ Mbps

**Screen Resolution:**
- Minimum: 1280x720
- Recommended: 1920x1080

---

## Appendix

### Keyboard Shortcuts

| Action                  | Shortcut       |
|-------------------------|----------------|
| Save                    | Ctrl + S       |
| Search                  | Ctrl + F       |
| Export                  | Ctrl + E       |
| Refresh                 | Ctrl + R       |
| Close Dialog            | Esc            |

### Glossary

- **Applicator:** Professional who applies Megakem products
- **Customer:** Regular customer who purchases products
- **Batch Number:** Unique production batch identifier
- **Bag Number:** Individual bag/package identifier
- **Scan:** Record of product purchase via QR code
- **Points:** Loyalty points earned from purchases
- **Tier:** Loyalty level based on accumulated points
- **Cash Reward:** Monthly commission paid to applicators

### Important Links

- Main Application: [App URL]
- Documentation: `WEBSITE_UPDATES_ROADMAP.md`
- API Docs: `API_DOCUMENTATION.md`
- Login Credentials: `LOGIN_CREDENTIALS.md`

---

**Last Updated:** December 22, 2025  
**Version:** 1.0  
**Author:** Megakem System Administration Team





