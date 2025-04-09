import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { RepositoryFactory } from '@core/domain/factories/RepositoryFactory';
import { Transaction, TransactionType as DomainTransactionType } from '../../domain/Transaction';
import { v4 as uuidv4 } from 'uuid';
import { TransactionCategoryService } from '../../domain/services/TransactionCategoryService';
import { logger } from '@utils/logger';
import { ToolResponse } from '@infrastructure/services/openai/tools/AssistantTools';

interface RegisterTransactionRequest {
  userId: string;
  amount: number;
  type: string; // 'expense' o 'income'
  description: string;
  category?: string;
  date?: string; // ISO format
}

/**
 * Caso de uso para registrar una nueva transacción
 */
export class RegisterTransactionUseCase {
  private transactionRepository: TransactionRepository;

  constructor(repositoryFactory: RepositoryFactory) {
    this.transactionRepository = repositoryFactory.createTransactionRepository();
  }

  /**
   * Ejecuta el caso de uso
   */
  async execute(request: RegisterTransactionRequest): Promise<ToolResponse> {
    try {
      // Validar datos de entrada
      if (!request.userId) {
        return {
          success: false,
          message: 'El ID del usuario es requerido',
          error: 'USER_ID_REQUIRED'
        };
      }

      if (request.amount === 0) {
        return {
          success: false,
          message: 'El monto no puede ser cero',
          error: 'INVALID_AMOUNT'
        };
      }

      if (!request.description || !request.description.trim()) {
        return {
          success: false,
          message: 'La descripción es requerida',
          error: 'DESCRIPTION_REQUIRED'
        };
      }

      // Determinar el tipo de transacción en el dominio
      const type = request.type === 'income' 
        ? DomainTransactionType.INCOME 
        : DomainTransactionType.EXPENSE;

      // Asignar categoría (si no viene, categorizarla automáticamente)
      const isIncome = type === DomainTransactionType.INCOME;
      const category = request.category || 
        TransactionCategoryService.categorizeTransaction(request.description, isIncome);

      // Parsear fecha (si viene) o usar la fecha actual
      let date: Date;
      try {
        date = request.date ? new Date(request.date) : new Date();
      } catch (error) {
        return {
          success: false,
          message: 'Formato de fecha inválido',
          error: 'INVALID_DATE_FORMAT'
        };
      }

      // Crear la transacción en el dominio
      const transaction = new Transaction(
        uuidv4(),
        request.userId,
        request.amount,
        request.description,
        type,
        category,
        date
      );

      // Persistir la transacción
      const savedTransaction = await this.transactionRepository.create(transaction);

      // Obtener el saldo actual (opcional, para incluir en la respuesta)
      const totalIncome = await this.transactionRepository.getTotalByUserIdAndType(
        request.userId, 
        DomainTransactionType.INCOME
      );

      const totalExpense = await this.transactionRepository.getTotalByUserIdAndType(
        request.userId, 
        DomainTransactionType.EXPENSE
      );

      const currentBalance = totalIncome + totalExpense; // El gasto ya viene como negativo

      // Retornar respuesta
      return {
        success: true,
        message: `Transacción de ${type === DomainTransactionType.INCOME ? 'ingreso' : 'gasto'} registrada exitosamente`,
        data: {
          transaction: savedTransaction.toJSON(),
          currentBalance: currentBalance
        }
      };

    } catch (error) {
      logger.error('Error al registrar transacción', {
        error: (error as Error).message,
        userId: request.userId,
        type: request.type,
        amount: request.amount
      });

      return {
        success: false,
        message: 'Error al procesar la transacción',
        error: (error as Error).message
      };
    }
  }
} 