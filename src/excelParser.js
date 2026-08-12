import * as XLSX from 'xlsx';

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return '';

  return String(valor)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizar = (valor) => {
  return limpiarTexto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

const normalizarGrado = (valor) => {
  const texto = normalizar(valor);

  if (!texto) return '';

  if (
    texto === 'PRIMERO' ||
    texto === '1' ||
    texto === '1RO' ||
    texto === '1°' ||
    texto === '1ERO'
  ) {
    return 'Primero';
  }

  if (
    texto === 'SEGUNDO' ||
    texto === '2' ||
    texto === '2DO' ||
    texto === '2°'
  ) {
    return 'Segundo';
  }

  if (
    texto === 'TERCERO' ||
    texto === '3' ||
    texto === '3RO' ||
    texto === '3°'
  ) {
    return 'Tercero';
  }

  if (
    texto === 'CUARTO' ||
    texto === '4' ||
    texto === '4TO' ||
    texto === '4°'
  ) {
    return 'Cuarto';
  }

  if (
    texto === 'QUINTO' ||
    texto === '5' ||
    texto === '5TO' ||
    texto === '5°'
  ) {
    return 'Quinto';
  }

  if (
    texto === 'SEXTO' ||
    texto === '6' ||
    texto === '6TO' ||
    texto === '6°'
  ) {
    return 'Sexto';
  }

  return '';
};

const normalizarSeccion = (valor) => {
  const texto = limpiarTexto(valor);

  if (!texto) return '';

  const limpio = normalizar(texto);

  // Solo aceptamos secciones tipo A, B, C...
  if (/^[A-Z]$/.test(limpio)) {
    return limpio;
  }

  // Casos como "Sección A"
  const match = limpio.match(/SECCION\s+([A-Z])/);

  if (match) {
    return match[1];
  }

  return texto;
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true
        });

        const allStudents = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];

          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
            raw: false
          });

          if (!rawRows || rawRows.length === 0) return;

          // -------------------------------------------------------
          // BUSCAR LA FILA REAL DE ENCABEZADOS
          // -------------------------------------------------------

          let headerRowIndex = -1;
          let headers = [];

          for (
            let i = 0;
            i < Math.min(rawRows.length, 30);
            i++
          ) {
            const row = rawRows[i] || [];

            const textos = row.map((celda) =>
              normalizar(celda)
            );

            const tieneDNI = textos.some((h) =>
              h === 'DNI' ||
              h.includes('DNI')
            );

            const tieneNombre = textos.some((h) =>
              h.includes('NOMBRE') ||
              h.includes('ESTUDIANTE') ||
              h.includes('APELLIDO')
            );

            if (tieneDNI && tieneNombre) {
              headerRowIndex = i;

              headers = row.map((h) =>
                limpiarTexto(h)
              );

              break;
            }
          }

          if (
            headerRowIndex === -1 ||
            headers.length === 0
          ) {
            return;
          }

          // -------------------------------------------------------
          // PROCESAR ESTUDIANTES
          // -------------------------------------------------------

          for (
            let rowIndex = headerRowIndex + 1;
            rowIndex < rawRows.length;
            rowIndex++
          ) {
            const row = rawRows[rowIndex];

            if (!row) continue;

            const filaVacia = row.every(
              (valor) =>
                limpiarTexto(valor) === ''
            );

            if (filaVacia) continue;

            const student = {
              id: `${sheetName}-${rowIndex}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,

              hojaOrigen: sheetName,

              grado: '',

              seccion: '',

              nombres: '',

              dni: '',

              fechaNacimiento: '',

              domicilio: '',

              referencia: '',

              seguro: '',

              padreNombre: '',
              padreVive: '',
              padreCelular: '',
              padreDomicilio: '',

              madreNombre: '',
              madreVive: '',
              madreCelular: '',
              madreDomicilio: '',

              apoderadoNombre: '',
              apoderadoParentesco: '',
              apoderadoCelular: '',
              quienEsApoderado: ''
            };

            let hasValidData = false;

            headers.forEach(
              (header, columnIndex) => {
                const value = row[columnIndex];

                if (
                  value === undefined ||
                  value === null ||
                  limpiarTexto(value) === ''
                ) {
                  return;
                }

                const textoHeader = normalizar(
                  header
                );

                const textoValor =
                  limpiarTexto(value);

                hasValidData = true;

                // ==================================================
                // GRADO
                // ==================================================

                if (
                  textoHeader === 'GRADO' ||
                  textoHeader === 'NIVEL Y GRADO' ||
                  textoHeader === 'GRADO DEL ESTUDIANTE'
                ) {
                  const grado =
                    normalizarGrado(value);

                  if (grado) {
                    student.grado = grado;
                  }

                  return;
                }

                // ==================================================
                // SECCIÓN
                // ==================================================

                if (
                  textoHeader === 'SECCION' ||
                  textoHeader === 'SECCIÓN' ||
                  textoHeader === 'SECCION DEL ESTUDIANTE' ||
                  textoHeader === 'SECCION DEL ESTUDIANTE'
                ) {
                  student.seccion =
                    normalizarSeccion(value);

                  return;
                }

                // ==================================================
                // DNI
                // ==================================================

                if (
                  textoHeader === 'DNI' ||
                  textoHeader === 'N° DNI' ||
                  textoHeader === 'Nº DNI' ||
                  textoHeader.includes('DNI')
                ) {
                  student.dni = textoValor;
                  return;
                }

                // ==================================================
                // FECHA DE NACIMIENTO
                // ==================================================

                if (
                  textoHeader.includes(
                    'FECHA DE NACIMIENTO'
                  ) ||
                  textoHeader.includes(
                    'NACIMIENTO'
                  )
                ) {
                  student.fechaNacimiento =
                    textoValor;

                  return;
                }

                // ==================================================
                // DIRECCIÓN / DOMICILIO DEL ESTUDIANTE
                // IMPORTANTE:
                // NO confundir con padre/madre
                // ==================================================

                if (
                  (
                    textoHeader === 'DIRECCION' ||
                    textoHeader === 'DIRECCIÓN' ||
                    textoHeader === 'DOMICILIO' ||
                    textoHeader === 'DIRECCION DEL ESTUDIANTE' ||
                    textoHeader === 'DOMICILIO DEL ESTUDIANTE' ||
                    textoHeader.includes('DIRECCION DEL ESTUDIANTE') ||
                    textoHeader.includes('DOMICILIO DEL ESTUDIANTE')
                  ) &&
                  !textoHeader.includes('PADRE') &&
                  !textoHeader.includes('MADRE')
                ) {
                  student.domicilio =
                    textoValor;

                  return;
                }

                // ==================================================
                // REFERENCIA
                // ==================================================

                if (
                  textoHeader === 'REFERENCIA' ||
                  textoHeader === 'REFERENCIAS' ||
                  textoHeader.includes('REFERENCIA')
                ) {
                  student.referencia =
                    textoValor;

                  return;
                }

                // ==================================================
                // SEGURO
                // ==================================================

                if (
                  textoHeader === 'SEGURO' ||
                  textoHeader.includes('TIPO DE SEGURO') ||
                  textoHeader.includes('SEGURO DE SALUD')
                ) {
                  student.seguro =
                    textoValor;

                  return;
                }

                // ==================================================
                // PADRE
                // ==================================================

                if (
                  textoHeader.includes('PADRE')
                ) {
                  if (
                    textoHeader.includes('NOMBRE')
                  ) {
                    student.padreNombre =
                      textoValor;
                  } else if (
                    textoHeader.includes('CELULAR') ||
                    textoHeader.includes('TELEFONO') ||
                    textoHeader.includes('TELÉFONO')
                  ) {
                    student.padreCelular =
                      textoValor;
                  } else if (
                    textoHeader.includes('VIVE')
                  ) {
                    student.padreVive =
                      textoValor;
                  } else if (
                    textoHeader.includes('DOMICILIO') ||
                    textoHeader.includes('DIRECCION')
                  ) {
                    student.padreDomicilio =
                      textoValor;
                  }

                  return;
                }

                // ==================================================
                // MADRE
                // ==================================================

                if (
                  textoHeader.includes('MADRE')
                ) {
                  if (
                    textoHeader.includes('NOMBRE')
                  ) {
                    student.madreNombre =
                      textoValor;
                  } else if (
                    textoHeader.includes('CELULAR') ||
                    textoHeader.includes('TELEFONO') ||
                    textoHeader.includes('TELÉFONO')
                  ) {
                    student.madreCelular =
                      textoValor;
                  } else if (
                    textoHeader.includes('VIVE')
                  ) {
                    student.madreVive =
                      textoValor;
                  } else if (
                    textoHeader.includes('DOMICILIO') ||
                    textoHeader.includes('DIRECCION')
                  ) {
                    student.madreDomicilio =
                      textoValor;
                  }

                  return;
                }

                // ==================================================
                // QUIÉN ES EL APODERADO
                // ==================================================

                if (
                  textoHeader.includes('QUIEN ES EL APODERADO') ||
                  textoHeader.includes('QUIEN ES EL APO')
                ) {
                  student.quienEsApoderado =
                    textoValor;

                  return;
                }

                // ==================================================
                // APODERADO
                // ==================================================

                if (
                  textoHeader.includes('APODERADO')
                ) {
                  if (
                    textoHeader.includes('NOMBRE')
                  ) {
                    student.apoderadoNombre =
                      textoValor;
                  } else if (
                    textoHeader.includes('PARENTESCO')
                  ) {
                    student.apoderadoParentesco =
                      textoValor;
                  } else if (
                    textoHeader.includes('CELULAR') ||
                    textoHeader.includes('TELEFONO') ||
                    textoHeader.includes('TELÉFONO')
                  ) {
                    student.apoderadoCelular =
                      textoValor;
                  }

                  return;
                }

                // ==================================================
                // NOMBRE DEL ESTUDIANTE
                // ==================================================

                if (
                  (
                    textoHeader.includes('NOMBRE') ||
                    textoHeader.includes('APELLIDO') ||
                    textoHeader.includes('ESTUDIANTE')
                  ) &&
                  !textoHeader.includes('PADRE') &&
                  !textoHeader.includes('MADRE') &&
                  !textoHeader.includes('APODERADO')
                ) {
                  student.nombres =
                    textoValor;

                  return;
                }
              }
            );

            // ======================================================
            // FALLBACK DEL GRADO
            // Si la hoja se llama PRIMERO, SEGUNDO, etc.
            // ======================================================

            if (!student.grado) {
              student.grado =
                normalizarGrado(sheetName);
            }

            // ======================================================
            // VALIDAR QUE NO GUARDE FILAS QUE NO SON ESTUDIANTES
            // ======================================================

            if (
              hasValidData &&
              (
                student.nombres ||
                student.dni
              )
            ) {
              allStudents.push(student);
            }
          }
        });

        resolve(allStudents);
      } catch (error) {
        console.error(
          'Error procesando Excel:',
          error
        );

        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};