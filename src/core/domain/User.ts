/**
 * Entidad de dominio para Usuario
 * Una entidad es un objeto con una identidad única que persiste a través del tiempo
 */

// Interfaz para el resultado de toJSON
export interface UserJSON {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export class User {
  // Propiedades inmutables
  readonly id: string;
  readonly phone: string;
  
  // Propiedades que pueden ser modificadas
  private _name: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _metadata: Record<string, any>;

  constructor(
    id: string,
    phone: string,
    name: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    metadata: Record<string, any> = {}
  ) {
    // Validaciones básicas
    if (!id) throw new Error('El ID del usuario es requerido');
    if (!phone) throw new Error('El teléfono del usuario es requerido');
    
    // Asignación de propiedades
    this.id = id;
    this.phone = phone;
    this._name = name;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._metadata = metadata;
  }

  // Getters
  get name(): string | null {
    return this._name;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get metadata(): Record<string, any> {
    return {...this._metadata};
  }

  // Setters (con validación)
  set name(value: string | null) {
    this._name = value;
    this._updatedAt = new Date();
  }

  // Métodos de dominio
  updateProfile(name: string | null): void {
    this.name = name;
  }

  /**
   * Actualiza los metadatos del usuario
   * @param metadata Nuevos metadatos a establecer
   */
  updateMetadata(metadata: Record<string, any>): void {
    this._metadata = {...metadata};
    this._updatedAt = new Date();
  }

  /**
   * Añade o actualiza una clave específica en los metadatos
   * @param key Clave a actualizar
   * @param value Nuevo valor
   */
  setMetadataValue(key: string, value: any): void {
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }

  // Método para serializar la entidad
  toJSON(): UserJSON {
    return {
      id: this.id,
      phone: this.phone,
      name: this._name,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      metadata: this._metadata
    };
  }
} 