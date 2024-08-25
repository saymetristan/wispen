class CommandDetectionService {
    detectCommand(text, command) {
      const regex = new RegExp(`\\${command}\\b`, 'i');
      return regex.test(text);
    }
  }
  
  export default new CommandDetectionService();