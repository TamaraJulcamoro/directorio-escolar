import * as XLSX from 'xlsx';

/**
 * Lee el archivo Excel y devuelve un array de estudiantes unificado.
 * Procesa todas las hojas que contengan datos.
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allStudents = [];

        // Iterar sobre cada hoja (PRIMERO, SEGUNDO, etc.)
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          // Leer como array de arrays (filas x columnas) sin usar la primera fila como llaves forzadas
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          
          if (rawRows.length > 0) {
            // 1. Encontrar la fila de encabezados verdaderos (buscando columnas clave)
            let headerRowIndex = -1;
            let headers = [];
            
            for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
              const row = rawRows[i];
              if (!row) continue;
              const rowString = row.join(' ').toUpperCase();
              
              // Buscamos algo que tenga DNI y NOMBRES/ESTUDIANTE para confirmar que es la fila de cabecera
              if (rowString.includes('DNI') && (rowString.includes('NOMBRE') || rowString.includes('ESTUDIANTE') || rowString.includes('OMBRE'))) {
                headerRowIndex = i;
                // Normalizar encabezados (quitar saltos de linea y espacios extra)
                headers = row.map(h => String(h || '').toUpperCase().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim());
                break;
              }
            }

            if (headerRowIndex !== -1 && headers.length > 0) {
              // 2. Procesar las filas de datos debajo de los encabezados
              for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
                const row = rawRows[i];
                // Si la fila está completamente vacía, saltar
                if (!row || row.join('').trim() === '') continue;
                
                const normalized = {
                  hojaOrigen: sheetName,
                  id: crypto.randomUUID()
                };
                
                let hasValidData = false;

                headers.forEach((header, index) => {
                  const value = row[index];
                  if (value === undefined || value === null || value === '') return;
                  
                  hasValidData = true;
                  const cleanKey = header;
                  
                  // Mapeo Inteligente y Tolerante a Fallos
                  if (cleanKey.includes('GRADO')) normalized.grado = value;
                  else if (cleanKey.includes('SECCI')) normalized.seccion = value;
                  else if (cleanKey === 'N° DNI' || cleanKey.includes('DNI')) normalized.dni = value;
                  else if (cleanKey.includes('NACIMIE')) normalized.fechaNacimiento = value;
                  else if (cleanKey.includes('DOMICILI') && !cleanKey.includes('PADRE') && !cleanKey.includes('MADRE')) normalized.domicilio = value;
                  else if (cleanKey.includes('REFERENCIA')) normalized.referencia = value;
                  else if (cleanKey.includes('SEGURO')) normalized.seguro = value;
                  
                  // Padre
                  else if (cleanKey.includes('PADRE')) {
                    if (cleanKey.includes('NOMBRE')) normalized.padreNombre = value;
                    else if (cleanKey.includes('VIVE')) normalized.padreVive = value;
                    else if (cleanKey.includes('CELULAR') || cleanKey.includes('ACELULAR')) normalized.padreCelular = value;
                    else if (cleanKey.includes('DOMICILIO')) normalized.padreDomicilio = value;
                  }
                  
                  // Madre
                  else if (cleanKey.includes('MADRE')) {
                    if (cleanKey.includes('NOMBRE')) normalized.madreNombre = value;
                    else if (cleanKey.includes('VIVE')) normalized.madreVive = value;
                    else if (cleanKey.includes('CELULAR') || cleanKey.includes('ACELULAR') || cleanKey.includes('ELULAR')) normalized.madreCelular = value;
                    else if (cleanKey.includes('DOMICILIO')) normalized.madreDomicilio = value;
                  }
                  
                  // Apoderado
                  else if (cleanKey.includes('QUIEN ES EL APO') || cleanKey.includes('QUI ES EL APODE')) normalized.quienEsApoderado = value;
                  else if (cleanKey.includes('APODERADO') && (cleanKey.includes('NOMBRE') || cleanKey.includes('ACTUAL'))) normalized.apoderadoNombre = value;
                  else if (cleanKey.includes('PARENTESCO') || cleanKey.includes('CON EL ESTUDI') || cleanKey.includes('CON LA ESTUDI')) normalized.apoderadoParentesco = value;
                  else if (cleanKey.includes('CELULAR') && cleanKey.includes('APODERADO')) normalized.apoderadoCelular = value;
                  
                  // Nombres del Estudiante (Si no es de padres o apoderado)
                  else if ((cleanKey.includes('NOMBRE') || cleanKey.includes('OMBRE')) && !cleanKey.includes('PADRE') && !cleanKey.includes('MADRE') && !cleanKey.includes('APODERADO')) {
                     normalized.nombres = value;
                  }
                });
                
                // Fallback: Si no encontró grado en las celdas, usar el nombre de la hoja (PRIMERO, SEGUNDO...)
                if (!normalized.grado) {
                  normalized.grado = sheetName;
                }
                
                // Si la fila tiene nombre o DNI la guardamos
                if (hasValidData && (normalized.nombres || normalized.dni)) {
                  allStudents.push(normalized);
                }
              }
            }
          }
        });

        resolve(allStudents);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
