/**
 * Entidad de usuario
 */
export interface User {
  id: string;
  phone: string;
  name?: string | null;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
} 