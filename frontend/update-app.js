const fs = require('fs');
const file = 'c:/Users/Chamara/OneDrive/Documents/GitHub/sat/Megakem-Loyalty-app/frontend/src/App.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startStr = "{(adminTab === 'applicator-program' && applicatorProgramSubTab === 'members') && (() => {";
const startIdx = lines.findIndex(l => l.includes(startStr));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes("})()}"));

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1);
    console.log(`Removed lines from ${startIdx} to ${endIdx}`);
} else {
    console.log("Could not find block to remove.");
}

const importStr = "import ApplicatorProgramDashboard from './components/ApplicatorProgramDashboard';";
const importIdx = lines.findIndex(l => l.includes(importStr));

if (importIdx !== -1) {
    lines.splice(importIdx + 1, 0, "import MembersAndLoyaltyTab from './components/MembersAndLoyaltyTab';");
    console.log(`Added import at line ${importIdx + 1}`);
} else {
    console.log("Could not find import.");
}

const tabStr = "{/* Cash Rewards Management Tab */}";
const tabIdx = lines.findIndex(l => l.includes(tabStr));

if (tabIdx !== -1) {
    const newComponent = [
        "          {(adminTab === 'applicator-program' && applicatorProgramSubTab === 'members') && (",
        "            <MembersAndLoyaltyTab",
        "              members={members}",
        "              scanHistory={scanHistory}",
        "              memberSearchQuery={memberSearchQuery}",
        "              setMemberSearchQuery={setMemberSearchQuery}",
        "              memberRoleFilter={memberRoleFilter}",
        "              setMemberRoleFilter={setMemberRoleFilter}",
        "              memberTierFilter={memberTierFilter}",
        "              setMemberTierFilter={setMemberTierFilter}",
        "              memberSortKey={memberSortKey}",
        "              setMemberSortKey={setMemberSortKey}",
        "              setLoyaltyConfigTab={setLoyaltyConfigTab}",
        "              setLoyaltyConfigDialog={setLoyaltyConfigDialog}",
        "              isMainAdmin={isMainAdmin}",
        "              handleFixRoles={handleFixRoles}",
        "              loading={loading}",
        "              exportToExcel={exportToExcel}",
        "              getTierDisplayName={getTierDisplayName}",
        "              setMemberId={setMemberId}",
        "              setView={setView}",
        "            />",
        "          )}",
        ""
    ];
    lines.splice(tabIdx, 0, ...newComponent);
    console.log(`Added component at line ${tabIdx}`);
} else {
    console.log("Could not find component injection point.");
}

fs.writeFileSync(file, lines.join('\n'));
console.log("Done updating App.js");
