import { format } from 'date-fns';

class DateService {
  getCurrentDate() {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

export default new DateService();