export interface Usuario {
  id: string;
  phoneNumber: string;
  nombre: string | null;
  createdAt: Date;
  updatedAt: Date;
  openaiThreadId: string | null;
}
