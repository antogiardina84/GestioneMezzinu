// src/utils/dayjs.ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';

dayjs.extend(relativeTime);
dayjs.locale('it');

export default dayjs;