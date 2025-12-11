# Automatic Pack Size and Price Matching

## Overview
The system now automatically extracts pack size from batch numbers and matches the correct product price based on both the product code and pack size.

## How It Works

### 1. Batch Number Format
Batch numbers follow this format: `PRODUCTCODE MATERIALBATCH DATECOCODE PACKSIZE PACKNO`

Example: `MLSP 001 050525 010 001`
- **MLSP** = Product Code
- **001** = Material Batch Number
- **050525** = Date (May 5, 2025)
- **010** = Pack Size (10kg)
- **001** = Pack/Bag Number

### 2. Automatic Pack Size Extraction
The system automatically converts 3-digit pack size codes to readable values:
- `001` → `1kg`
- `005` → `5kg`
- `010` → `10kg`
- `025` → `25kg`

### 3. Price Matching
When a product is scanned:
1. System extracts the product code and pack size from the batch number
2. Finds the product in the database by product code
3. Looks up the specific price for that pack size in the `packSizePricing` array
4. Falls back to the default `price` if no pack size pricing exists
5. Displays the price in the cart and saves it with the scan

## Database Structure

### Product Model
```javascript
{
  name: String,
  productNo: String,  // Product code (e.g., "MLSP")
  price: Number,      // Default fallback price
  packSizePricing: [
    {
      packSize: String,  // e.g., "1kg", "10kg", "25kg"
      price: Number      // Price for this specific pack size
    }
  ]
}
```

### Scan Model
```javascript
{
  productName: String,
  productNo: String,
  batchNo: String,
  bagNo: String,
  qty: String,        // Pack size (e.g., "10kg")
  price: Number,      // Automatically matched price
  // ... other fields
}
```

## Setup Instructions

### Step 1: Update Existing Products
Run the pack size pricing script to add pricing tiers to your products:

```bash
cd backend
node scripts/addPackSizePricing.js
```

This will add pack size pricing to your existing products (MLSP, WP100, CH).

### Step 2: Add New Products with Pack Size Pricing
When adding products through the admin panel or via API, include the `packSizePricing` array:

```javascript
{
  name: "Product Name",
  productNo: "CODE",
  price: 2500,  // Fallback price
  packSizePricing: [
    { packSize: "1kg", price: 500 },
    { packSize: "5kg", price: 2200 },
    { packSize: "10kg", price: 4000 },
    { packSize: "25kg", price: 9500 }
  ]
}
```

## Features

### Cart Display
- Shows pack size (e.g., "10kg") as quantity
- Displays price per item as a green chip
- Shows total estimated value at the bottom of the cart

### Scan History (Admin)
- All scans now include price information
- Analytics show total product value
- Price breakdown by product in reports

### Automatic Calculation
- No manual price entry needed
- Consistent pricing across all scans
- Easy to update prices in product database

## Example Scenarios

### Scenario 1: Scanning 10kg Pack
**Batch Number:** `MLSP 001 050525 010 001`
- Product: Megakem Liquid Sealer Plus (MLSP)
- Pack Size: 10kg
- Price: Rs. 4,000 (automatically matched)

### Scenario 2: Scanning 1kg Pack
**Batch Number:** `MLSP 001 050525 001 002`
- Product: Megakem Liquid Sealer Plus (MLSP)
- Pack Size: 1kg
- Price: Rs. 500 (automatically matched)

### Scenario 3: Unknown Pack Size
If a pack size doesn't exist in `packSizePricing`, the system uses the default `price` field.

## Customization

### Adjusting Price Tiers
Edit the `addPackSizePricing.js` script or update products via admin panel/API:

```javascript
await Product.findOneAndUpdate(
  { productNo: 'MLSP' },
  {
    $set: {
      packSizePricing: [
        { packSize: '1kg', price: 550 },    // Updated price
        { packSize: '10kg', price: 4200 },  // Updated price
        // Add more sizes as needed
      ]
    }
  }
);
```

### Adding New Pack Sizes
Simply add new entries to the `packSizePricing` array:

```javascript
{ packSize: '50kg', price: 18000 }
```

## Benefits

1. **Automatic**: No manual price lookup or entry
2. **Accurate**: Prices always match the actual pack size
3. **Flexible**: Easy to update pricing for any pack size
4. **Transparent**: Users see exact prices in cart before submission
5. **Comprehensive**: Full pricing data in analytics and reports
6. **Scalable**: Support unlimited pack sizes per product

## Notes

- The system requires batch numbers in the correct format
- Products must have pack size pricing configured for automatic matching
- Default price is used if no pack size pricing exists
- Pack size codes must be 3 digits (e.g., 001, 010, 025)
