import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({ onFileSelect, currentCount }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndPassFile(file);
    }
  }, [onFileSelect]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndPassFile(file);
    }
  };

  const validateAndPassFile = (file) => {
    // Verificar que sea excel o csv
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    // Si la extension es xlsx, xls, csv lo aceptamos también por si el MIME type falla en windows
    const isValidExt = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');

    if (validTypes.includes(file.type) || isValidExt) {
      onFileSelect(file);
    } else {
      alert("Por favor, sube un archivo Excel válido (.xlsx o .xls)");
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-dark)', marginBottom: '0.5rem' }}>
          {currentCount > 0 ? '🔄 Actualizar Directorio' : '📂 Subir Directorio'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {currentCount > 0
            ? `Actualmente hay ${currentCount} estudiantes. Sube el nuevo Excel para reemplazarlos.`
            : 'Sube el archivo Excel con los datos de los estudiantes del colegio.'}
        </p>
      </div>

      <label
        className={`upload-area ${isDragging ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="hidden-input" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleChange} 
        />
        <UploadCloud className="upload-icon" style={{ width: '64px', height: '64px' }} />
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Haz clic aquí para buscar el archivo</h3>
          <p style={{ fontSize: '1.1rem' }}>O arrastra el documento del colegio hacia este cuadro</p>
          <div style={{ marginTop: '1.5rem' }}>
            <span style={{ 
              display: 'inline-block', 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              padding: '0.75rem 2rem', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 600,
              fontSize: '1.1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              Seleccionar Archivo de mi PC
            </span>
          </div>
        </div>
      </label>
    </div>
  );
}
