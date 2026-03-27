const { parseClassContent, parseCsv } = require('../server/utils/content');

describe('content utils', () => {
  test('parses class content from pipe-separated text', () => {
    const result = parseClassContent('  hola | hello  \n\n adios | goodbye ');

    expect(result).toEqual([
      { spanish: 'hola', english: 'hello' },
      { spanish: 'adios', english: 'goodbye' },
    ]);
  });

  test('parses class content from array input', () => {
    const result = parseClassContent([
      { spanish: '  pase  ', english: ' short pass ' },
      { spanish: '', english: 'ignored' },
    ]);

    expect(result).toEqual([
      { spanish: 'pase', english: 'short pass' },
    ]);
  });

  test('parses quoted csv rows', () => {
    const result = parseCsv('title,category,level,spanish,english\n"Clase, 1",Vocabulary,Beginner,"pase corto","short pass"');

    expect(result).toEqual([
      {
        title: 'Clase, 1',
        category: 'Vocabulary',
        level: 'Beginner',
        spanish: 'pase corto',
        english: 'short pass',
      },
    ]);
  });
});
