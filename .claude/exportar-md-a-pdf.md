# Exportar un Markdown a PDF

Guia para convertir un archivo `.md` a PDF con Pandoc y un motor LaTeX
en Arch Linux.

## Instalacion

```bash
sudo pacman -S pandoc texlive-basic texlive-latex texlive-latexrecommended texlive-xetex texlive-fontsrecommended
```

Con esos paquetes alcanza para `xelatex`, `fontspec` y el flujo de abajo.
No hace falta `texlive-latexextra` (ese trae `newunicodechar` y otros
extras que aca se evitan a proposito).

## Antes de generar: revisar el texto

Paso obligatorio antes de correr pandoc. El PDF no arregla el contenido, solo
lo formatea. Revisar el `.md` contra las directrices de escritura, en
particular las marcas que se cuelan seguido:

- Em-dashes (`—`) y en-dashes (`–`): no van. Reemplazar por dos puntos, coma,
  parentesis o guion comun segun el caso. Detectar con
  `grep -nE '—|–' *.md`.
- Negrita inline salpicada (`**termino**` suelto): sacarla, dejar negrita
  solo en encabezados.
- Metacontenido ("Documento preparado para", "Fecha de elaboracion",
  ponderaciones), acotaciones de autoevaluacion y separadores `---`: fuera.

Recien despues de esa revision, generar el PDF.

## Conversion basica

```bash
pandoc entrada.md -o salida.pdf
```

## Conversion con buen formato

Las fuentes deben existir en el sistema. Verificar con
`fc-list : family | sort -u`. En este equipo estan `Noto Sans` (texto) y
`JetBrainsMono Nerd Font Mono` (codigo y simbolos).

```bash
pandoc entrada.md \
  -o salida.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  -V mainfont="Noto Sans" \
  -V monofont="JetBrainsMono Nerd Font Mono" \
  -V fontsize=11pt \
  --highlight-style=tango
```

## Caracteres faltantes (flechas, simbolos, cajas)

La fuente de texto puede no traer ciertos glifos y dejarlos en blanco.
Casos vistos en estos TPs: flechas (`→`), aproximado (`≈`), menor/mayor o
igual (`≤` `≥`) y caracteres de dibujo de cajas (`┌ ─ ┐ │`) en diagramas.

Sintomas: en la salida de `pandoc` aparecen lineas
`[WARNING] Missing character: There is no ...`. Los glifos salen en blanco
en el PDF.

Solucion sin `texlive-latexextra`: un header que redirige solo esos
codepoints a una fuente que si los tiene. Los caracteres de cajas ya
quedan cubiertos por la `monofont` (van dentro de bloques de codigo).

Crear `.pandoc-header.tex`:

