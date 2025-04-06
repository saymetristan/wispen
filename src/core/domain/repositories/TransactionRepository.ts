import { Transaction, TransactionType } from '../Transaction';

/**
 * Interfaz que define las operaciones del repositorio de transacciones
 * Siguiendo los principios de inversión de dependencia (DIP)
 */
export interface TransactionRepository {
  // Operaciones CRUD básicas
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  create(transaction: Transaction): Promise<Transaction>;
  update(transaction: Transaction): Promise<Transaction>;
  delete(id: string): Promise<void>;
  
  // Operaciones de consulta específicas
  findByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  findByUserIdAndCategory(userId: string, category: string): Promise<Transaction[]>;
  findByUserIdAndType(userId: string, type: TransactionType): Promise<Transaction[]>;
  
  // Operaciones agregadas
  getTotalByUserIdAndPeriod(userId: string, startDate: Date, endDate: Date): Promise<number>;
  getTotalByUserIdAndType(userId: string, type: TransactionType, startDate?: Date, endDate?: Date): Promise<number>;
} 