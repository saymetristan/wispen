/**
 * Entidad de dominio para Thread de OpenAI
 * Representa una conversación con el asistente
 */

export interface ThreadJSON {
  id: string;
  userId: string;
  threadId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class Thread {
  // Propiedades inmutables
  readonly id: string;
  readonly userId: string;
  readonly threadId: string;
  
  // Propiedades que pueden ser modificadas
  private _metadata: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    threadId: string,
    metadata: Record<string, any> = {},
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    // Validaciones básicas
    if (!id) throw new Error('El ID del thread es requerido');
    if (!userId) throw new Error('El ID del usuario es requerido');
    if (!threadId) throw new Error('El ID del hilo es requerido');
    
    // Asignación de propiedades
    this.id = id;
    this.userId = userId;
    this.threadId = threadId;
    this._metadata = metadata;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // Setters (con validación)
  set metadata(value: Record<string, any>) {
    this._metadata = { ...value };
    this._updatedAt = new Date();
  }

  // Métodos de dominio
  addMetadata(key: string, value: any): void {
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }

  // Método para serializar la entidad
  toJSON(): ThreadJSON {
    return {
      id: this.id,
      userId: this.userId,
      threadId: this.threadId,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
} 