```latex
\usepackage{fontspec}
\newfontfamily\fallbackfont{JetBrainsMono Nerd Font Mono}
\catcode`→=\active \protected\def→{{\fallbackfont\symbol{"2192}}}
\catcode`≈=\active \protected\def≈{{\fallbackfont\symbol{"2248}}}
\catcode`≤=\active \protected\def≤{{\fallbackfont\symbol{"2264}}}
\catcode`≥=\active \protected\def≥{{\fallbackfont\symbol{"2265}}}
```

Agregar mas lineas `\catcode...\def` si aparecen otros simbolos faltantes
(usar el codepoint hexadecimal del WARNING). Pasar el header con `-H`:

```bash
pandoc entrada.md -o salida.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  -V mainfont="Noto Sans" \
  -V monofont="JetBrainsMono Nerd Font Mono" \
  -V fontsize=11pt \
  -H .pandoc-header.tex \
  --highlight-style=tango
```

## Tablas anchas (columna con una palabra por renglon)

Pandoc reparte el ancho de cada columna segun la cantidad de guiones del
separador. Si una columna con texto largo quedo con pocos guiones, en el
PDF se comprime y muestra una palabra por renglon, lo que se ve mal.

En vez de recontar guiones tabla por tabla, conviene un filtro Lua que
asigna el ancho proporcional al largo del contenido de cada columna.
Arregla todas las tablas del documento de una.

Crear `.table-widths.lua`:

```lua
local MINW = 22  -- piso: que una columna corta no quede mas angosta que su texto
local CAP  = 42  -- tope: que una columna larga no se coma todo el ancho

local function scan(rows, maxlen)
  for _, row in ipairs(rows) do
    for i, cell in ipairs(row.cells) do
      local s = pandoc.utils.stringify(cell.contents)
      local l = utf8.len(s) or #s
      if l > maxlen[i] then maxlen[i] = l end
    end
  end
end

function Table(tbl)
  local ncol = #tbl.colspecs
  if ncol == 0 then return nil end
  local maxlen = {}
  for i = 1, ncol do maxlen[i] = 3 end
  scan(tbl.head.rows, maxlen)
  for _, body in ipairs(tbl.bodies) do
    scan(body.head, maxlen)
    scan(body.body, maxlen)
  end
  local total = 0
  for i = 1, ncol do
    if maxlen[i] > CAP then maxlen[i] = CAP end
    if maxlen[i] < MINW then maxlen[i] = MINW end
    total = total + maxlen[i]
  end
  for i = 1, ncol do
    tbl.colspecs[i] = { tbl.colspecs[i][1], maxlen[i] / total }
  end
  return tbl
end
```

El piso `MINW` evita el caso de una columna corta (ej. "Etapa") que junto a
varias columnas largas queda mas angosta que su propio texto y se pega a la
de al lado. El tope `CAP` evita que una columna larga se quede con casi todo.

Pasarlo con `--lua-filter=.table-widths.lua`. Para documentos con muchas
tablas anchas, ayuda bajar margen y fuente: `-V geometry:margin=2cm` y
`-V fontsize=10pt`.

Para mas aire entre filas (las tablas con celdas largas quedan apretadas),
agregar al header:

```latex
\renewcommand{\arraystretch}{1.4}
\setlength{\tabcolsep}{8pt}
```

Palabras largas sin corte: un token sin espacios (`tenant_id+instance_id`,
`(tenant_id,instance_id)+timestamp`) no se puede partir y se desborda sobre
la columna de al lado, pisando el texto. Poner espacios alrededor de los
operadores: `tenant_id + instance_id`, `(tenant_id, instance_id) + timestamp`.
Asi LaTeX puede cortar el renglon. Vale para `+`, `/`, etc. dentro y entre
spans de codigo. Excepcion: los diagramas ASCII de ancho fijo, donde el
espaciado rompe la alineacion (ahi los tokens cortos como `R+W>N` se dejan).

## Diagramas ASCII (cajas y flechas)

Van en un bloque de codigo sin lenguaje (entre ` ``` `) para que se rendericen
con la `monofont`. Dos cosas a cuidar:

- Alineacion: si las cajas y las flechas no caen en la misma columna, el
  problema es el arte, no la fuente. Una fuente monoespaciada no corrige un
  diagrama con espaciado irregular. Hay que dibujarlo con paso fijo: misma
  distancia entre el centro de cada caja y su conector. Verificar contando
  columnas, no a ojo.
- Ancho: a `fontsize=10pt` un diagrama de mas de ~80 columnas roza el margen
  derecho. Para que entre sin achicar el resto del texto, bajar solo el
  tamano de los bloques de codigo en el header:

```latex
\let\origverbatim\verbatim
\renewcommand{\verbatim}{\footnotesize\origverbatim}
```

(Esto aplica a bloques sin lenguaje, que pandoc rinde como `verbatim`
estandar. `\fvset{fontsize=...}` no sirve ahi porque eso es de `fancyvrb`,
que solo se usa en bloques con resaltado.)

## Notas

- Para tildes y caracteres especiales, usar `--pdf-engine=xelatex` o
  `lualatex`. El motor por defecto (`pdflatex`) puede fallar con UTF-8.
- Si el markdown tiene imagenes con rutas relativas, ejecutar el comando
  desde el directorio donde estan las imagenes.
- Si `pandoc` falla con `File '...sty' not found`, falta el paquete
  texlive que provee ese `.sty`. Buscarlo con `kpsewhich nombre.sty`.
- Verificar el PDF: `pdfinfo salida.pdf` (paginas) y revisar que la salida
  de `pandoc` no tenga `Missing character` ni `Error`.
- Bloques de codigo con lenguaje (` ```json `, ` ```js `): el resaltado de
  sintaxis usa el entorno `Shaded`, que necesita `framed.sty`
  (texlive-latexextra). Si falla con `File 'framed.sty' not found` y no se
  quiere instalar ese paquete, generar con `--no-highlight`: el codigo sale
  en monoespaciada plana, sin colores. Los bloques sin lenguaje no lo
  gatillan.
- No usar `--toc`: los TPs de este repo no llevan indice ni tabla de
  contenidos. Es la convencion del resto de las actividades, mantenerla.
- No usar `--number-sections` si los encabezados ya traen el numero a mano
  (`## 1. Parte A`, `## 9. ...`). Pandoc agregaria su propia numeracion
  encima y queda doble (`1.10  9. ...`). Estos TPs numeran a mano.

## Verificacion visual obligatoria

Despues de generar el PDF hay que mirarlo como imagen para confirmar que
quedo bien (tablas que no se desbordan, simbolos que no salen en blanco,
saltos de pagina razonables). No alcanza con que `pandoc` no tire errores.

Renderizar las paginas a PNG y abrirlas o inspeccionarlas:

```bash
pdftoppm -png -r 90 Actividad_3.pdf /tmp/act3
# revisar /tmp/act3-1.png, /tmp/act3-2.png, ...
```

Mirar sobre todo las paginas con tablas. Si alguna columna sigue saliendo
angosta o un glifo aparece en blanco, ajustar el filtro de tablas o el
header de simbolos y volver a generar.

## Comando rapido para este repo

Genera los PDF de las actividades con el flujo completo: filtro de tablas,
header de simbolos y verificacion visual. Crea y borra los temporales.

El `.table-widths.lua` es el de la seccion de tablas anchas.

```bash
cat > .pandoc-header.tex <<'EOF'
\usepackage{fontspec}
\newfontfamily\fallbackfont{JetBrainsMono Nerd Font Mono}
\catcode`→=\active \protected\def→{{\fallbackfont\symbol{"2192}}}
\catcode`≈=\active \protected\def≈{{\fallbackfont\symbol{"2248}}}
\catcode`≤=\active \protected\def≤{{\fallbackfont\symbol{"2264}}}
\catcode`≥=\active \protected\def≥{{\fallbackfont\symbol{"2265}}}
\renewcommand{\arraystretch}{1.4}
\setlength{\tabcolsep}{8pt}
\let\origverbatim\verbatim
\renewcommand{\verbatim}{\footnotesize\origverbatim}
EOF

for f in Actividad_3 Actividad_4; do
  pandoc "$f.md" -o "$f.pdf" \
    --pdf-engine=xelatex \
    -V geometry:margin=2cm \
    -V mainfont="Noto Sans" \
    -V monofont="JetBrainsMono Nerd Font Mono" \
    -V fontsize=10pt \
    -H .pandoc-header.tex \
    --lua-filter=.table-widths.lua \
    --highlight-style=tango
  pdftoppm -png -r 90 "$f.pdf" "/tmp/$f"   # revisar /tmp/$f-*.png
done

rm -f .pandoc-header.tex .table-widths.lua
```
