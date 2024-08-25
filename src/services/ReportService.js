import { Op } from 'sequelize';
import xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { sendCSVToWhatsApp } from '../routes/whatsappRoutes.js';
import UserService from './UserService.js';
import Transaction from '../models/Transaction.js';

class ReportService {
  async generarReporte(userId, { startDate, endDate, descargar }) {
    const user = await UserService.findUserById(userId);

    const transactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });

    const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const gastos = transactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + t.amount, 0);

    const reporte = {
      periodo: {
        inicio: startDate,
        fin: endDate
      },
      resumen: {
        ingresos,
        gastos,
        balance: ingresos - gastos
      },
      transacciones: transactions.map(t => ({
        id: t.id,
        tipo: t.type,
        monto: t.amount,
        categoria: t.category,
        subcategoria: t.subcategory,
        descripcion: t.description,
        fecha: t.createdAt
      }))
    };

    if (descargar) {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(reporte.transacciones);
      xlsx.utils.book_append_sheet(wb, ws, 'Transacciones');
      const filePath = `/tmp/reporte_${uuidv4()}.xlsx`;
      xlsx.writeFile(wb, filePath);

      await sendCSVToWhatsApp(`whatsapp:${user.phoneNumber}`, filePath);

      return { success: true };
    }

    return reporte;
  }
}

export default new ReportService();