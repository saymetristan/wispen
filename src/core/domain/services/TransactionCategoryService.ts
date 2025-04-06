/**
 * Servicio para manejar la categorización de transacciones
 */

// Categorías predefinidas para gastos
export const expenseCategories = [
  'comida',
  'transporte',
  'vivienda',
  'servicios',
  'entretenimiento',
  'salud',
  'educación',
  'ropa',
  'tecnología',
  'viajes',
  'mascotas',
  'impuestos',
  'otros'
];

// Categorías predefinidas para ingresos
export const incomeCategories = [
  'salario',
  'honorarios',
  'inversiones',
  'regalos',
  'ventas',
  'reembolsos',
  'otros'
];

// Subcategorías organizadas por categoría principal
const categoryKeywords: Record<string, string[]> = {
  // Gastos
  'comida': ['restaurante', 'café', 'supermercado', 'mercado', 'food', 'hambre', 'comer', 'desayuno', 'almuerzo', 'cena', 'comida a domicilio', 'rappi', 'uber eats', 'didi food', 'pizza', 'tacos', 'hamburguesa', 'sushi', 'carne', 'pollo', 'pescado', 'verduras', 'frutas', 'despensa', 'antojo'],
  'transporte': ['gasolina', 'uber', 'didi', 'taxi', 'metro', 'bus', 'camión', 'pasaje', 'boleto', 'transporte público', 'estacionamiento', 'verificación', 'servicio', 'mantenimiento', 'llanta', 'auto', 'coche', 'moto', 'bicicleta', 'scooter'],
  'vivienda': ['renta', 'hipoteca', 'departamento', 'casa', 'mantenimiento', 'reparación', 'muebles', 'decoración', 'jardín', 'limpieza'],
  'servicios': ['luz', 'agua', 'gas', 'internet', 'teléfono', 'celular', 'netflix', 'spotify', 'cable', 'tv', 'streaming', 'suscripción', 'recibo', 'servicio'],
  'entretenimiento': ['cine', 'teatro', 'concierto', 'fiesta', 'bar', 'juegos', 'videojuegos', 'hobby', 'consola', 'cerveza', 'alcohol', 'club', 'eventos', 'show'],
  'salud': ['médico', 'doctor', 'medicina', 'farmacia', 'hospital', 'clínica', 'dentista', 'terapia', 'psicólogo', 'gym', 'gimnasio', 'entrenamiento', 'vitaminas', 'seguro'],
  'educación': ['colegiatura', 'escuela', 'curso', 'libro', 'universidad', 'maestría', 'diplomado', 'seminario', 'clase', 'material', 'útiles', 'cuaderno', 'libreta', 'mochila'],
  'ropa': ['vestimenta', 'zapatos', 'tenis', 'camisa', 'pantalón', 'blusa', 'falda', 'vestido', 'chamarra', 'abrigo', 'accesorios', 'reloj', 'bolsa', 'maquillaje', 'ropa', 'joyería'],
  'tecnología': ['celular', 'teléfono', 'computadora', 'laptop', 'tableta', 'gadget', 'audífonos', 'accesorios', 'aplicación', 'software', 'hardware', 'cable', 'cargador', 'batería'],
  'viajes': ['hotel', 'avión', 'vuelo', 'hospedaje', 'aeropuerto', 'vacaciones', 'tour', 'excursión', 'playa', 'maleta', 'pasaporte', 'reservación'],
  'mascotas': ['veterinario', 'alimento', 'mascota', 'perro', 'gato', 'pez', 'ave', 'juguete', 'accesorios', 'correa', 'jaula', 'arena', 'vacuna'],
  'impuestos': ['hacienda', 'sat', 'impuesto', 'declaración', 'anual', 'iva', 'isr', 'predial', 'tenencia', 'fiscal', 'contabilidad', 'contador'],
  
  // Ingresos
  'salario': ['sueldo', 'nómina', 'quincena', 'deposito', 'pago', 'trabajo', 'empleo', 'chamba', 'aguinaldo', 'prima', 'bono', 'compensación'],
  'honorarios': ['factura', 'servicio', 'cliente', 'proyecto', 'consultoría', 'asesoría', 'freelance', 'profesional', 'independiente'],
  'inversiones': ['dividendo', 'interés', 'rendimiento', 'ganancia', 'acción', 'bolsa', 'fondo', 'cetes', 'inversión', 'renta', 'inmueble', 'criptomoneda', 'crypto'],
  'regalos': ['obsequio', 'donación', 'dinero', 'cumpleaños', 'navidad', 'boda', 'celebración', 'presente'],
  'ventas': ['venta', 'producto', 'mercancía', 'cliente', 'artículo', 'marketplace', 'segunda mano', 'usado'],
  'reembolsos': ['devolución', 'reembolso', 'garantía', 'reclamo', 'seguro']
};

export class TransactionCategoryService {
  /**
   * Categoriza automáticamente una transacción basada en su descripción
   * @param description Descripción de la transacción
   * @param isIncome Indica si es un ingreso (true) o un gasto (false)
   * @returns La categoría asignada
   */
  static categorizeTransaction(description: string, isIncome: boolean): string {
    // Convertir a minúsculas para normalizar
    const normalizedDescription = description.toLowerCase();
    
    // Determinar qué conjunto de categorías usar
    const categories = isIncome ? incomeCategories : expenseCategories;
    
    // Buscar coincidencias de palabras clave
    for (const category of categories) {
      // Si la categoría es mencionada directamente en la descripción
      if (normalizedDescription.includes(category)) {
        return category;
      }
      
      // Revisar palabras clave asociadas a esta categoría
      const keywords = categoryKeywords[category] || [];
      for (const keyword of keywords) {
        if (normalizedDescription.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Si no hay coincidencias, devolver categoría por defecto
    return isIncome ? 'otros' : 'otros';
  }
  
  /**
   * Obtiene todas las categorías disponibles
   * @param isIncome Indica si son categorías de ingresos (true) o gastos (false)
   */
  static getCategories(isIncome: boolean): string[] {
    return isIncome ? [...incomeCategories] : [...expenseCategories];
  }
} 