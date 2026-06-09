const mongoose = require('mongoose');

const printLayoutConfigSchema = new mongoose.Schema({
  printerModel: { type: String, default: 'Zebra ZD320' },
  printSize: { type: String, default: 'medium' },
  layout: { type: String, default: 'standard' },
  dpi: { type: Number, default: 203 },
  printLayoutMode: { type: String, default: 'grid' },
  printPaperSize: { type: String, default: 'a4' },
  customPaperWidth: { type: Number, default: 210 },
  customPaperHeight: { type: Number, default: 297 },
  printMarginTop: { type: Number, default: 10 },
  printMarginBottom: { type: Number, default: 10 },
  printMarginLeft: { type: Number, default: 10 },
  printMarginRight: { type: Number, default: 10 },
  printQRSize: { type: Number, default: 25 },
  printColumns: { type: Number, default: 3 },
  printRows: { type: Number, default: 7 },
  printGap: { type: Number, default: 4 },
  printLabelPadding: { type: Number, default: 2 }
}, {
  timestamps: true
});

printLayoutConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('PrintLayoutConfig', printLayoutConfigSchema);
