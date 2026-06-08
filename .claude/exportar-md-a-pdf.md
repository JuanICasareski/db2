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
  --toc --number-sections \
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
  --toc --number-sections \
  --highlight-style=tango
```

## Notas

- Para tildes y caracteres especiales, usar `--pdf-engine=xelatex` o
  `lualatex`. El motor por defecto (`pdflatex`) puede fallar con UTF-8.
- Si el markdown tiene imagenes con rutas relativas, ejecutar el comando
  desde el directorio donde estan las imagenes.
- Si `pandoc` falla con `File '...sty' not found`, falta el paquete
  texlive que provee ese `.sty`. Buscarlo con `kpsewhich nombre.sty`.
- Verificar el PDF: `pdfinfo salida.pdf` (paginas) y revisar que la salida
  de `pandoc` no tenga `Missing character` ni `Error`.

## Comando rapido para este repo

Genera los PDF de las actividades con el flujo completo. Crea y borra el
header temporal.

```bash
cat > .pandoc-header.tex <<'EOF'
\usepackage{fontspec}
\newfontfamily\fallbackfont{JetBrainsMono Nerd Font Mono}
\catcode`→=\active \protected\def→{{\fallbackfont\symbol{"2192}}}
\catcode`≈=\active \protected\def≈{{\fallbackfont\symbol{"2248}}}
\catcode`≤=\active \protected\def≤{{\fallbackfont\symbol{"2264}}}
\catcode`≥=\active \protected\def≥{{\fallbackfont\symbol{"2265}}}
EOF

for f in Actividad_3 Actividad_4; do
  pandoc "$f.md" -o "$f.pdf" \
    --pdf-engine=xelatex \
    -V geometry:margin=2.5cm \
    -V mainfont="Noto Sans" \
    -V monofont="JetBrainsMono Nerd Font Mono" \
    -V fontsize=11pt \
    -H .pandoc-header.tex \
    --toc --number-sections \
    --highlight-style=tango
done

rm -f .pandoc-header.tex
```
