# Read a health file

Use this when the user asks about a lab sheet, a scan report, or a family health record. Switch it off when the task is not about health.

1. Call load_tools group=health.
2. Read only the file the user named. Do not invent a number, a range, or a date.
3. Save each result with health_log: person, date, name, value, unit, low, high, and source as the file path. Leave low and high empty when the sheet does not print a range.
4. Call health_panel for that person. Quote only the rows the tool printed.
5. A value marked below or above is outside the range printed on the sheet. Say that, and say a doctor should see it. Do not name a disease from a number. Do not say the person has cancer.
6. If the file is a scan report, quote the impression already written there. Do not add findings that are not in the text.
7. The record stays in this project and is not copied to the other phone. Do not upload it.
8. When the health task is finished, call use_skill name=health scope=app on=false.

For one named test over time, call health_trend. Quote its min, max, mean, and whether the last number is higher or lower than the first. health_index lists every saved test.
Pass topic to health_log when the sheet names a specialty.
Quote a diagnosis only when that sentence is already in the file. Do not combine tests into a new disease name.
