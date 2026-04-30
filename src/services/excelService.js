import * as XLSX from 'xlsx';

export const ExcelService = {
  exportData: (data, fileName, sheetName = 'Məlumat') => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-size columns (rough implementation as SheetJS doesn't support it native in community version well)
      const maxWidths = {};
      data.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = row[key] ? row[key].toString() : '';
          const keyLen = key.length;
          const valLen = val.length;
          maxWidths[key] = Math.max(maxWidths[key] || 0, keyLen, valLen);
        });
      });

      const cols = Object.keys(maxWidths).map(key => ({
        wch: maxWidths[key] + 2
      }));
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      return false;
    }
  }
};
