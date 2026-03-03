import moment from "moment";

// Aneesh Start

export function getDate(date, format) {
  if (date && moment(date).isValid()) {
    const Format = format || "DD-MM-YYYY";
    return moment(date).format(Format);
  } else {
    return "";
  }
}

export function setDate(date, format) {
  if (date && moment(date).isValid()) {
    const Format = format || "YYYY-MM-DD";
    return moment(date).format(Format);
  } else {
    return "";
  }
}

export function getDateTime(date, format) {
  if (date && moment(date).isValid()) {
    const Format = format || "DD-MM-YYYY HH:mm:ss";
    return moment(date).format(Format);
  } else {
    return "";
  }
}

export function getDateTime12(date, format) {
  if (date && moment(date).isValid()) {
    const Format = format || "DD-MM-YYYY hh:mm A";
    return moment(date).format(Format);
  } else {
    return "";
  }
}

export function setDateTime(date, format) {
  if (date && moment(date).isValid()) {
    const Format = format || "YYYY-MM-DD HH:mm:ss";
    return moment(date).format(Format);
  } else {
    return "";
  }
}

export function toDate(date) {
  // To get a copy of the native Date object
  if (date && moment(date).isValid()) {
    return moment(date).toDate();
  } else {
    return "";
  }
}

// Aneesh End

export function formatDateToCustomString(dateString) {
  const formattedDate = moment(dateString, "YYYY-MM-DD HH:mm:ss").format(
    "DD-MM-YYYY hh:mm A"
  );
  return formattedDate;
}

// convert minute to Hour

export function convertMinutesToHoursAndMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours} hr ${remainingMinutes} min`;
}

export function getCurrentDayAndTime(timestamp) {
  // Convert the timestamp string to a Date object
  const date = new Date(timestamp);

  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Get the name of the day using an array of day names
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = daysOfWeek[dayOfWeek];

  // Get the hours, minutes, and AM/PM indicator
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const amPM = hours >= 12 ? "PM" : "AM";

  // Convert hours to 12-hour format
  hours = hours % 12 || 12;

  // Format the time
  const time = `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${amPM}`;

  return `${dayName} ${time}`;
}

export function convertMinutesToHours(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} `;
  } else {
    return `${minutes} min`;
  }
}


export function setMonth(date) {
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : null;
}

export function toMonth(dateStr) {
  if (!dateStr) return null;
  const [year, month] = dateStr.split('-');
  return new Date(year, month - 1);
}
