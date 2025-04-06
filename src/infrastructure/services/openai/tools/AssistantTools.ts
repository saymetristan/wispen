/**
 * Definición de herramientas (tools) para OpenAI Assistant API
 */

/**
 * Interfaz base para todas las herramientas
 */
export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Tipo de transacción (ingreso o gasto)
 */
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

/**
 * Parámetros para la herramienta de registro de transacciones
 */
export interface RegisterTransactionParams {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  category?: string;
  date?: string; // ISO format
}

/**
 * Parámetros para la herramienta de consulta de saldo
 */
export interface GetBalanceParams {
  userId: string;
  startDate?: string; // ISO format
  endDate?: string; // ISO format
}

/**
 * Parámetros para la herramienta de reportes
 */
export interface GenerateReportParams {
  userId: string;
  reportType: 'expenses' | 'income' | 'balance';
  startDate?: string; // ISO format
  endDate?: string; // ISO format
  groupBy?: 'category' | 'day' | 'week' | 'month';
  download?: boolean;
}

/**
 * Especificaciones de herramientas para OpenAI
 */
export const toolSpecifications = [
  {
    type: "function",
    function: {
      name: "registrar_transaccion",
      description: "Registra una nueva transacción (ingreso o gasto) para el usuario",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Monto de la transacción (positivo para ingresos, negativo para gastos)"
          },
          type: {
            type: "string",
            enum: ["expense", "income"],
            description: "Tipo de transacción: expense (gasto) o income (ingreso)"
          },
          description: {
            type: "string",
            description: "Descripción de la transacción"
          },
          category: {
            type: "string",
            description: "Categoría de la transacción (ej. comida, transporte, salario, etc.)"
          },
          date: {
            type: "string",
            format: "date",
            description: "Fecha de la transacción en formato ISO (YYYY-MM-DD). Si no se especifica, se usa la fecha actual."
          }
        },
        required: ["amount", "type", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "consultar_saldo",
      description: "Consulta el saldo actual del usuario o durante un período específico",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Fecha de inicio para el período (YYYY-MM-DD)"
          },
          endDate: {
            type: "string",
            format: "date",
            description: "Fecha de fin para el período (YYYY-MM-DD)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generar_reporte",
      description: "Genera un reporte de transacciones para el usuario",
      parameters: {
        type: "object",
        properties: {
          reportType: {
            type: "string",
            enum: ["expenses", "income", "balance"],
            description: "Tipo de reporte: expenses (gastos), income (ingresos) o balance (balance)"
          },
          startDate: {
            type: "string",
            format: "date",
            description: "Fecha de inicio para el reporte (YYYY-MM-DD)"
          },
          endDate: {
            type: "string",
            format: "date",
            description: "Fecha de fin para el reporte (YYYY-MM-DD)"
          },
          groupBy: {
            type: "string",
            enum: ["category", "day", "week", "month"],
            description: "Agrupar resultados por: categoría, día, semana o mes"
          },
          download: {
            type: "boolean",
            description: "Si es true, genera un archivo para descargar. Por defecto es false."
          }
        },
        required: ["reportType"]
      }
    }
  }
]; 