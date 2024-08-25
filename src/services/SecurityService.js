class SecurityService {
    provideSecurity() {
      const securityMessage = `¡gracias por tu interés en cómo cuidamos tus datos! 🛡️💼
  
  te envío un pequeño manual sobre nuestra seguridad y privacidad. 
  
  recuerda, tus datos están más protegidos que un tesoro pirata, pero mucho más fáciles de acceder (para ti, claro está).`;
  
      const pdfUrl = 'https://wispen-files.s3.us-east-2.amazonaws.com/Seguridad%20y%20privacidad%20Wispen.pdf';
  
      return { message: securityMessage, pdfUrl: pdfUrl };
    }
  }
  
  export default new SecurityService();