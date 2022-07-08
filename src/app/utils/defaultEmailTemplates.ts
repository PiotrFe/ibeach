export const defaultEmailTemplate = {
  subject: 'Client development support - [CLIENT] ([DAYS])',
  content:
    'Hi [FIRST],\n\nI hope you had a nice weekend!\n\nThe [CLIENT] team is looking for support with the [TYPE] this week. It would be great if you could support them Monday to Friday.\n\n[ALLOCATION]\n\nThe team will be in touch with more information shortly. Please let me know if you haven’t been contacted by 2pm.\n\nOn your timesheet, please use XYZ for the time spent on the beach.\n\nBest,\nPD Team',
  contentNoAllocation:
    'Dear [CST],\n\nI hope you had a nice weekend.\n\nAt the moment we unfortunately do not have anyone who could support the [TYPE] for [CLIENT]. We will get in touch as soon as any beach resources free up.\n\nBest,\nPD Team',
};
