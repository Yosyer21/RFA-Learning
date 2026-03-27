const { parseClassContent, parseCsv, enrichLessonContent } = require('../server/utils/content');

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
      { spanish: '  pase  ', english: ' short pass ', example: 'The team uses a short pass.' },
      { spanish: '', english: 'ignored' },
    ]);

    expect(result).toEqual([
      { spanish: 'pase', english: 'short pass', example: 'The team uses a short pass.' },
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

  test('enriches lesson content with examples', () => {
    const result = enrichLessonContent({
      title: 'Acciones del Juego',
      category: 'Acciones',
      content: [{ spanish: 'pase corto', english: 'short pass' }],
    });

    expect(result.content[0]).toMatchObject({
      spanish: 'pase corto',
      english: 'short pass',
      example: 'The team practices the "short pass" in every session.',
      exampleSpanish: 'El equipo practica el "pase corto" en cada sesión.',
    });
  });
});
