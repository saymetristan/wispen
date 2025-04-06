import { type RunSubmitToolOutputsParams } from 'openai/resources/beta/threads/runs/runs';
import { RegisterTransactionUseCase } from '@core/usecases/transaction/RegisterTransactionUseCase';
import { GetBalanceUseCase } from '@core/usecases/transaction/GetBalanceUseCase';
import { GenerateReportUseCase } from '@core/usecases/transaction/GenerateReportUseCase';
import { logger } from '@utils/logger';
import { ToolResponse } from './tools/AssistantTools';

// Tipo para la herramienta
interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  type: 'function';
}

/**
 * Clase encargada de manejar las llamadas a herramientas (tools) 
 * realizadas por el asistente de OpenAI y ejecutar los casos de uso correspondientes
 */
export class OpenAIToolHandler {
  
  /**
   * Procesa una llamada a herramienta y ejecuta el caso de uso correspondiente
   */
  async handleToolCall(toolCall: ToolCall, userId: string): Promise<any> {
    try {
      logger.info('Procesando llamada a herramienta', {
        tool: toolCall.function.name,
        userId
      });

      if (!toolCall.function.arguments) {
        return {
          success: false,
          message: 'No se proporcionaron argumentos para la herramienta',
          error: 'NO_ARGUMENTS'
        };
      }

      // Parsear los argumentos
      const args = JSON.parse(toolCall.function.arguments);
      
      // Asegurarnos de que el userId siempre esté presente
      args.userId = userId;

      // Ejecutar el caso de uso correspondiente según la herramienta
      let response: ToolResponse = {
        success: false,
        message: 'No se pudo procesar la solicitud',
        error: 'UNKNOWN_TOOL'
      };

      switch (toolCall.function.name) {
        case 'registrar_transaccion':
          response = await this.handleRegisterTransaction(args);
          break;
        case 'consultar_saldo':
          response = await this.handleGetBalance(args);
          break;
        case 'generar_reporte':
          response = await this.handleGenerateReport(args);
          break;
        default:
          logger.warn('Herramienta no reconocida', {
            tool: toolCall.function.name,
            userId
          });
          break;
      }

      // Registrar la respuesta
      logger.info('Respuesta de la herramienta procesada', {
        tool: toolCall.function.name,
        success: response.success,
        userId
      });

      return response;

    } catch (error) {
      logger.error('Error al procesar la llamada a herramienta', {
        tool: toolCall.function.name,
        error: (error as Error).message,
        userId
      });

      return {
        success: false,
        message: 'Error al procesar la solicitud',
        error: (error as Error).message
      };
    }
  }

  /**
   * Maneja el registro de una transacción
   */
  private async handleRegisterTransaction(args: any): Promise<ToolResponse> {
    const useCase = new RegisterTransactionUseCase();
    return await useCase.execute(args);
  }

  /**
   * Maneja la consulta de saldo
   */
  private async handleGetBalance(args: any): Promise<ToolResponse> {
    const useCase = new GetBalanceUseCase();
    return await useCase.execute(args);
  }

  /**
   * Maneja la generación de reportes
   */
  private async handleGenerateReport(args: any): Promise<ToolResponse> {
    const useCase = new GenerateReportUseCase();
    return await useCase.execute(args);
  }
} 