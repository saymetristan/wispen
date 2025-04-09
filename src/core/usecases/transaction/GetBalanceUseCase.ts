import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { RepositoryFactory } from '@core/domain/factories/RepositoryFactory';
import { TransactionType } from '../../domain/Transaction';
import { logger } from '@utils/logger';
import { ToolResponse } from '@infrastructure/services/openai/tools/AssistantTools';
import { endOfDay, startOfMonth } from 'date-fns';

interface GetBalanceRequest {
  userId: string;
  startDate?: string; // ISO format (YYYY-MM-DD)
  endDate?: string; // ISO format (YYYY-MM-DD)
}

/**
 * Caso de uso para consultar el saldo de un usuario
 */
export class GetBalanceUseCase {
  private transactionRepository: TransactionRepository;

  constructor(repositoryFactory: RepositoryFactory) {
    this.transactionRepository = repositoryFactory.createTransactionRepository();
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(request: GetBalanceRequest): Promise<ToolResponse> {
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
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      // Si no se proporcionan fechas, usamos el mes actual por defecto
      if (!request.startDate && !request.endDate) {
        startDate = startOfMonth(new Date());
        endDate = endOfDay(new Date());
      } else {
        try {
          if (request.startDate) {
            startDate = new Date(request.startDate);
          }
          
          if (request.endDate) {
            // Establecer la hora de fin de día para incluir todas las transacciones del día
            const parsedEndDate = new Date(request.endDate);
            endDate = endOfDay(parsedEndDate);
          }
        } catch (error) {
          return {
            success: false,
            message: 'Formato de fecha inválido',
            error: 'INVALID_DATE_FORMAT'
          };
        }
      }

      // Obtener totales de ingresos y gastos
      let totalIncome: number;
      let totalExpense: number;

      if (startDate && endDate) {
        // Con filtro de fechas
        totalIncome = await this.transactionRepository.getTotalByUserIdAndType(
          request.userId, 
          TransactionType.INCOME,
          startDate,
          endDate
        );

        totalExpense = await this.transactionRepository.getTotalByUserIdAndType(
          request.userId, 
          TransactionType.EXPENSE,
          startDate,
          endDate
        );
      } else {
        // Sin filtro de fechas (todas las transacciones)
        totalIncome = await this.transactionRepository.getTotalByUserIdAndType(
          request.userId, 
          TransactionType.INCOME
        );

        totalExpense = await this.transactionRepository.getTotalByUserIdAndType(
          request.userId, 
          TransactionType.EXPENSE
        );
      }

      // Calcular saldo
      const balance = totalIncome + totalExpense; // El gasto ya viene como negativo

      // Crear descripción del período
      let periodDescription = 'total';
      if (startDate && endDate) {
        periodDescription = `desde ${startDate.toISOString().split('T')[0]} hasta ${endDate.toISOString().split('T')[0]}`;
      }

      // Retornar respuesta
      return {
        success: true,
        message: `Consulta de saldo exitosa`,
        data: {
          balance,
          income: totalIncome,
          expense: totalExpense,
          period: periodDescription,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        }
      };

    } catch (error) {
      logger.error('Error al consultar saldo', {
        error: (error as Error).message,
        userId: request.userId,
        startDate: request.startDate,
        endDate: request.endDate
      });

      return {
        success: false,
        message: 'Error al consultar el saldo',
        error: (error as Error).message
      };
    }
  }
} 