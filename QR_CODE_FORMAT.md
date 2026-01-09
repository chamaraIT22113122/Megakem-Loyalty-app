# QR Code Format Documentation - Megakem Loyalty App

## Table of Contents
1. [Overview](#overview)
2. [QR Code Data Structure](#qr-code-data-structure)
3. [Field Specifications](#field-specifications)
4. [Data Validation Rules](#data-validation-rules)
5. [QR Code Generation](#qr-code-generation)
6. [QR Code Scanning](#qr-code-scanning)
7. [Error Handling](#error-handling)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

The Megakem Loyalty App uses QR codes on product packages to track sales and award loyalty points. Each QR code contains essential product and batch information that is scanned by applicators and customers.

### Purpose

- **Product Tracking:** Identify specific products and batches
- **Authenticity Verification:** Ensure genuine Megakem products
- **Loyalty Points:** Award points to members for purchases
- **Inventory Management:** Track product movement and sales
- **Analytics:** Generate insights on product performance

### QR Code Location

QR codes are printed on:
- Product packaging (bags, containers)
- Product labels
- Batch documentation
- Promotional materials

---

## QR Code Data Structure

### Data Format

QR codes contain plain text with pipe-delimited fields:

```
PRODUCT_NO|PRODUCT_NAME|BATCH_NO|BAG_NO|QUANTITY
```

### Field Order (Required)

1. **PRODUCT_NO** - Product identification code
2. **PRODUCT_NAME** - Full product name
3. **BATCH_NO** - Manufacturing batch number
4. **BAG_NO** - Individual bag/package number
5. **QUANTITY** - Pack size or quantity

### Example

```
MK-001|MEGA BOND PLUS|B2023120501|001|25kg
```

This represents:
- Product Code: MK-001
- Product: MEGA BOND PLUS
- Batch: B2023120501
- Bag Number: 001
- Quantity: 25kg

---

## Field Specifications

### 1. PRODUCT_NO (Product Number/Code)

**Description:** Unique identifier for the product

**Format:**
- Alphanumeric string
- May contain hyphens (-)
- Case-insensitive (stored as uppercase)
- No spaces allowed

**Examples:**
- `MK-001`
- `MK-102`
- `MEGA-BOND-100`
- `TB001`

**Validation Rules:**
- Required field
- Length: 3-20 characters
- Must match existing product in database
- Automatically converted to uppercase

**Database Reference:**
- Must exist in Products collection
- Links to product pricing and details

---

### 2. PRODUCT_NAME

**Description:** Full name of the product

**Format:**
- Text string
- Can contain spaces
- May include special characters
- Case-sensitive (as labeled)

**Examples:**
- `MEGA BOND PLUS`
- `TILE BOND 100`
- `AQUA GUARD PRO`
- `SUPER FIX CEMENT`

**Validation Rules:**
- Required field
- Length: 5-100 characters
- Should match product catalog
- Used for display and reporting

**Usage:**
- Display on scan confirmation
- Product analytics and reports
- Search and filtering

---

### 3. BATCH_NO (Batch Number)

**Description:** Manufacturing batch identification

**Format:**
- Alphanumeric string
- Unique per production batch
- May include date information
- No spaces recommended

**Common Formats:**
```
B2023120501    - B + YYYYMMDD + batch sequence
BATCH-2023-1205 - BATCH-YYYY-MMDD
20231205-01    - YYYYMMDD-sequence
MB20231205     - Prefix + date
```

**Examples:**
- `B2023120501`
- `BATCH-2023-1205`
- `20231205-A1`
- `MB20231205001`

**Validation Rules:**
- Required field
- Length: 5-30 characters
- Must be unique per role (same batch can be scanned by applicator AND customer)
- Used for duplicate detection
- Case-sensitive

**Important:**
- Same batch can only be scanned ONCE per role
- Applicator scan and customer scan of same batch are both allowed
- Duplicate scans within same role are rejected

---

### 4. BAG_NO (Bag/Package Number)

**Description:** Individual package identifier within a batch

**Format:**
- Usually numeric
- Sequential numbering
- May have prefix
- Padded with zeros

**Examples:**
- `001`
- `0001`
- `BAG-001`
- `P-001`
- `A001`

**Validation Rules:**
- Required field
- Length: 1-20 characters
- Unique within batch
- Case-insensitive

**Usage:**
- Track individual packages
- Identify specific units
- Quality control reference
- Warranty tracking

---

### 5. QUANTITY (Pack Size)

**Description:** Package size or quantity

**Format:**
- Number + unit
- Common units: kg, g, L, mL, pcs
- No spaces between number and unit (recommended)

**Standard Formats:**
```
25kg     - Weight in kilograms
1kg      - Single kilogram
500g     - Weight in grams
5L       - Volume in liters
10pcs    - Piece count
```

**Examples:**
- `25kg`
- `1kg`
- `5kg`
- `10kg`
- `500g`
- `5L`
- `1L`

**Validation Rules:**
- Required field
- Length: 2-10 characters
- Case-insensitive
- Used for pack size pricing

**Pricing Impact:**
- Different pack sizes may have different prices
- Points calculation may vary by pack size
- Important for accurate reward calculation

---

## Data Validation Rules

### QR Code Level Validation

1. **Format Validation**
   ```
   - Must have exactly 5 fields
   - Fields separated by pipe (|)
   - No empty fields allowed
   - No extra pipes at start/end
   ```

2. **Character Validation**
   ```
   - Valid characters: A-Z, a-z, 0-9, hyphen, space (in name only)
   - No special characters except in product name
   - No control characters
   - UTF-8 encoding
   ```

3. **Length Validation**
   ```
   - Total QR code length: 20-200 characters
   - Each field within specified limits
   - Not too short to be valid
   - Not too long for QR encoding
   ```

### Business Logic Validation

1. **Product Validation**
   ```javascript
   - Product code must exist in database
   - Product must be active
   - Product must have valid price
   - Product category should match quantity
   ```

2. **Duplicate Detection**
   ```javascript
   - Check: batchNo + role combination
   - Same batch scanned by same role = REJECT
   - Same batch scanned by different role = ALLOW
   - Example:
     * Applicator scans B123 = OK
     * Customer scans B123 = OK
     * Applicator scans B123 again = REJECTED
   ```

3. **Member Validation**
   ```javascript
   - Member ID required
   - Member role required (applicator/customer)
   - Member name required
   - Phone number optional but recommended
   ```

### Error Conditions

**Invalid QR Format:**
```
Error: "Invalid QR code format"
Reason: Wrong number of fields or incorrect structure
Action: Check QR code generation process
```

**Product Not Found:**
```
Error: "Product not found in database"
Reason: Product code doesn't exist
Action: Add product to database first
```

**Duplicate Scan:**
```
Error: "This batch has already been scanned by [role]"
Reason: Batch already recorded for that role
Action: Verify if scan is legitimate or error
```

**Missing Required Data:**
```
Error: "Missing required field: [field name]"
Reason: Empty or missing field
Action: Regenerate QR code with complete data
```

---

## QR Code Generation

### Generating QR Codes for Products

#### Step 1: Prepare Data

```javascript
const qrData = {
  productNo: 'MK-001',
  productName: 'MEGA BOND PLUS',
  batchNo: 'B2023120501',
  bagNo: '001',
  quantity: '25kg'
};
```

#### Step 2: Format String

```javascript
const qrString = `${qrData.productNo}|${qrData.productName}|${qrData.batchNo}|${qrData.bagNo}|${qrData.quantity}`;
// Result: "MK-001|MEGA BOND PLUS|B2023120501|001|25kg"
```

#### Step 3: Generate QR Code

**Using Node.js (qrcode package):**

```javascript
const QRCode = require('qrcode');

const generateQR = async (qrString) => {
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',  // High error correction
      type: 'image/png',
      quality: 1,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
};

// Usage
const qrString = "MK-001|MEGA BOND PLUS|B2023120501|001|25kg";
const qrCode = await generateQR(qrString);
```

**Using Python (qrcode package):**

```python
import qrcode

def generate_qr(qr_string):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(qr_string)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save("product_qr.png")
    
# Usage
qr_string = "MK-001|MEGA BOND PLUS|B2023120501|001|25kg"
generate_qr(qr_string)
```

### QR Code Settings

**Recommended Settings:**
- **Error Correction:** High (H) - 30% recovery
- **Size:** 300x300 pixels minimum
- **Format:** PNG or SVG
- **Margin:** 2 modules (quiet zone)
- **Colors:** Black on white (best contrast)

**Print Specifications:**
- **Minimum Size:** 2cm x 2cm
- **Recommended Size:** 3cm x 3cm or larger
- **Resolution:** 300 DPI minimum
- **Material:** Weather-resistant if outdoor use
- **Placement:** Flat surface, visible location

---

## QR Code Scanning

### Scanning Process

1. **User Action**
   - Open Megakem Loyalty App
   - Select role (Applicator/Customer)
   - Enter Member ID and Name
   - Click "Scan QR Code"

2. **Camera Access**
   - App requests camera permission
   - User allows camera access
   - Camera view opens

3. **QR Detection**
   - Point camera at QR code
   - App automatically detects QR code
   - Decodes QR data

4. **Data Parsing**
   ```javascript
   // Split QR string into fields
   const fields = qrString.split('|');
   
   const scanData = {
     productNo: fields[0],      // MK-001
     productName: fields[1],    // MEGA BOND PLUS
     batchNo: fields[2],        // B2023120501
     bagNo: fields[3],          // 001
     qty: fields[4]             // 25kg
   };
   ```

5. **Validation**
   - Verify 5 fields present
   - Check product exists
   - Validate batch format
   - Check for duplicates

6. **Product Lookup**
   ```javascript
   // Find product in database
   const product = await Product.findOne({ 
     productNo: scanData.productNo.toUpperCase() 
   });
   
   // Get price for pack size
   const price = product.price || 0;
   ```

7. **Add to Cart**
   - Display product information
   - Show price and points
   - Add to cart for submission
   - Allow multiple scans before submit

8. **Submission**
   - User clicks "Submit Scans"
   - All cart items sent to server
   - Points calculated and awarded
   - Member record updated

### Scanner Implementation

**Frontend (React):**

```javascript
import { Html5QrcodeScanner } from "html5-qrcode";

const startScanner = () => {
  const scanner = new Html5QrcodeScanner(
    "qr-reader",
    { 
      fps: 10,
      qrbox: 250,
      aspectRatio: 1.0
    }
  );
  
  scanner.render(onScanSuccess, onScanError);
};

const onScanSuccess = (decodedText) => {
  // Parse QR code
  const fields = decodedText.split('|');
  
  if (fields.length !== 5) {
    alert('Invalid QR code format');
    return;
  }
  
  const scanData = {
    productNo: fields[0],
    productName: fields[1],
    batchNo: fields[2],
    bagNo: fields[3],
    qty: fields[4]
  };
  
  // Add to cart
  addToCart(scanData);
};
```

---

## Error Handling

### Common Scanning Errors

#### 1. Invalid Format

**Error:**
```
"Invalid QR code format. Expected 5 fields separated by |"
```

**Causes:**
- QR code damaged or unreadable
- Wrong QR code scanned (not Megakem)
- QR code generated incorrectly

**Resolution:**
- Re-scan QR code
- Check QR code quality
- Generate new QR code if damaged

#### 2. Product Not Found

**Error:**
```
"Product [code] not found in database"
```

**Causes:**
- Product not added to system
- Product code mismatch
- Product deactivated

**Resolution:**
- Add product to database
- Verify product code spelling
- Check product status

#### 3. Duplicate Scan

**Error:**
```
"This batch number (B123) has already been scanned by a [role]"
```

**Causes:**
- Batch already scanned by same role
- Legitimate re-scan attempt
- User error

**Resolution:**
- Verify batch number
- Check if different role can scan
- Contact admin if error

#### 4. Camera Access Denied

**Error:**
```
"Camera permission denied"
```

**Resolution:**
- Enable camera in browser settings
- Allow camera access for app
- Check device camera functionality

---

## Examples

### Example 1: Standard Product

**Product:** MEGA BOND PLUS 25kg
**QR Code Data:**
```
MK-001|MEGA BOND PLUS|B2023120501|001|25kg
```

**Breakdown:**
- Product Code: MK-001
- Product Name: MEGA BOND PLUS
- Batch: B2023120501 (Dec 5, 2023, Batch 01)
- Bag: 001
- Pack Size: 25kg

**When Scanned:**
- Creates scan record
- Awards points based on 25kg price
- Links to member account
- Updates analytics

---

### Example 2: Small Pack Size

**Product:** TILE BOND 100 - 1kg pack
**QR Code Data:**
```
TB-100|TILE BOND 100|B2023120801|0156|1kg
```

**Breakdown:**
- Product Code: TB-100
- Product Name: TILE BOND 100
- Batch: B2023120801 (Dec 8, 2023, Batch 01)
- Bag: 0156
- Pack Size: 1kg

**When Scanned:**
- Awards points based on 1kg price
- Different price than 25kg pack
- Points may vary by pack size

---

### Example 3: Liquid Product

**Product:** AQUA GUARD PRO 5 Liters
**QR Code Data:**
```
AG-PRO|AQUA GUARD PRO|AG20231210001|A001|5L
```

**Breakdown:**
- Product Code: AG-PRO
- Product Name: AQUA GUARD PRO
- Batch: AG20231210001
- Bag: A001
- Quantity: 5L (liters)

---

### Example 4: Multiple Pack Sizes

**Same Product, Different Sizes:**

**25kg Pack:**
```
MK-001|MEGA BOND PLUS|B2023120501|001|25kg
```

**10kg Pack:**
```
MK-001|MEGA BOND PLUS|B2023120501|101|10kg
```

**5kg Pack:**
```
MK-001|MEGA BOND PLUS|B2023120501|201|5kg
```

**Note:** Same product code and batch, but:
- Different bag numbers (001, 101, 201)
- Different pack sizes
- Different prices
- Different points awarded

---

## Best Practices

### For QR Code Generation

1. **Use Consistent Format**
   - Always use pipe delimiter
   - Maintain field order
   - Use standard units (kg, L, etc.)

2. **Quality Control**
   - Test scan before printing
   - Verify all fields are correct
   - Check product exists in database
   - Use high error correction

3. **Batch Numbering**
   - Use consistent format
   - Include date information
   - Make unique and traceable
   - Document batch system

4. **Print Quality**
   - High resolution (300+ DPI)
   - Weather-resistant material
   - Clear contrast (black on white)
   - Adequate size (3cm minimum)

### For QR Code Scanning

1. **User Training**
   - Train on proper scanning technique
   - Explain duplicate prevention
   - Show how to verify scans
   - Provide troubleshooting guide

2. **Environmental Factors**
   - Good lighting required
   - Hold device steady
   - Optimal distance: 10-20cm
   - Avoid glare and shadows

3. **Data Verification**
   - Display scanned data for confirmation
   - Allow user to cancel if wrong
   - Show cart contents before submit
   - Provide scan history

4. **Error Recovery**
   - Clear error messages
   - Suggest solutions
   - Allow re-scan
   - Provide manual entry option (admin only)

---

## Technical Specifications

### QR Code Standards

- **Standard:** ISO/IEC 18004:2015
- **Type:** QR Code (Quick Response Code)
- **Version:** Auto (typically 1-3 for our data)
- **Encoding:** UTF-8
- **Error Correction:** Level H (30%)

### Data Capacity

- **Maximum Data:** ~200 characters
- **Typical Data:** 40-80 characters
- **Minimum Data:** 20 characters
- **Optimal Range:** 50-100 characters

### Scanner Requirements

- **Camera:** 2MP minimum (5MP+ recommended)
- **Focus:** Auto-focus preferred
- **Frame Rate:** 10 FPS minimum
- **Browser:** Modern browser with camera API support

---

## Appendix

### Field Reference Table

| Field        | Required | Format        | Max Length | Example            |
|--------------|----------|---------------|------------|--------------------|
| PRODUCT_NO   | Yes      | Alphanumeric  | 20         | MK-001             |
| PRODUCT_NAME | Yes      | Text          | 100        | MEGA BOND PLUS     |
| BATCH_NO     | Yes      | Alphanumeric  | 30         | B2023120501        |
| BAG_NO       | Yes      | Alphanumeric  | 20         | 001                |
| QUANTITY     | Yes      | Number + Unit | 10         | 25kg               |

### Sample QR Codes

**Product 1:**
```
MK-001|MEGA BOND PLUS|B2023120501|001|25kg
```

**Product 2:**
```
TB-100|TILE BOND 100|TB20231208|A156|10kg
```

**Product 3:**
```
AG-PRO|AQUA GUARD PRO|AG2023-12-10|P001|5L
```

---

**Last Updated:** December 22, 2025  
**Version:** 1.0  
**Author:** Megakem Technical Team





