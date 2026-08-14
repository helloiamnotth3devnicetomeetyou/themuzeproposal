export const dateAtLocalMidnight = (value: string) =>
  new Date(`${value}T00:00:00`);

export const daysUntil = (value: string, referenceDate = new Date()) => {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (dateAtLocalMidnight(value).getTime() - today.getTime()) / 86_400_000,
  );
};
