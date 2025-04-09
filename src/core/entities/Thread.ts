/**
 * Entidad que representa un hilo de conversación
 */
export interface Thread {
  /**
   * Identificador único del hilo
   */
  id: string;
  
  /**
   * ID del usuario asociado al hilo
   */
  userId: string;
  
  /**
   * ID del hilo en OpenAI
   */
  threadId: string;
  
  /**
   * Metadatos adicionales (JSON)
   */
  metadata?: Record<string, any>;
  
  /**
   * Fecha de creación del hilo
   */
  createdAt: Date;
  
  /**
   * Fecha de última actualización
   */
  updatedAt: Date;
} 