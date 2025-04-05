export interface Transaccion {
  id: string;
  usuarioId: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}
