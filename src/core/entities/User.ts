/**
 * Entidad que representa un usuario en el sistema
 */
export interface User {
  /**
   * Identificador único del usuario
   */
  id: string;
  
  /**
   * Número de teléfono del usuario (formato internacional)
   */
  phone: string;
  
  /**
   * Nombre del usuario
   */
  name?: string;
  
  /**
   * Correo electrónico del usuario
   */
  email?: string;
  
  /**
   * Metadatos adicionales (JSON)
   */
  metadata?: Record<string, any>;
  
  /**
   * Fecha de creación del usuario
   */
  createdAt: Date;
  
  /**
   * Fecha de última actualización
   */
  updatedAt: Date;
} 