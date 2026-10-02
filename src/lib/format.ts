const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatSnowDateTime(value: string | number | Date) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatSnowDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}

export function formatSnowTime(value: string | number | Date) {
  return timeFormatter.format(new Date(value));
}
