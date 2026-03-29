import { createEvents } from 'ics';

export default function handler(req, res) {
  const blockedDates = [
    { start: [2024, 6, 11], title: "Зарезервировано" },
    { start: [2024, 6, 12], title: "Зарезервировано" }
  ];
  const events = blockedDates.map(d => ({
    start: d.start,
    duration: { days: 1 },
    title: d.title,
  }));

  createEvents(events, (error, value) => {
    if (error) {
      res.status(500).send("ICS generation error: " + error.toString());
      return;
    }
    res.setHeader('Content-Type', 'text/calendar');
    res.status(200).send(value);
  });
}