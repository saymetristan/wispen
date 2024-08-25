class CSVService {
    convertToCSV(transacciones) {
      const header = ['ID', 'Tipo', 'Monto', 'Categoría', 'Subcategoría', 'Descripción', 'Fecha'];
      const rows = transacciones.map(t => [t.id, t.tipo, t.monto, t.categoria, t.subcategoria, t.descripcion, t.fecha]);
      const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
      return csvContent;
    }
  }
  
  export default new CSVService();