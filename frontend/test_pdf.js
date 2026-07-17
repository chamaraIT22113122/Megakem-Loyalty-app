const { jsPDF } = require("jspdf");
require("jspdf-autotable");

const doc = new jsPDF('landscape');
doc.setFontSize(18);
doc.text("Test", 14, 22);

const tableColumn = ["Photo", "Name", "ID", "Phone", "WhatsApp", "NIC", "Hardware", "City", "Zone", "Notes"];
const tableRows = [
  ['', 'Test', '123', '0123', '0123', '456', 'Hard', 'Col', 'Zone 1', '']
];

doc.autoTable({
  head: [tableColumn],
  body: tableRows,
  startY: 35
});

console.log("PDF generation test passed!");
