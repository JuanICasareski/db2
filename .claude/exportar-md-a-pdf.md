# Exportar un Markdown a PDF

Guia para convertir un archivo `.md` a PDF con Pandoc y un motor LaTeX
en Arch Linux.

## Instalacion

```bash
sudo pacman -S pandoc texlive-core texlive-latexextra
```

## Conversion basica

```bash
pandoc entrada.md -o salida.pdf
```

## Conversion con buen formato

```bash
pandoc entrada.md \
  -o salida.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  -V mainfont="DejaVu Sans" \
  -V fontsize=11pt \
  --toc --number-sections
```

## Notas

- Para tildes y caracteres especiales, usar `--pdf-engine=xelatex` o
  `lualatex`. El motor por defecto (`pdflatex`) puede fallar con UTF-8.
- Si el markdown tiene imagenes con rutas relativas, ejecutar el comando
  desde el directorio donde estan las imagenes.
- Para resaltado de sintaxis en bloques de codigo, agregar
  `--highlight-style=tango`.

## Comando rapido para este repo

```bash
pandoc Resolucion_Actividad3_Cap_FlowOps.md \
  -o Resolucion_Actividad3_Cap_FlowOps.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  --toc --number-sections
```
