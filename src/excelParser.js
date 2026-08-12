import * as XLSX from 'xlsx';

/**
 * Lee el Excel y convierte cada fila en un estudiante.
 * Mantiene por separado:
 * - Dirección del estudiante
 * - Referencia
 * - Dirección del padre
 * - Dirección de la madre
 * - Dirección del apoderado
 */
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

        // Normalizar texto de encabezados
        const normalizeHeader = (value) => {
          return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
        };

        // Convertir valores del Excel a texto
        const cleanValue = (value) => {
          if (value === null || value === undefined || value === '') {
            return '';
          }

          if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, '0');
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const year = value.getFullYear();

            return `${day}/${month}/${year}`;
          }

          return String(value).trim();
        };

        // Normalizar nombres de grado
        const normalizeGrade = (value, sheetName = '') => {
          const text = cleanValue(value || sheetName)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase();

          const grades = {
            '1': 'Primero',
            '1RO': 'Primero',
            '1RO.': 'Primero',
            'PRIMERO': 'Primero',

            '2': 'Segundo',
            '2DO': 'Segundo',
            '2DO.': 'Segundo',
            'SEGUNDO': 'Segundo',

            '3': 'Tercero',
            '3RO': 'Tercero',
            '3RO.': 'Tercero',
            'TERCERO': 'Tercero',

            '4': 'Cuarto',
            '4TO': 'Cuarto',
            '4TO.': 'Cuarto',
            'CUARTO': 'Cuarto',

            '5': 'Quinto',
            '5TO': 'Quinto',
            '5TO.': 'Quinto',
            'QUINTO': 'Quinto',

            '6': 'Sexto',
            '6TO': 'Sexto',
            '6TO.': 'Sexto',
            'SEXTO': 'Sexto'
          };

          return grades[text] || cleanValue(value || sheetName);
        };

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];

          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: ''
          });

          if (!rawRows.length) return;

          // Buscar la verdadera fila de encabezados
          let headerRowIndex = -1;
          let headers = [];

          for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
            const row = rawRows[i];

            if (!row || !row.length) continue;

            const normalizedRow = row.map(normalizeHeader);

            const tieneGrado = normalizedRow.some(
              h => h === 'GRADO'
            );

            const tieneSeccion = normalizedRow.some(
              h => h === 'SECCION'
            );

            const tieneDni = normalizedRow.some(
              h => h.includes('DNI')
            );

            const tieneNombre = normalizedRow.some(
              h =>
                h.includes('APELLIDOS Y') &&
                h.includes('NOMBRES')
            );

            if (
              tieneGrado &&
              tieneSeccion &&
              tieneDni &&
              tieneNombre
            ) {
              headerRowIndex = i;
              headers = normalizedRow;
              break;
            }
          }

          if (headerRowIndex === -1) {
            console.warn(
              `No se encontró encabezado válido en la hoja: ${sheetName}`
            );
            return;
          }

          // Procesar filas
          for (
            let rowIndex = headerRowIndex + 1;
            rowIndex < rawRows.length;
            rowIndex++
          ) {
            const row = rawRows[rowIndex];

            if (!row || row.join('').trim() === '') {
              continue;
            }

            const student = {
              id: crypto.randomUUID(),
              hojaOrigen: sheetName,

              grado: '',
              seccion: '',
              nombres: '',
              fechaNacimiento: '',
              dni: '',

              // ESTUDIANTE
              domicilio: '',
              referencia: '',
              seguro: '',

              // PADRE
              padreNombre: '',
              padreVive: '',
              padreDomicilio: '',
              padreCelular: '',

              // MADRE
              madreNombre: '',
              madreVive: '',
              madreViveConEstudiante: '',
              madreCelular: '',
              madreDomicilio: '',

              // APODERADO
              quienEsApoderado: '',
              apoderadoNombre: '',
              apoderadoDomicilio: '',
              apoderadoParentesco: '',
              apoderadoCelular: ''
            };

            let hasValidData = false;

            headers.forEach((header, index) => {
              const value = cleanValue(row[index]);

              if (!value) return;

              hasValidData = true;

              // =========================
              // DATOS DEL ESTUDIANTE
              // =========================

              if (header === 'GRADO') {
                student.grado = normalizeGrade(value, sheetName);
              }

              else if (header === 'SECCION') {
                student.seccion = value;
              }

              else if (
                header.includes(
                  'APELLIDOS Y NOMBRES DE LA ESTUDIANTE'
                )
              ) {
                student.nombres = value;
              }

              else if (
                header.includes('FECHA DE NACIMIENTO')
              ) {
                student.fechaNacimiento = value;
              }

              else if (
                header === 'N DNI' ||
                header.includes('DNI')
              ) {
                student.dni = value;
              }

              // =========================
              // DOMICILIO DEL ESTUDIANTE
              // =========================

              else if (
                header === 'DIRECCION DE DOMICILIO ACTUAL'
              ) {
                student.domicilio = value;
              }

              // =========================
              // REFERENCIA
              // =========================

              else if (
                header === 'REFERENCIA DEL DOMICILIO'
              ) {
                student.referencia = value;
              }

              // =========================
              // SEGURO
              // =========================

              else if (
                header === 'TIPO DE SEGURO'
              ) {
                student.seguro = value;
              }

              // =========================
              // PADRE
              // =========================

              else if (
                header.includes(
                  'APELLIDOS Y NOMBRES DEL PADRE'
                )
              ) {
                student.padreNombre = value;
              }

              else if (
                header === 'VIVE? (PADRE)' ||
                header.includes('VIVE') &&
                header.includes('PADRE')
              ) {
                student.padreVive = value;
              }

              else if (
                header ===
                'DIRECCION DEL DOMICILIO ACTUAL (PADRE)'
              ) {
                student.padreDomicilio = value;
              }

              else if (
                header.includes('N CELULAR') &&
                header.includes('PADRE')
              ) {
                student.padreCelular = value;
              }

              // =========================
              // MADRE
              // =========================

              else if (
                header.includes(
                  'APELLIDOS Y NOMBRES DE LA MADRE'
                )
              ) {
                student.madreNombre = value;
              }

              else if (
                header === 'VIVE? (MADRE)' ||
                (
                  header.includes('VIVE') &&
                  header.includes('MADRE') &&
                  !header.includes('CON LA ESTUDIANTE')
                )
              ) {
                student.madreVive = value;
              }

              else if (
                header.includes(
                  'VIVE CON LA ESTUDIANTE'
                )
              ) {
                student.madreViveConEstudiante = value;
              }

              else if (
                header.includes('N CELULAR') &&
                header.includes('MADRE')
              ) {
                student.madreCelular = value;
              }

              else if (
                header ===
                'DIRECCION DEL DOMICILIO ACTUAL (MADRE)'
              ) {
                student.madreDomicilio = value;
              }

              // =========================
              // APODERADO
              // =========================

              else if (
                header === 'QUIEN ES EL APODERADO?'
              ) {
                student.quienEsApoderado = value;
              }

              else if (
                header.includes(
                  'APELLIDOS Y NOMBRES (SI EL APODERADO NO ES PAPA NI MAMA)'
                )
              ) {
                student.apoderadoNombre = value;
              }

              else if (
                header ===
                'DIRECCION ACTUAL (APODERADO)'
              ) {
                student.apoderadoDomicilio = value;
              }

              else if (
                header === 'RELACION CON LA ESTUDIANTE'
              ) {
                student.apoderadoParentesco = value;
              }

              else if (
                header.includes('N CELULAR') &&
                header.includes('APODERADO')
              ) {
                student.apoderadoCelular = value;
              }
            });

            // Si el grado no estaba en la fila,
            // usamos el nombre de la hoja.
            if (!student.grado) {
              student.grado = normalizeGrade('', sheetName);
            }

            // Guardar solamente filas que realmente
            // correspondan a estudiantes.
            if (
              hasValidData &&
              (student.nombres || student.dni)
            ) {
              allStudents.push(student);
            }
          }
        });

        console.log(
          '✅ Estudiantes procesados:',
          allStudents.length
        );

        console.log(
          '📍 Ejemplo de estudiante:',
          allStudents[0]
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
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};