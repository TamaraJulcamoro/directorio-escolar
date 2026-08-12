import * as XLSX from 'xlsx';

// ==========================================
// NORMALIZAR TEXTO
// ==========================================

const normalizarTexto = (texto) => {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

// ==========================================
// CONVERTIR VALORES DEL EXCEL A TEXTO
// ==========================================

const convertirValor = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('es-PE');
  }

  return String(value).trim();
};

// ==========================================
// PARSER DEL EXCEL
// ==========================================

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

        let allStudents = [];

        // ==========================================
        // RECORRER TODAS LAS HOJAS
        // ==========================================

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];

          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: ''
          });

          if (!rawRows || rawRows.length === 0) {
            return;
          }

          // ==========================================
          // BUSCAR ENCABEZADOS
          // ==========================================

          let headerRowIndex = -1;
          let headers = [];

          for (
            let i = 0;
            i < Math.min(rawRows.length, 30);
            i++
          ) {
            const row = rawRows[i];

            if (!row) continue;

            const rowString = row
              .map((cell) => normalizarTexto(cell))
              .join(' ');

            const tieneDNI = rowString.includes('DNI');

            const tieneNombre =
              rowString.includes('NOMBRE') ||
              rowString.includes('NOMBRES') ||
              rowString.includes('APELLIDO') ||
              rowString.includes('ESTUDIANTE');

            if (tieneDNI && tieneNombre) {
              headerRowIndex = i;

              headers = row.map((header) =>
                normalizarTexto(header)
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

          // ==========================================
          // RECORRER FILAS DE ESTUDIANTES
          // ==========================================

          for (
            let rowIndex = headerRowIndex + 1;
            rowIndex < rawRows.length;
            rowIndex++
          ) {
            const row = rawRows[rowIndex];

            if (!row) continue;

            const filaVacia = row.every(
              (celda) =>
                String(celda ?? '').trim() === ''
            );

            if (filaVacia) continue;

            // ==========================================
            // OBJETO ESTUDIANTE
            // ==========================================

            const student = {
              id:
                typeof crypto !== 'undefined' &&
                crypto.randomUUID
                  ? crypto.randomUUID()
                  : `${sheetName}-${rowIndex}-${Date.now()}`,

              hojaOrigen: sheetName,

              grado: '',
              seccion: '',
              nombres: '',
              dni: '',
              fechaNacimiento: '',

              // Datos del estudiante
              domicilio: '',
              referencia: '',
              seguro: '',

              // Padre
              padreNombre: '',
              padreVive: '',
              padreCelular: '',
              padreDomicilio: '',

              // Madre
              madreNombre: '',
              madreVive: '',
              madreCelular: '',
              madreDomicilio: '',

              // Apoderado
              quienEsApoderado: '',
              apoderadoNombre: '',
              apoderadoParentesco: '',
              apoderadoCelular: ''
            };

            let hasValidData = false;

            // ==========================================
            // LEER CADA COLUMNA
            // ==========================================

            headers.forEach((header, index) => {
              const value = row[index];

              if (
                value === undefined ||
                value === null ||
                String(value).trim() === ''
              ) {
                return;
              }

              hasValidData = true;

              const cleanKey = normalizarTexto(header);
              const cleanValue = convertirValor(value);

              // ========================================
              // GRADO
              // ========================================

              if (
                cleanKey === 'GRADO' ||
                cleanKey.includes('GRADO DE ESTUDIO') ||
                cleanKey.includes('NIVEL Y GRADO')
              ) {
                student.grado = cleanValue;
              }

              // ========================================
              // SECCIÓN
              // ========================================

              else if (
                cleanKey === 'SECCION' ||
                cleanKey.includes('SECCION')
              ) {
                student.seccion = cleanValue;
              }

              // ========================================
              // DNI
              // ========================================

              else if (
                cleanKey === 'DNI' ||
                cleanKey.includes('N° DNI') ||
                cleanKey.includes('Nº DNI') ||
                cleanKey.includes('NUMERO DE DNI') ||
                cleanKey.includes('DOCUMENTO DE IDENTIDAD')
              ) {
                student.dni = cleanValue;
              }

              // ========================================
              // FECHA DE NACIMIENTO
              // ========================================

              else if (
                cleanKey.includes('FECHA DE NACIMIENTO') ||
                cleanKey.includes('F NACIMIENTO') ||
                cleanKey.includes('NACIMIENTO')
              ) {
                student.fechaNacimiento = cleanValue;
              }

              // ========================================
              // DIRECCIÓN DEL ESTUDIANTE
              // ========================================
              //
              // IMPORTANTE:
              // Esto se evalúa ANTES de REFERENCIA.
              //
              // DIRECCIÓN DE DOMICILIO ACTUAL
              //      ↓
              // student.domicilio
              //
              // ========================================

              else if (
                cleanKey ===
                  'DIRECCION DE DOMICILIO ACTUAL' ||
                cleanKey.includes(
                  'DIRECCION DE DOMICILIO ACTUAL'
                ) ||
                cleanKey.includes('DOMICILIO ACTUAL')
              ) {
                student.domicilio = cleanValue;
              }

              // ========================================
              // DOMICILIO GENERAL DEL ESTUDIANTE
              // ========================================

              else if (
                cleanKey.includes('DOMICILIO') &&
                !cleanKey.includes('PADRE') &&
                !cleanKey.includes('MADRE') &&
                !cleanKey.includes('APODERADO')
              ) {
                student.domicilio = cleanValue;
              }

              // ========================================
              // REFERENCIA
              // ========================================

              else if (
                cleanKey === 'REFERENCIA' ||
                cleanKey.includes('REFERENCIA')
              ) {
                student.referencia = cleanValue;
              }

              // ========================================
              // SEGURO
              // ========================================

              else if (
                cleanKey === 'SEGURO' ||
                cleanKey.includes('SEGURO')
              ) {
                student.seguro = cleanValue;
              }

              // ========================================
              // PADRE
              // ========================================

              else if (
                cleanKey.includes('PADRE')
              ) {
                if (
                  cleanKey.includes('NOMBRE')
                ) {
                  student.padreNombre = cleanValue;
                }

                else if (
                  cleanKey.includes('VIVE')
                ) {
                  student.padreVive = cleanValue;
                }

                else if (
                  cleanKey.includes('CELULAR')
                ) {
                  student.padreCelular = cleanValue;
                }

                else if (
                  cleanKey.includes('DOMICILIO')
                ) {
                  student.padreDomicilio = cleanValue;
                }
              }

              // ========================================
              // MADRE
              // ========================================

              else if (
                cleanKey.includes('MADRE')
              ) {
                if (
                  cleanKey.includes('NOMBRE')
                ) {
                  student.madreNombre = cleanValue;
                }

                else if (
                  cleanKey.includes('VIVE')
                ) {
                  student.madreVive = cleanValue;
                }

                else if (
                  cleanKey.includes('CELULAR')
                ) {
                  student.madreCelular = cleanValue;
                }

                else if (
                  cleanKey.includes('DOMICILIO')
                ) {
                  student.madreDomicilio = cleanValue;
                }
              }

              // ========================================
              // QUIÉN ES EL APODERADO
              // ========================================

              else if (
                cleanKey.includes(
                  'QUIEN ES EL APODERADO'
                ) ||
                cleanKey.includes(
                  'QUIEN ES EL APO'
                )
              ) {
                student.quienEsApoderado = cleanValue;
              }

              // ========================================
              // NOMBRE DEL APODERADO
              // ========================================

              else if (
                cleanKey.includes('APODERADO') &&
                cleanKey.includes('NOMBRE')
              ) {
                student.apoderadoNombre = cleanValue;
              }

              // ========================================
              // PARENTESCO
              // ========================================

              else if (
                cleanKey.includes('PARENTESCO') ||
                cleanKey.includes(
                  'CON EL ESTUDIANTE'
                ) ||
                cleanKey.includes(
                  'CON LA ESTUDIANTE'
                )
              ) {
                student.apoderadoParentesco =
                  cleanValue;
              }

              // ========================================
              // CELULAR DEL APODERADO
              // ========================================

              else if (
                cleanKey.includes('CELULAR') &&
                cleanKey.includes('APODERADO')
              ) {
                student.apoderadoCelular =
                  cleanValue;
              }

              // ========================================
              // NOMBRES DEL ESTUDIANTE
              // ========================================

              else if (
                (
                  cleanKey.includes('NOMBRE') ||
                  cleanKey.includes('NOMBRES') ||
                  cleanKey.includes('APELLIDOS')
                ) &&
                !cleanKey.includes('PADRE') &&
                !cleanKey.includes('MADRE') &&
                !cleanKey.includes('APODERADO')
              ) {
                student.nombres = cleanValue;
              }
            });

            // ==========================================
            // SI NO HAY GRADO, USAR EL NOMBRE DE LA HOJA
            // ==========================================

            if (!student.grado) {
              student.grado = sheetName;
            }

            // ==========================================
            // GUARDAR ESTUDIANTE
            // ==========================================

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

        console.log(
          '✅ Estudiantes procesados:',
          allStudents.length
        );

        resolve(allStudents);

      } catch (error) {
        console.error(
          '❌ Error procesando Excel:',
          error
        );

        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error(
        '❌ Error leyendo archivo:',
        error
      );

      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};