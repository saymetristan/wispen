import { createClient } from '@supabase/supabase-js';
import { env } from '@infrastructure/config/env';
import { logger } from '@utils/logger';

// Crear cliente de Supabase
const supabaseUrl = env.SUPABASE_DATABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Verificar conexión a Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Intentar realizar una operación simple para verificar conexión
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error al conectar con Supabase', { error });
      return false;
    }
    
    logger.info('Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    logger.error('Error al conectar con Supabase', { error });
    return false;
  }
}; 