import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { RepositoryFactory } from '@core/domain/factories/RepositoryFactory';
import { TransactionType } from '../../domain/Transaction';
import { logger } from '@utils/logger';
import { ToolResponse } from '@infrastructure/services/openai/tools/AssistantTools';
import { endOfDay, endOfMonth, startOfMonth } from 'date-fns';

interface GenerateReportRequest {
  userId: string;
  reportType: 'expenses' | 'income' | 'balance';
  startDate?: string; // ISO format (YYYY-MM-DD)
  endDate?: string; // ISO format (YYYY-MM-DD)
  groupBy?: 'category' | 'day' | 'week' | 'month';
  download?: boolean;
}

/**
 * Caso de uso para generar reportes de transacciones
 */
export class GenerateReportUseCase {
  private transactionRepository: TransactionRepository;

  constructor(repositoryFactory: RepositoryFactory) {
    this.transactionRepository = repositoryFactory.createTransactionRepository();
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(request: GenerateReportRequest): Promise<ToolResponse> {
    try {
      // Validar datos de entrada
      if (!request.userId) {
        return {
          success: false,
          message: 'El ID del usuario es requerido',
          error: 'USER_ID_REQUIRED'
        };
      }

      // Parsear fechas (si vienen)
      let startDate: Date;
      let endDate: Date;

      // Si no se proporcionan fechas, usamos el mes actual por defecto
      if (!request.startDate && !request.endDate) {
        startDate = startOfMonth(new Date());
        endDate = endOfDay(new Date());
      } else {
        try {
          startDate = request.startDate ? new Date(request.startDate) : startOfMonth(new Date());
          
          // Establecer la hora de fin de día para incluir todas las transacciones del día
          const parsedEndDate = request.endDate ? new Date(request.endDate) : new Date();
          endDate = endOfDay(parsedEndDate);
        } catch (error) {
          return {
            success: false,
            message: 'Formato de fecha inválido',
            error: 'INVALID_DATE_FORMAT'
          };
        }
      }

      // Obtener transacciones según el tipo de reporte
      let transactions = [];
      
      if (request.reportType === 'expenses') {
        // Solo gastos
        transactions = await this.transactionRepository.findByUserIdAndType(
          request.userId,
          TransactionType.EXPENSE
        );
        
        // Filtrar por fecha
        transactions = transactions.filter(tx => 
          tx.date >= startDate && tx.date <= endDate
        );
      } else if (request.reportType === 'income') {
        // Solo ingresos
        transactions = await this.transactionRepository.findByUserIdAndType(
          request.userId,
          TransactionType.INCOME
        );
        
        // Filtrar por fecha
        transactions = transactions.filter(tx => 
          tx.date >= startDate && tx.date <= endDate
        );
      } else {
        // Balance (ingresos y gastos)
        transactions = await this.transactionRepository.findByUserIdAndPeriod(
          request.userId,
          startDate,
          endDate
        );
      }

      // Crear descripción del período
      const periodDescription = `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`;

      // Agrupar datos según lo solicitado
      let groupedData: any = {};
      const groupBy = request.groupBy || 'category';

      if (groupBy === 'category') {
        // Agrupar por categoría
        for (const tx of transactions) {
          const category = tx.category || 'sin categoría';
          if (!groupedData[category]) {
            groupedData[category] = {
              total: 0,
              count: 0,
              transactions: []
            };
          }
          
          groupedData[category].total += tx.amount;
          groupedData[category].count += 1;
          groupedData[category].transactions.push(tx.toJSON());
        }
      } else {
        // Para otros tipos de agrupación (día, semana, mes)
        // Por ahora simplemente hacemos agrupación básica por fecha
        for (const tx of transactions) {
          const dateKey = tx.date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (!groupedData[dateKey]) {
            groupedData[dateKey] = {
              total: 0,
              count: 0,
              transactions: []
            };
          }
          
          groupedData[dateKey].total += tx.amount;
          groupedData[dateKey].count += 1;
          groupedData[dateKey].transactions.push(tx.toJSON());
        }
      }

      // Calcular totales
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalCount = transactions.length;

      // Preparar respuesta
      let reportData = {
        type: request.reportType,
        period: periodDescription,
        totalAmount,
        totalCount,
        groupBy,
        groupedData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      // En caso de que se pida descargar el reporte, aquí se implementaría
      // la lógica para generar un archivo y guardarlo
      if (request.download) {
        // TODO: Implementar la generación del archivo (Excel, PDF, etc.)
        logger.info('Se solicitó descargar el reporte, pero la funcionalidad aún no está implementada');
      }

      // Retornar respuesta
      return {
        success: true,
        message: `Reporte de ${request.reportType} generado correctamente`,
        data: reportData
      };

    } catch (error) {
      logger.error('Error al generar reporte', {
        error: (error as Error).message,
        userId: request.userId,
        reportType: request.reportType,
        startDate: request.startDate,
        endDate: request.endDate
      });

      return {
        success: false,
        message: 'Error al generar el reporte',
        error: (error as Error).message
      };
    }
  }
} 