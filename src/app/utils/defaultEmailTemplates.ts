export const defaultEmailTemplate = {
  subject: 'Client development support - [CLIENT] ([DAYS])',
  content:
    'Dear [FIRST],\n\nI hope you had a nice weekend.\n\nCould you support [CST] in preparing the [TYPE] for [CLIENT]?  The team will be in touch soon with further details.  On your timesheet, please use XYZ for the time spent on the beach.\n\n[ALLOCATION]\n\nBest,\nPD Team',
  contentNoAllocation:
    'Dear [CST],\n\nI hope you had a nice weekend.\n\nAt the moment we unfortunately do not have anyone who could support the [TYPE] for [CLIENT].  We will get in touch as soon as any beach resources free up.\n\nBest,\nPD Team',
};
