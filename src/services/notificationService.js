import fs from 'fs';
import csv from 'csv-parser';
import schedule from 'node-schedule';
import axios from 'axios';
import User from '../models/User.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.loadNotifications();
  }

  async loadNotifications() {
    const url = 'https://wispen-files.s3.us-east-2.amazonaws.com/notifications.csv';
    try {
      const response = await axios.get(url);
      const data = response.data;

      // Guardar el contenido del archivo CSV en un archivo temporal
      const tempFilePath = '/tmp/notifications.csv';
      await fs.promises.writeFile(tempFilePath, data);

      // Leer el archivo CSV temporalmente guardado
      fs.createReadStream(tempFilePath)
        .pipe(csv())
        .on('data', (row) => {
          this.notifications.push(row);
        })
        .on('end', () => {
          logger.info('Notificaciones cargadas correctamente');
          this.scheduleNotifications();
        });
    } catch (error) {
      logger.error('Error al cargar las notificaciones:', error);
    }
  }

  scheduleNotifications() {
    this.notifications.forEach((notification) => {
      const { día, hora, ...alternativas } = notification;
      const time = hora.split(':');
      const dayOfWeek = this.getDayOfWeek(día);

      schedule.scheduleJob({ hour: time[0], minute: time[1], dayOfWeek }, async () => {
        const message = this.getRandomMessage(alternativas);
        await this.sendNotifications(message);
      });
    });
  }

  getDayOfWeek(day) {
    const days = {
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Domingo': 0,
      'Último día del mes': 'L'
    };
    return days[day];
  }

  getRandomMessage(alternativas) {
    const keys = Object.keys(alternativas);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return alternativas[randomKey];
  }

  async sendNotifications(message) {
    try {
      const users = await User.findAll();
      for (const user of users) {
        await WhatsAppService.sendMessage(user.phoneNumber, message);
      }
      logger.info('Notificaciones enviadas correctamente');
    } catch (error) {
      logger.error('Error al enviar notificaciones:', error);
    }
  }
}

export default new NotificationService();