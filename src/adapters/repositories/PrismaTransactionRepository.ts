import { Transaction, TransactionType } from '../../core/domain/Transaction';
import { TransactionRepository } from '../../core/domain/repositories/TransactionRepository';
import prisma from '../../infrastructure/database/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementación del repositorio de transacciones usando Prisma
 */
export class PrismaTransactionRepository implements TransactionRepository {
  /**
   * Busca una transacción por su ID
   */
  async findById(id: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) return null;

    return new Transaction(
      transaction.id,
      transaction.userId,
      transaction.amount,
      transaction.description,
      transaction.type as TransactionType,
      transaction.category || null,
      transaction.date,
      transaction.createdAt,
      transaction.updatedAt
    );
  }

  /**
   * Busca transacciones por ID de usuario
   */
  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions.map(
      (tx) =>
        new Transaction(
          tx.id,
          tx.userId,
          tx.amount,
          tx.description,
          tx.type as TransactionType,
          tx.category || null,
          tx.date,
          tx.createdAt,
          tx.updatedAt
        )
    );
  }

  /**
   * Crea una nueva transacción
   */
  async create(transaction: Transaction): Promise<Transaction> {
    // Si no viene con ID, generamos uno
    const id = transaction.id || uuidv4();
    
    const createdTransaction = await prisma.transaction.create({
      data: {
        id,
        userId: transaction.userId,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type as string,
        category: transaction.category,
        date: transaction.date,
      },
    });

    return new Transaction(
      createdTransaction.id,
      createdTransaction.userId,
      createdTransaction.amount,
      createdTransaction.description,
      createdTransaction.type as TransactionType,
      createdTransaction.category || null,
      createdTransaction.date,
      createdTransaction.createdAt,
      createdTransaction.updatedAt
    );
  }

  /**
   * Actualiza una transacción existente
   */
  async update(transaction: Transaction): Promise<Transaction> {
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type as string,
        category: transaction.category,
        date: transaction.date,
      },
    });

    return new Transaction(
      updatedTransaction.id,
      updatedTransaction.userId,
      updatedTransaction.amount,
      updatedTransaction.description,
      updatedTransaction.type as TransactionType,
      updatedTransaction.category || null,
      updatedTransaction.date,
      updatedTransaction.createdAt,
      updatedTransaction.updatedAt
    );
  }

  /**
   * Elimina una transacción por su ID
   */
  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({
      where: { id },
    });
  }

  /**
   * Busca transacciones por ID de usuario y periodo
   */
  async findByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(
      (tx) =>
        new Transaction(
          tx.id,
          tx.userId,
          tx.amount,
          tx.description,
          tx.type as TransactionType,
          tx.category || null,
          tx.date,
          tx.createdAt,
          tx.updatedAt
        )
    );
  }

  /**
   * Busca transacciones por ID de usuario y categoría
   */
  async findByUserIdAndCategory(userId: string, category: string): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        category,
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(
      (tx) =>
        new Transaction(
          tx.id,
          tx.userId,
          tx.amount,
          tx.description,
          tx.type as TransactionType,
          tx.category || null,
          tx.date,
          tx.createdAt,
          tx.updatedAt
        )
    );
  }

  /**
   * Busca transacciones por ID de usuario y tipo
   */
  async findByUserIdAndType(userId: string, type: TransactionType): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: type as string,
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(
      (tx) =>
        new Transaction(
          tx.id,
          tx.userId,
          tx.amount,
          tx.description,
          tx.type as TransactionType,
          tx.category || null,
          tx.date,
          tx.createdAt,
          tx.updatedAt
        )
    );
  }

  /**
   * Obtiene el total de transacciones por ID de usuario y periodo
   */
  async getTotalByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum?.amount || 0;
  }

  /**
   * Obtiene el total de transacciones por ID de usuario y tipo
   */
  async getTotalByUserIdAndType(
    userId: string,
    type: TransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const dateFilter = {};
    
    if (startDate && endDate) {
      Object.assign(dateFilter, {
        date: {
          gte: startDate,
          lte: endDate,
        },
      });
    }
    
    const result = await prisma.transaction.aggregate({
      where: {
        userId,
        type: type as string,
        ...dateFilter,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum?.amount || 0;
  }
} 