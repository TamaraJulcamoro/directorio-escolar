import * as XLSX from 'xlsx';

/**
 * Normaliza un texto: elimina tildes, caracteres especiales, espacios extra,
 * y convierte a mayúsculas, dejando solo letras, números y espacios.
 */
const normalizeText = (text) => {
  if (!text && text !== 0) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // quita tildes
    .replace(/[^a-zA-Z0-9\s]/g, ' ')          // solo letras, números y espacios
    .replace(/\s+/g, ' ')                     // espacios múltiples a uno
    .trim()
    .toUpperCase();
};

/**
 * Detecta la fila de encabezados en la hoja.
 */
const findHeaderRow = (rows) => {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const normalizedRow = row.map(cell => normalizeText(cell));
    const joined = normalizedRow.join(' ');
    // Busca palabras clave que deben estar en la fila de encabezados
    if (
      joined.includes('GRADO') &&
      joined.includes('SECCION') &&
      (joined.includes('DNI') || joined.includes('N DNI')) &&
      joined.includes('APELLIDOS Y NOMBRES DE LA ESTUDIANTE')
    ) {
      return i;
    }
  }
  return -1;
};

/**
 * Convierte un valor de celda a texto, manejando fechas.
 */
const cleanValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(value).trim();
};

/**
 * Normaliza el nombre del grado (Primero, Segundo, etc.)
 */
const normalizeGrade = (value, sheetName = '') => {
  const text = normalizeText(value || sheetName);
  const map = {
    '1': 'Primero',
    '1RO': 'Primero',
    'PRIMERO': 'Primero',
    '2': 'Segundo',
    '2DO': 'Segundo',
    'SEGUNDO': 'Segundo',
    '3': 'Tercero',
    '3RO': 'Tercero',
    'TERCERO': 'Tercero',
    '4': 'Cuarto',
    '4TO': 'Cuarto',
    'CUARTO': 'Cuarto',
    '5': 'Quinto',
    '5TO': 'Quinto',
    'QUINTO': 'Quinto',
    '6': 'Sexto',
    '6TO': 'Sexto',
    'SEXTO': 'Sexto'
  };
  return map[text] || cleanValue(value || sheetName);
};

/**
 * Valida si un valor es una sección válida (una sola letra mayúscula o número romano).
 */
const isValidSeccion = (value) => {
  if (!value) return false;
  const trimmed = String(value).trim();
  // Una sola letra mayúscula (A, B, C, ... Z)
  if (/^[A-Z]$/i.test(trimmed)) return true;
  // Números romanos simples (I, II, III, IV, V, VI, VII, VIII, IX, X)
  if (/^[IVXLCDM]+$/i.test(trimmed) && trimmed.length <= 4) return true;
  return false;
};

