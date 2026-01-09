// Test script to verify cash reward calculation

function calculateCashReward(totalPurchaseValue) {
  const tiers = [
    { min: 0, max: 250000, rate: 0.045 },         // 4.50%
    { min: 250000, max: 500000, rate: 0.05 },     // 5.00%
    { min: 500000, max: 750000, rate: 0.055 },    // 5.50%
    { min: 750000, max: 1000000, rate: 0.06 },    // 6.00%
    { min: 1000000, max: Infinity, rate: 0.065 }  // 6.50%
  ];

  let remaining = totalPurchaseValue;
  let totalReward = 0;
  const breakdown = [];

  for (const tier of tiers) {
    if (remaining <= 0) break;

    // Calculate how much of the purchase falls into this tier
    let tierAmount;
    
    if (tier.max === Infinity) {
      tierAmount = remaining;
    } else {
      const tierCapacity = tier.max - tier.min;
      tierAmount = Math.min(remaining, tierCapacity);
    }
    
    if (tierAmount > 0) {
      const reward = tierAmount * tier.rate;
      totalReward += reward;
      breakdown.push({
        tier: `Rs. ${tier.min.toLocaleString()} - ${tier.max === Infinity ? 'Above' : 'Rs. ' + tier.max.toLocaleString()}`,
        amount: `Rs. ${tierAmount.toLocaleString()}`,
        rate: `${(tier.rate * 100).toFixed(2)}%`,
        reward: `Rs. ${Math.round(reward * 100) / 100}`
      });
      remaining -= tierAmount;
    }
  }

  return {
    totalPurchaseValue: `Rs. ${totalPurchaseValue.toLocaleString()}`,
    totalReward: `Rs. ${Math.round(totalReward * 100) / 100}`,
    breakdown
  };
}

// Test with Rs. 600,000 (example from document)
console.log('\n🧪 Testing Cash Reward Calculation\n');
console.log('═'.repeat(80));

const testAmount = 600000;
const result = calculateCashReward(testAmount);

console.log(`\nPurchase Value: ${result.totalPurchaseValue}`);
console.log('\nBreakdown:');
result.breakdown.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.tier}`);
  console.log(`     Amount: ${item.amount} at ${item.rate} = ${item.reward}`);
});
console.log(`\n✅ Total Cash Reward: ${result.totalReward}`);
console.log('\n' + '═'.repeat(80));

// Expected result for Rs. 600,000:
// First Rs. 250,000 at 4.50% = Rs. 11,250
// Next Rs. 250,000 at 5.00% = Rs. 12,500
// Balance Rs. 100,000 at 5.50% = Rs. 5,500
// Total = Rs. 29,250

console.log('\n📋 Expected Result:');
console.log('  First Rs. 250,000 at 4.50% = Rs. 11,250');
console.log('  Next Rs. 250,000 at 5.00% = Rs. 12,500');
console.log('  Balance Rs. 100,000 at 5.50% = Rs. 5,500');
console.log('  Total = Rs. 29,250\n');

// Additional test cases
console.log('🧪 Additional Test Cases:\n');

const testCases = [
  100000,    // Within first tier
  300000,    // Spans two tiers
  600000,    // Your example
  1200000    // Spans multiple tiers including 6.5%
];

testCases.forEach(amount => {
  const result = calculateCashReward(amount);
  console.log(`Purchase: ${result.totalPurchaseValue} → Reward: ${result.totalReward}`);
});

console.log('\n');





