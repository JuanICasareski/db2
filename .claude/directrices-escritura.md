# Directrices de escritura para TPs

Reglas para redactar la resolucion de trabajos practicos en este repo.
Registro academico/tecnico, en espanol, prolijo y sin marcas tipicas de
texto generado por IA.

## Puntuacion y formato

- No usar em-dashes (—) ni en-dashes (–). Usar coma, punto, parentesis o dos
  puntos segun corresponda.
- Una sola idea por oracion cuando sea posible. Partir las oraciones largas.
- Listas con guion (`-`) para vinetas. Numeradas solo cuando el orden importa.
- Encabezados en estilo oracion (solo la primera letra en mayuscula).
- Codigo, comandos y consultas siempre en bloques con el lenguaje indicado
  (` ```sql `, ` ```bash `, etc.).

## Tono y estilo

- Responder lo que pide la consigna, sin relleno ni introducciones largas.
- Evitar formulas tipicas de IA: "Es importante destacar que...", "Cabe
  mencionar que...", "En el mundo actual...", cierres de "En conclusion..."
  que no agregan nada.
- No exagerar ni adjetivar de mas ("potente", "robusto", "eficiente") salvo
  que el dato lo justifique.
- No repetir la consigna con otras palabras antes de resolverla.
- Registro academico impersonal cuando corresponde ("se observa", "se
  concluye", "el modelo cumple"). Mantenerlo consistente en todo el TP.

## Marcas tipicas de IA (evitar)

Patrones que delatan texto generado por IA. Surgieron de detectar el "tono
IA" en 2023-2026.

Palabras y adjetivos sobreusados (en ingles y sus calcos): delve/profundizar,
tapestry, realm/ambito, leverage/apalancar, robust, seamless, streamline,
empower, innovative, groundbreaking, transformative, multifaceted, vibrant,
landscape/panorama, unlock/desbloquear, harness, game-changer,
cutting-edge/de vanguardia, testament/testimonio, meticulous, navigating,
unprecedented, elevate, paradigm.

Frases de relleno: "Es importante destacar/notar que", "Cabe mencionar que",
"En el mundo actual", "En la era digital", "En resumen", "En conclusion",
"En esencia", "Sin lugar a dudas", "Vale la pena mencionar".

Estructuras a evitar:

- Reencuadre binario "no se trata de X, sino de Y" o "no es X, es Y" salvo
  que el contraste sea esencial.
- "No solo X, sino tambien Y" usado como plantilla.
- Conectores al inicio de oracion por costumbre: "Ademas", "Sin embargo",
  "Mas aun" repetidos.
- Intro que anuncia lo que se va a decir y conclusion que lo repite.
- Listas de tres por inercia ("rapido, eficiente y escalable").
- Parrafos todos con la misma forma (tema, explicacion, ejemplo, resumen) y
  oraciones todas del mismo largo.
- Aberturas serviles: "Buena pregunta", "Claro", "Por supuesto".

Mas patrones detectados:

- Verbos evasivos: reemplazar "es/son" por "funciona como", "se erige como",
  "representa", "marca". Mejor el verbo directo.
- Adverbios de relleno: "silenciosamente", "profundamente",
  "fundamentalmente", "notablemente", "podria decirse que".
- Falso suspenso: "Aca esta lo interesante", "La cosa es asi", "Y aca viene
  lo bueno".
- Voz pedagogica: "Desglosemos esto", "Vamos a analizar", "Entremos en
  tema".
- Analogias condescendientes: "Pensalo como...", "Es como un...".
- Inflar la importancia: tratar un tema comun como si fuera historico o
  crucial. Sacar el "crucial", "esencial", "pivotal" usados como relleno.
- Atribucion vaga: "los expertos dicen", "segun la industria", sin fuente.
- Terminos inventados que suenan tecnicos ("la paradoja de la supervision").
- Formato: no arrancar cada vineta con texto en negrita, no decorar con
  flechas (->) ni caracteres especiales, no abusar de parrafos de una sola
  oracion para dar enfasis.
- Negrita inline salpicada: marcar terminos sueltos en mitad de una oracion
  (`**Consistency**`, `**idempotente**`, `**tenant_beta**`, `**Si**`,
  `**Alta**`) es una marca tipica de IA. Un TP humano casi no usa negrita.
  Dejarla solo para encabezados. En el cuerpo y las tablas, texto plano. Si
  algo necesita destacarse de verdad, una vez y por algo concreto, no en
  cada parrafo.
- Separadores horizontales (`---`) entre secciones: no usarlos. Los
  encabezados ya separan. Las rayitas que dibujan dan aspecto de plantilla.
- Encabezado minimo: el bloque de encabezado lleva solo el titulo del TP, el
  grupo y los integrantes. No incluir subtitulo descriptivo, materia, clase
  ni fecha (ni "Fecha:" ni "Fecha de elaboracion").
- Resumir en cada nivel (la idea se repite en intro, cuerpo y cierre) y
  estirar un solo punto reformulandolo diez veces.

Antidoto: empezar con el dato o el problema concreto, variar el largo de las
oraciones, y dar ejemplos especificos en vez de generalidades.

## Claridad (Strunk & White / Orwell)

Lo relevante para resolver TPs:

- Omitir palabras innecesarias. Que cada palabra cuente.
- Usar lenguaje definido, especifico y concreto. Dar el dato, no la vaguedad.
- Usar palabras simples antes que rebuscadas, y el equivalente en espanol
  antes que la jerga o el anglicismo evitable.
- Evitar dobles negaciones y rodeos ("no es poco frecuente" -> "es comun").
- Preferir verbos fuertes a sustantivo + verbo vacio ("decidir" mejor que
  "tomar una decision").
- Revisar y reescribir antes de entregar.

## Encabezado del TP

Formato fijo, igual en todos los TPs:

- Titulo como `# Resolucion de la Actividad N: Clase Virtual NN` (heading 1).
- Linea `Grupo N`.
- Linea `Integrantes:` seguida de una lista con vinetas, un integrante por
  vineta, en formato `Apellido, Nombre, legajo NNNNNNN, email@uade.edu.ar`.
- Emails en minuscula. Orden alfabetico por apellido.
- Nada mas: sin subtitulo descriptivo, materia, clase ni fecha.

Ejemplo:

```markdown
# Resolucion de la Actividad 4: Clase Virtual 02

Grupo 4

Integrantes:

- Avila, Aldana, legajo 1193721, alavila@uade.edu.ar
- Caivano, Alexander Francisco, legajo 1209389, acaivano@uade.edu.ar
- Casareski, Juan Ignacio, legajo 1176109, jcasareski@uade.edu.ar
- Segura, Juan Ignacio, legajo 1242159, jsegura@uade.edu.ar
```

## Preguntas y respuestas

Cuando un punto se resuelve respondiendo preguntas, la pregunta va en su
linea y la respuesta en la linea siguiente. Nunca en el mismo renglon ni
con flecha.

```markdown
1. ¿Pregunta?
   Respuesta en la linea de abajo.
```

En Markdown, dos lineas seguidas sin salto duro se renderizan pegadas (la
respuesta termina al lado de la pregunta). Para que queden en lineas
separadas, cerrar la pregunta con dos espacios al final (salto duro) o
dejar una linea en blanco entre pregunta y respuesta. Revisar el PDF: si la
respuesta aparece pegada a la pregunta, falta el salto.

Evitar: `¿Pregunta? respuesta` en el mismo renglon, y
`¿Pregunta? → respuesta` con flecha.

## Estructura de la resolucion

1. Encabezado con el TP y la consigna o numero de ejercicio.
2. Resolucion por punto, en el mismo orden que la consigna.
3. Para cada punto: enunciado breve, desarrollo, y resultado o respuesta.
4. Justificar las decisiones tecnicas cuando la consigna lo pide.
5. Sin firmas, sin "generado por IA", sin emojis salvo pedido explicito.

No agregar metacontenido sobre el propio documento. El trabajo termina en
la resolucion o la conclusion. Nada de bloques tipo:

- "Documento preparado para: entrega de N paginas / exposicion de N min".
- "Fecha de elaboracion: ...".
- "Cumple con todos los criterios de evaluacion" o listas de ponderaciones
  del enunciado (volumen 15%, particionamiento 25%, etc.).
- Notas, aclaraciones o contrapuntos al margen (blockquotes meta) que
  comentan el trabajo en vez de resolver la consigna.
- Acotaciones de autoevaluacion al final de una explicacion: "Ejemplo
  esperado cumplido", "esto cumple lo pedido", "tal como pide la consigna",
  "respuesta esperada". Solo van si la consigna las pide de forma
  explicita.

Esa informacion es para el alumno, no parte de la entrega. Si hace falta
dejarla, va en un comentario o archivo aparte, no en el `.md` que se
exporta a PDF.

## Espanol

- Escribir con tildes correctas y de forma consistente.
- Mantener constante la terminologia tecnica en todo el documento (no
  alternar sinonimos para el mismo concepto).

## Checklist antes de entregar

- [ ] Resuelve lo que pide la consigna, punto por punto.
- [ ] Sin em-dashes ni en-dashes.
- [ ] Sin frases de relleno tipicas de IA.
- [ ] Registro y terminologia consistentes.
- [ ] Codigo y consultas en bloques con lenguaje.
- [ ] Tildes correctas.
- [ ] Sin palabras innecesarias.
- [ ] Sin metacontenido ("Documento preparado para", "Fecha de
      elaboracion", ponderaciones del enunciado, notas al margen).
- [ ] Sin negrita inline salpicada; negrita solo en encabezados.
- [ ] Preguntas y respuestas en lineas separadas (pregunta, abajo la
      respuesta), no pegadas ni con flecha.
