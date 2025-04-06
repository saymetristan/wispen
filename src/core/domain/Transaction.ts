/**
 * Entidad de dominio para Transacción
 * Representa un gasto o ingreso financiero del usuario
 */

// Enumerado para tipo de transacción
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

// Interfaz para el resultado de toJSON
export interface TransactionJSON {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  category: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export class Transaction {
  // Propiedades inmutables
  readonly id: string;
  readonly userId: string;
  
  // Propiedades que pueden ser modificadas
  private _amount: number;
  private _type: TransactionType;
  private _description: string;
  private _category: string | null;
  private _date: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    amount: number,
    description: string,
    type: TransactionType = TransactionType.EXPENSE,
    category: string | null = null,
    date: Date = new Date(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    // Validaciones básicas
    if (!id) throw new Error('El ID de la transacción es requerido');
    if (!userId) throw new Error('El ID del usuario es requerido');
    if (amount === 0) throw new Error('El monto no puede ser cero');
    if (!description.trim()) throw new Error('La descripción es requerida');
    
    // Validaciones específicas por tipo de transacción
    if (type === TransactionType.EXPENSE && amount > 0) {
      amount = -amount; // Convertir a número negativo si es un gasto
    } else if (type === TransactionType.INCOME && amount < 0) {
      amount = Math.abs(amount); // Convertir a número positivo si es un ingreso
    }
    
    // Asignación de propiedades
    this.id = id;
    this.userId = userId;
    this._amount = amount;
    this._type = type;
    this._description = description;
    this._category = category;
    this._date = date;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get amount(): number {
    return this._amount;
  }

  get type(): TransactionType {
    return this._type;
  }

  get description(): string {
    return this._description;
  }

  get category(): string | null {
    return this._category;
  }

  get date(): Date {
    return new Date(this._date);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Setters (con validación)
  set amount(value: number) {
    if (value === 0) throw new Error('El monto no puede ser cero');
    
    // Mantener la coherencia con el tipo de transacción
    if (this._type === TransactionType.EXPENSE && value > 0) {
      value = -value; // Asegurar que sea negativo
    } else if (this._type === TransactionType.INCOME && value < 0) {
      value = Math.abs(value); // Asegurar que sea positivo
    }
    
    this._amount = value;
    this._updatedAt = new Date();
  }

  set type(value: TransactionType) {
    // Si cambia el tipo, ajustar el signo del monto
    if (value !== this._type) {
      this._amount = -this._amount; // Invertir el signo
    }
    
    this._type = value;
    this._updatedAt = new Date();
  }

  set description(value: string) {
    if (!value.trim()) throw new Error('La descripción no puede estar vacía');
    this._description = value;
    this._updatedAt = new Date();
  }

  set category(value: string | null) {
    this._category = value;
    this._updatedAt = new Date();
  }

  set date(value: Date) {
    this._date = value;
    this._updatedAt = new Date();
  }

  // Métodos de dominio
  updateDetails(description: string, amount: number, type: TransactionType, date: Date): void {
    this.description = description;
    this.type = type;
    this.amount = amount;
    this.date = date;
  }

  categorize(category: string): void {
    this._category = category;
    this._updatedAt = new Date();
  }

  // Método para determinar si es un ingreso o gasto
  isIncome(): boolean {
    return this._type === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this._type === TransactionType.EXPENSE;
  }

  // Método para serializar la entidad
  toJSON(): TransactionJSON {
    return {
      id: this.id,
      userId: this.userId,
      amount: this._amount,
      type: this._type,
      description: this._description,
      category: this._category,
      date: this._date.toISOString(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
} 