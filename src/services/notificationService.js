import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import schedule from 'node-schedule';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import WhatsAppService from './whatsappService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.loadNotifications();
  }

  loadNotifications() {
    const results = [];
    fs.createReadStream(path.join(process.cwd(), 'src', 'utils', 'notifications.csv'))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        this.notifications = results;
        this.scheduleNotifications();
      });
  }

  async scheduleNotifications() {
    const users = await User.findAll();
    this.notifications.forEach((notification) => {
      const [hour, minute] = notification.hora.split(':');
      const dayOfWeek = this.getDayOfWeek(notification.día);

      schedule.scheduleJob(`${minute} ${hour} * * ${dayOfWeek}`, () => {
        users.forEach(user => this.createNotification(user.id, notification));
      });
    });
  }

  async createNotification(userId, notification) {
    const message = this.getRandomMessage(notification);
    await Notification.create({
      userId,
      message,
      scheduledFor: new Date(),
      sent: false
    });
  }

  async sendNotifications(notification) {
    const users = await User.findAll();
    for (const user of users) {
      const message = this.getRandomMessage(notification);
      await Notification.create({
        userId: user.id,
        message: message,
        scheduledFor: new Date(),
        sent: false
      });
    }
    this.processNotificationQueue();
  }

  async processNotificationQueue() {
    const pendingNotifications = await Notification.findAll({
      where: { sent: false },
      order: [['scheduledFor', 'ASC']],
      limit: 100
    });

    for (const notification of pendingNotifications) {
      try {
        const user = await User.findByPk(notification.userId);
        if (user) {
          await WhatsAppService.sendMessage(user.phoneNumber, notification.message);
          notification.sent = true;
          await notification.save();
        }
      } catch (error) {
        logger.error(`Error sending notification to user ${notification.userId}:`, error);
      }
    }

    if (pendingNotifications.length === 100) {
      setTimeout(() => this.processNotificationQueue(), 1000);
    }
  }

  getRandomMessage(notification) {
    const options = Object.values(notification).slice(2); // Excluir día y hora
    return options[Math.floor(Math.random() * options.length)];
  }

  getDayOfWeek(day) {
    const days = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
    return days[day] || '*';
  }

  init() {
    this.loadNotifications();
    this.scheduleNotifications();
    this.startNotificationQueue();
  }

  startNotificationQueue() {
    setInterval(() => this.processNotificationQueue(), 60000); // Procesar la cola cada minuto
  }

  handleSpecialNotifications() {
    schedule.scheduleJob('0 20 L * *', async () => { // Último día del mes a las 20:00
      const users = await User.findAll();
      const notification = this.notifications.find(n => n.día === 'Último día del mes');
      if (notification) {
        users.forEach(user => this.createNotification(user.id, notification));
      }
    });
  }
}

export default new NotificationService();