/**
 * Función principal para parsear el archivo Excel.
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const allStudents = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: ''
          });

          if (!rawRows.length) return;

          const headerRowIndex = findHeaderRow(rawRows);
          if (headerRowIndex === -1) {
            console.warn(`No se encontraron encabezados en la hoja: ${sheetName}`);
            return;
          }

          const headers = rawRows[headerRowIndex].map(cell => normalizeText(cell));

          // Procesar filas
          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.join('').trim() === '') continue;

            const student = {
              id: crypto.randomUUID(),
              hojaOrigen: sheetName,
              grado: '',
              seccion: '',
              nombres: '',
              fechaNacimiento: '',
              dni: '',
              domicilio: '',
              referencia: '',
              seguro: '',
              padreNombre: '',
              padreVive: '',
              padreDomicilio: '',
              padreCelular: '',
              madreNombre: '',
              madreVive: '',
              madreViveConEstudiante: '',
              madreCelular: '',
              madreDomicilio: '',
              quienEsApoderado: '',
              apoderadoNombre: '',
              apoderadoDomicilio: '',
              apoderadoParentesco: '',
              apoderadoCelular: ''
            };

            let hasValidData = false;

            headers.forEach((header, colIndex) => {
              const value = cleanValue(row[colIndex]);
              if (!value) return;

              hasValidData = true;

              // --- GRADO ---
              if (header.includes('GRADO')) {
                student.grado = normalizeGrade(value, sheetName);
              }
              // --- SECCION (con validación extra) ---
              else if (header.includes('SECCION')) {
                // Solo asignamos si el valor es una sección válida
                if (isValidSeccion(value)) {
                  student.seccion = value;
                } else {
                  // Si no es válido, lo dejamos vacío (o podríamos intentar limpiarlo)
                  student.seccion = '';
                }
              }
              // --- NOMBRES ESTUDIANTE ---
              else if (header.includes('APELLIDOS Y NOMBRES DE LA ESTUDIANTE')) {
                student.nombres = value;
              }
              // --- FECHA NACIMIENTO ---
              else if (header.includes('FECHA DE NACIMIENTO')) {
                student.fechaNacimiento = value;
              }
              // --- DNI ---
              else if (header.includes('DNI') || header.includes('N DNI')) {
                student.dni = value;
              }
              // --- DOMICILIO ESTUDIANTE ---
              else if (header.includes('DIRECCION DE DOMICILIO ACTUAL') && !header.includes('PADRE') && !header.includes('MADRE')) {
                student.domicilio = value;
              }
              // --- REFERENCIA ---
              else if (header.includes('REFERENCIA DEL DOMICILIO')) {
                student.referencia = value;
              }
              // --- SEGURO ---
              else if (header.includes('TIPO DE SEGURO')) {
                student.seguro = value;
              }

              // --- PADRE ---
              else if (header.includes('APELLIDOS Y NOMBRES DEL PADRE')) {
                student.padreNombre = value;
              }
              else if (header.includes('VIVE') && header.includes('PADRE') && !header.includes('CELULAR')) {
                student.padreVive = value;
              }
              else if (header.includes('DIRECCION DEL DOMICILIO ACTUAL') && header.includes('PADRE')) {
                student.padreDomicilio = value;
              }
              else if (header.includes('CELULAR') && header.includes('PADRE')) {
                student.padreCelular = value;
              }

              // --- MADRE ---
              else if (header.includes('APELLIDOS Y NOMBRES DE LA MADRE')) {
                student.madreNombre = value;
              }
              else if (header.includes('VIVE') && header.includes('MADRE') && !header.includes('CON LA ESTUDIANTE')) {
                student.madreVive = value;
              }
              else if (header.includes('VIVE CON LA ESTUDIANTE')) {
                student.madreViveConEstudiante = value;
              }
              else if (header.includes('DIRECCION DEL DOMICILIO ACTUAL') && header.includes('MADRE')) {
                student.madreDomicilio = value;
              }
              else if (header.includes('CELULAR') && header.includes('MADRE')) {
                student.madreCelular = value;
              }

              // --- APODERADO ---
              else if (header.includes('QUIEN ES EL APODERADO')) {
                student.quienEsApoderado = value;
              }
              else if (header.includes('APELLIDOS Y NOMBRES') && header.includes('APODERADO NO ES PAPA NI MAMA')) {
                student.apoderadoNombre = value;
              }
              else if (header.includes('DIRECCION ACTUAL') && header.includes('APODERADO')) {
                student.apoderadoDomicilio = value;
              }
              else if (header.includes('RELACION CON LA ESTUDIANTE')) {
                student.apoderadoParentesco = value;
              }
              else if (header.includes('CELULAR') && header.includes('APODERADO')) {
                student.apoderadoCelular = value;
              }
            });

            // Si el grado no se detectó, usar el nombre de la hoja
            if (!student.grado) {
              student.grado = normalizeGrade('', sheetName);
            }

            // Si la sección sigue vacía, intentar extraerla del nombre de la hoja o de otra columna
            if (!student.seccion) {
              // Opcional: si la hoja se llama "Primero A", "Primero B", etc., extraer la sección
              const sheetParts = sheetName.split(' ');
              if (sheetParts.length > 1 && isValidSeccion(sheetParts[sheetParts.length - 1])) {
                student.seccion = sheetParts[sheetParts.length - 1];
              }
              student.seccion = get(idxSeccion).trim().charAt(0);
            }

            if (hasValidData && (student.nombres || student.dni)) {
              allStudents.push(student);
            }
          }
        });

        console.log(`✅ ${allStudents.length} estudiantes procesados.`);
        resolve(allStudents);
      } catch (error) {
        console.error('❌ Error al procesar el Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};