# Cash Rewards Calculation Guide - Megakem Loyalty App

## Table of Contents
1. [Overview](#overview)
2. [Eligibility](#eligibility)
3. [Calculation Method](#calculation-method)
4. [Tiered Reward Structure](#tiered-reward-structure)
5. [Step-by-Step Examples](#step-by-step-examples)
6. [Monthly Process](#monthly-process)
7. [Payment Workflow](#payment-workflow)
8. [Technical Implementation](#technical-implementation)
9. [FAQ](#faq)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Megakem Cash Rewards Program provides monthly financial incentives to applicators based on their product purchases. The program uses a tiered percentage system where higher purchase volumes earn higher reward rates.

### Key Features

- **Monthly Calculation:** Rewards calculated at month-end
- **Tiered Rates:** Progressive percentages based on purchase value
- **Automatic Tracking:** System tracks all purchases via scans
- **Transparent Process:** Clear breakdown of calculations
- **Secure Payment:** Verified and documented payments

### Program Goals

- Incentivize higher purchase volumes
- Reward loyal applicators
- Encourage product promotion
- Build long-term partnerships
- Increase market presence

---

## Eligibility

### Who Qualifies for Cash Rewards?

**✅ ELIGIBLE:**
- **Applicators Only** - Professional contractors who apply Megakem products
- Must have valid Member ID
- Must have completed product scans in the month
- Account must be in good standing

**❌ NOT ELIGIBLE:**
- Regular customers
- Retail buyers
- One-time purchasers
- Inactive accounts
- Suspended accounts

### Verification Requirements

To receive cash rewards, applicators must:

1. **Be Registered as Applicator**
   - Role set to "applicator" in system
   - Member ID assigned
   - Contact information verified

2. **Complete Product Scans**
   - Scan QR codes on purchased products
   - Submit scans through app
   - Scans must include valid product prices

3. **Minimum Purchase Threshold**
   - No minimum for reward calculation
   - Even small purchases accumulate
   - Rewards calculated on total monthly value

4. **Account Status**
   - Active account required
   - No outstanding disputes
   - Compliance with terms

---

## Calculation Method

### Core Principle

Cash rewards are calculated using a **tiered progressive system** where different portions of the total purchase value are taxed at different rates.

### Formula

```
Total Reward = Σ (Amount in Tier × Tier Rate)
```

### How It Works

1. **Sum Monthly Purchases**
   - All scanned products for the month
   - Based on product prices at scan time
   - Includes all pack sizes

2. **Apply Tiered Rates**
   - Break total into tiers
   - Apply appropriate rate to each tier
   - Sum all tier rewards

3. **Round Result**
   - Final amount rounded to 2 decimal places
   - Standard currency rounding rules

### Important Notes

- ⚠️ **Only APPLICATORS receive cash rewards**
- ⚠️ **Customers receive loyalty points, NOT cash**
- ⚠️ **Scans must have valid price data**
- ⚠️ **Duplicate scans are excluded**

---

## Tiered Reward Structure

### Reward Tiers

| Tier | Purchase Value Range (Rs.)     | Reward Rate | On Amount         |
|------|--------------------------------|-------------|-------------------|
| 1    | 0 - 250,000                    | 4.50%       | First 250,000     |
| 2    | 250,001 - 500,000              | 5.00%       | Next 250,000      |
| 3    | 500,001 - 750,000              | 5.50%       | Next 250,000      |
| 4    | 750,001 - 1,000,000            | 6.00%       | Next 250,000      |
| 5    | Above 1,000,000                | 6.50%       | Remaining amount  |

### How Tiers Work

**Progressive System:**
- NOT "all or nothing"
- EACH tier is applied separately
- Higher purchases benefit from ALL lower tiers too

**Example:**
- If you purchase Rs. 600,000:
  - First 250,000 → 4.5%
  - Next 250,000 → 5.0%
  - Last 100,000 → 5.5%

### Tier Benefits Visualization

```
Rs. 0                    Rs. 250K              Rs. 500K              Rs. 750K              Rs. 1M
|------------------------|---------------------|---------------------|---------------------|---------->
      4.5% Rate                 5.0% Rate             5.5% Rate             6.0% Rate        6.5% Rate
```

### Rate Comparison Table

| Total Purchase (Rs.) | Average Rate | Total Reward (Rs.) |
|----------------------|--------------|---------------------|
| 100,000              | 4.50%        | 4,500               |
| 250,000              | 4.50%        | 11,250              |
| 500,000              | 4.75%        | 23,750              |
| 750,000              | 5.00%        | 37,500              |
| 1,000,000            | 5.25%        | 52,500              |
| 1,500,000            | 5.58%        | 83,750              |
| 2,000,000            | 5.81%        | 116,250             |

---

## Step-by-Step Examples

### Example 1: Small Purchase (Below First Tier)

**Scenario:**
- Applicator: Ahmed Khan (Member ID: APL-001)
- Month: December 2023
- Total Purchases: Rs. 100,000

**Calculation:**

```
Total Purchase: Rs. 100,000

Tier 1: Rs. 100,000 × 4.5% = Rs. 4,500

Total Reward: Rs. 4,500
Average Rate: 4.5%
```

**Breakdown:**
- All purchase amount falls in Tier 1
- Simple multiplication: 100,000 × 0.045
- Single tier applies

---

### Example 2: Mid-Range Purchase (Two Tiers)

**Scenario:**
- Applicator: Sarah Ahmed (Member ID: APL-015)
- Month: November 2023
- Total Purchases: Rs. 400,000

**Calculation:**

```
Total Purchase: Rs. 400,000

Tier 1: First 250,000
  Rs. 250,000 × 4.5% = Rs. 11,250

Tier 2: Remaining 150,000
  Rs. 150,000 × 5.0% = Rs. 7,500

Total Reward: Rs. 11,250 + Rs. 7,500 = Rs. 18,750
Average Rate: 4.69%
```

**Breakdown:**
- First Rs. 250,000 at lower rate (4.5%)
- Remaining Rs. 150,000 at higher rate (5.0%)
- Combined total: Rs. 18,750

---

### Example 3: Large Purchase (Multiple Tiers)

**Scenario:**
- Applicator: Ravi Kumar (Member ID: APL-042)
- Month: October 2023
- Total Purchases: Rs. 850,000

**Calculation:**

```
Total Purchase: Rs. 850,000

Tier 1: First 250,000
  Rs. 250,000 × 4.5% = Rs. 11,250

Tier 2: Next 250,000 (250,001 to 500,000)
  Rs. 250,000 × 5.0% = Rs. 12,500

Tier 3: Next 250,000 (500,001 to 750,000)
  Rs. 250,000 × 5.5% = Rs. 13,750

Tier 4: Remaining 100,000 (750,001 to 850,000)
  Rs. 100,000 × 6.0% = Rs. 6,000

Total Reward: Rs. 11,250 + Rs. 12,500 + Rs. 13,750 + Rs. 6,000
            = Rs. 43,500

Average Rate: 5.12%
```

**Detailed Breakdown:**

| Tier | Range (Rs.)           | Amount (Rs.) | Rate  | Reward (Rs.) |
|------|-----------------------|--------------|-------|--------------|
| 1    | 0 - 250,000           | 250,000      | 4.5%  | 11,250       |
| 2    | 250,001 - 500,000     | 250,000      | 5.0%  | 12,500       |
| 3    | 500,001 - 750,000     | 250,000      | 5.5%  | 13,750       |
| 4    | 750,001 - 1,000,000   | 100,000      | 6.0%  | 6,000        |
| **TOTAL** |                   | **850,000**  |       | **43,500**   |

---

### Example 4: Very Large Purchase (All Tiers)

**Scenario:**
- Applicator: Zara Malik (Member ID: APL-088)
- Month: September 2023
- Total Purchases: Rs. 1,750,000

**Calculation:**

```
Total Purchase: Rs. 1,750,000

Tier 1: First 250,000
  Rs. 250,000 × 4.5% = Rs. 11,250

Tier 2: Next 250,000
  Rs. 250,000 × 5.0% = Rs. 12,500

Tier 3: Next 250,000
  Rs. 250,000 × 5.5% = Rs. 13,750

Tier 4: Next 250,000
  Rs. 250,000 × 6.0% = Rs. 15,000

Tier 5: Remaining 750,000
  Rs. 750,000 × 6.5% = Rs. 48,750

Total Reward: Rs. 11,250 + Rs. 12,500 + Rs. 13,750 + Rs. 15,000 + Rs. 48,750
            = Rs. 101,250

Average Rate: 5.79%
```

**Visual Breakdown:**

```
Purchase Amount: Rs. 1,750,000
├─ Tier 1 (0-250K):        Rs. 250,000 @ 4.5% = Rs. 11,250
├─ Tier 2 (250K-500K):     Rs. 250,000 @ 5.0% = Rs. 12,500
├─ Tier 3 (500K-750K):     Rs. 250,000 @ 5.5% = Rs. 13,750
├─ Tier 4 (750K-1M):       Rs. 250,000 @ 6.0% = Rs. 15,000
└─ Tier 5 (Above 1M):      Rs. 750,000 @ 6.5% = Rs. 48,750
                                    TOTAL REWARD: Rs. 101,250
```

---

### Example 5: Edge Case (Exact Tier Boundary)

**Scenario:**
- Applicator: Ali Hassan (Member ID: APL-021)
- Month: December 2023
- Total Purchases: Rs. 500,000 (exactly at tier boundary)

**Calculation:**

```
Total Purchase: Rs. 500,000

Tier 1: First 250,000
  Rs. 250,000 × 4.5% = Rs. 11,250

Tier 2: Next 250,000 (completes Tier 2)
  Rs. 250,000 × 5.0% = Rs. 12,500

Total Reward: Rs. 11,250 + Rs. 12,500 = Rs. 23,750
Average Rate: 4.75%
```

**Note:** When purchase exactly equals tier boundary, full tier rate applies.

---

## Monthly Process

### Timeline

**Day 1-31: Purchase Period**
- Applicators make purchases
- Scan QR codes on products
- System tracks all scans
- Prices recorded automatically

**Day 1-5 of Next Month: Calculation**
- Admin calculates rewards
- System generates reports
- Data verification performed
- Discrepancies resolved

**Day 5-10: Review & Approval**
- Management reviews calculations
- Verifies data accuracy
- Approves payments
- Generates payment list

**Day 10-15: Payment Processing**
- Finance processes payments
- Bank transfers initiated
- Payment confirmations sent
- Records updated in system

**Day 15-20: Confirmation**
- Applicators receive payments
- Confirm receipt
- Admin marks as "Paid"
- Archive monthly records

### Admin Workflow

#### Step 1: Calculate Monthly Rewards

1. **Log into Admin Panel**
2. **Navigate to "Cash Rewards" tab**
3. **Select Month and Year**
   ```
   Example: December 2023
   ```

4. **Click "Calculate Rewards for All Applicators"**
5. **System processes:**
   - Retrieves all applicator scans for month
   - Sums product prices
   - Applies tiered calculation
   - Generates reward amounts

6. **Review Results**
   - Check for anomalies
   - Verify top purchasers
   - Confirm calculations

#### Step 2: Export Report

1. **Click "Export Rewards Report"**
2. **Excel file includes:**
   - Applicator Member ID
   - Applicator Name
   - Total Purchase Value
   - Reward Breakdown by Tier
   - Total Reward Amount
   - Payment Status

3. **Save report for records**

#### Step 3: Prepare Payment List

1. **Filter unpaid rewards**
2. **Generate payment file**
3. **Include:**
   - Member ID
   - Name
   - Bank details (if available)
   - Amount to pay
   - Reference number

#### Step 4: Process Payments

1. **Submit to Finance**
2. **Process bank transfers**
3. **Track payment status**
4. **Handle issues**

#### Step 5: Mark as Paid

1. **After payment confirmed**
2. **In Admin Panel:**
   - Find applicator
   - Select month
   - Click "Mark as Paid"
   - Confirm action

3. **System updates:**
   - Payment date recorded
   - Status changed to "Paid"
   - Total cash rewards increased
   - Record archived

---

## Payment Workflow

### Payment Methods

**Primary Method: Bank Transfer**
- Direct deposit to applicator's account
- Secure and traceable
- Fastest processing time
- Digital record maintained

**Alternative Methods:**
- Check payment
- Cash (for small amounts)
- Mobile money transfer
- Other as agreed

### Payment Information Required

**From Applicator:**
- Bank account number
- Bank name and branch
- Account holder name (matching member name)
- SWIFT/IBAN (if applicable)
- Contact number for confirmation

### Payment Record

**System Tracks:**
```javascript
{
  memberId: "APL-042",
  memberName: "Ravi Kumar",
  year: 2023,
  month: 12,
  totalPurchaseValue: 850000,
  cashReward: 43500,
  rewardCalculated: true,
  rewardPaid: true,
  rewardPaidDate: "2024-01-15",
  paymentReference: "PAY-202401-042",
  paymentMethod: "Bank Transfer"
}
```

### Payment Verification

**Before Payment:**
- [ ] Calculation verified
- [ ] Data accuracy confirmed
- [ ] No duplicate scans
- [ ] Applicator details correct
- [ ] Bank details verified

**After Payment:**
- [ ] Payment processed
- [ ] Confirmation received
- [ ] System updated
- [ ] Record archived
- [ ] Applicator notified

---

## Technical Implementation

### Database Schema

**Member Model - Monthly Purchases:**

```javascript
monthlyPurchases: [{
  year: Number,              // e.g., 2023
  month: Number,             // 1-12
  totalPurchaseValue: Number, // Sum of all scans
  cashReward: Number,         // Calculated reward
  rewardCalculated: Boolean,  // Calculation complete
  rewardPaid: Boolean,        // Payment processed
  rewardPaidDate: Date       // When paid
}]
```

### Calculation Function

**Method: `calculateCashReward(year, month)`**

```javascript
memberSchema.methods.calculateCashReward = function(year, month) {
  const purchase = this.monthlyPurchases.find(
    p => p.year === year && p.month === month
  );

  if (!purchase || purchase.rewardCalculated) {
    return purchase ? purchase.cashReward : 0;
  }

  // Tiered calculation
  const tiers = [
    { min: 0, max: 250000, rate: 0.045 },         // 4.50%
    { min: 250000, max: 500000, rate: 0.05 },     // 5.00%
    { min: 500000, max: 750000, rate: 0.055 },    // 5.50%
    { min: 750000, max: 1000000, rate: 0.06 },    // 6.00%
    { min: 1000000, max: Infinity, rate: 0.065 }  // 6.50%
  ];

  let remaining = purchase.totalPurchaseValue;
  let totalReward = 0;

  for (const tier of tiers) {
    if (remaining <= 0) break;

    let tierAmount;
    
    if (tier.max === Infinity) {
      tierAmount = remaining;
    } else {
      const tierCapacity = tier.max - tier.min;
      tierAmount = Math.min(remaining, tierCapacity);
    }
    
    if (tierAmount > 0) {
      totalReward += tierAmount * tier.rate;
      remaining -= tierAmount;
    }
  }

  purchase.cashReward = Math.round(totalReward * 100) / 100;
  purchase.rewardCalculated = true;
  
  return purchase.cashReward;
};
```

### API Endpoints

**Get Rewards for Applicator:**
```
GET /api/cash-rewards/:memberId?year=2023&month=12
```

**Calculate Rewards:**
```
POST /api/cash-rewards/calculate/:memberId
Body: { year: 2023, month: 12 }
```

**Mark as Paid:**
```
PUT /api/cash-rewards/mark-paid/:memberId
Body: { year: 2023, month: 12 }
```

**Get All Applicators Rewards:**
```
GET /api/cash-rewards?year=2023&month=12&role=applicator
```

### Scan Integration

**Tracking Purchases:**

```javascript
// When scan is created
if (scan.role === 'applicator' && scan.price > 0) {
  const scanDate = scan.timestamp || new Date();
  const year = scanDate.getFullYear();
  const month = scanDate.getMonth() + 1;
  
  // Add to member's monthly purchase
  member.addMonthlyPurchase(scan.price, year, month);
  await member.save();
}
```

**Method: `addMonthlyPurchase(purchaseValue, year, month)`**

```javascript
memberSchema.methods.addMonthlyPurchase = function(purchaseValue, year, month) {
  const purchaseIndex = this.monthlyPurchases.findIndex(
    p => p.year === year && p.month === month
  );

  if (purchaseIndex >= 0) {
    // Update existing month
    this.monthlyPurchases[purchaseIndex].totalPurchaseValue += purchaseValue;
    this.monthlyPurchases[purchaseIndex].rewardCalculated = false;
  } else {
    // Add new month
    this.monthlyPurchases.push({
      year,
      month,
      totalPurchaseValue: purchaseValue,
      cashReward: 0,
      rewardCalculated: false,
      rewardPaid: false
    });
  }
};
```

---

## FAQ

### General Questions

**Q: Who is eligible for cash rewards?**
A: Only applicators who are registered as "applicator" role in the system. Regular customers receive loyalty points instead.

**Q: When are rewards calculated?**
A: Rewards are calculated monthly, typically in the first week of the following month.

**Q: Is there a minimum purchase requirement?**
A: No minimum purchase is required. Rewards are calculated on any purchase amount, starting from Rs. 0.

**Q: Can customers receive cash rewards?**
A: No, only applicators receive cash rewards. Customers earn loyalty points which can be redeemed for rewards.

### Calculation Questions

**Q: How are the tiers applied?**
A: Tiers are progressive. Each tier rate applies only to the portion of purchases within that tier range, not the entire amount.

**Q: What if my purchase is exactly at a tier boundary?**
A: The full tier is applied. For example, Rs. 250,000 purchases earn 4.5% on the entire amount.

**Q: Are rewards rounded?**
A: Yes, final reward amounts are rounded to two decimal places using standard rounding rules.

**Q: What price is used for calculations?**
A: The product price at the time of scan is used, as recorded in the scan data.

### Process Questions

**Q: How do I know my reward amount?**
A: Log into the app and view your member profile, or contact admin for a detailed report.

**Q: When will I receive payment?**
A: Payments are typically processed between the 10th and 15th of the month following your purchases.

**Q: What if I find an error in my calculation?**
A: Contact the admin immediately with your member ID and the month in question. All calculations will be reviewed.

**Q: Can I see a breakdown of my reward?**
A: Yes, the system provides a detailed breakdown showing how much was earned in each tier.

### Technical Questions

**Q: What if a scan doesn't have a price?**
A: Scans without prices (price = 0) are not included in cash reward calculations but are still recorded.

**Q: Are duplicate scans included?**
A: No, the system prevents duplicate scans. Each batch can only be scanned once per role.

**Q: What happens if I scan as both roles?**
A: Each role is tracked separately. Cash rewards only apply to scans recorded under "applicator" role.

**Q: How are multi-pack sizes handled?**
A: Each pack size has its own price. The price for the scanned pack size is used in the calculation.

---

## Troubleshooting

### Issue: Reward Shows Rs. 0

**Possible Causes:**
1. No scans recorded for the month
2. Scans don't have price data
3. Member role is "customer" not "applicator"
4. Calculation not yet performed

**Solutions:**
1. Verify scans exist for the month
2. Check scan records have prices
3. Confirm member role is "applicator"
4. Ask admin to calculate rewards

---

### Issue: Purchase Value Seems Wrong

**Possible Causes:**
1. Missing scans
2. Incorrect prices in product database
3. Duplicate scans included (system should prevent)
4. Date range issue

**Solutions:**
1. Review all scans for the month
2. Verify product prices are correct
3. Check for duplicates (contact admin)
4. Confirm correct month selected

---

### Issue: Payment Not Received

**Possible Causes:**
1. Payment not yet processed
2. Incorrect bank details
3. Bank processing delay
4. Not marked as paid in system

**Solutions:**
1. Check with admin on payment schedule
2. Verify bank account information
3. Allow 2-3 business days for transfer
4. Contact admin to check status

---

### Issue: Tier Calculation Unclear

**Problem:** Don't understand how tiers work

**Solution:** 
Tiers are progressive, not "all or nothing":
- Example: Rs. 600,000 purchase
- First Rs. 250,000 gets 4.5% = Rs. 11,250
- Next Rs. 250,000 gets 5.0% = Rs. 12,500
- Last Rs. 100,000 gets 5.5% = Rs. 5,500
- **Total: Rs. 29,250 (not 5.5% of Rs. 600,000)**

---

### Issue: Historical Data Missing

**Problem:** Old months show no data

**Possible Causes:**
1. Data migration incomplete
2. Scans don't have prices
3. System implemented after those months

**Solutions:**
1. Contact admin about data migration
2. Historical rewards may need manual calculation
3. Focus on current and future months

---

## Support

### Getting Help

**For Applicators:**
- Contact: support@megakem.com
- Phone: [Support Number]
- Admin Panel: Ask admin for detailed reports

**For Admins:**
- Technical Documentation: `API_DOCUMENTATION.md`
- System Guide: `ADMIN_USER_GUIDE.md`
- Developer Support: [Developer Contact]

### Reporting Issues

When reporting calculation issues, provide:
1. Member ID
2. Month and Year
3. Expected vs. Actual reward
4. List of scans (if available)
5. Screenshots if helpful

---

## Appendix

### Quick Reference Card

**Reward Rates:**
- 0-250K: 4.5%
- 250K-500K: 5.0%
- 500K-750K: 5.5%
- 750K-1M: 6.0%
- Above 1M: 6.5%

**Key Points:**
- Applicators only
- Monthly calculation
- Progressive tiers
- Based on scan prices
- Payment by mid-month

**Formula:**
```
Reward = (Tier1_Amount × 4.5%) +
         (Tier2_Amount × 5.0%) +
         (Tier3_Amount × 5.5%) +
         (Tier4_Amount × 6.0%) +
         (Tier5_Amount × 6.5%)
```

---

**Last Updated:** December 22, 2025  
**Version:** 1.0  
**Author:** Megakem Finance Team





