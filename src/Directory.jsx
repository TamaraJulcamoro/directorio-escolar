import React, { useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import StudentModal from './StudentModal';

export default function Directory({ students }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [filterSeccion, setFilterSeccion] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Extraer valores únicos para los filtros
  const grados = useMemo(() => {
    return [...new Set(students.map(s => s.grado).filter(Boolean))].sort();
  }, [students]);

  const secciones = useMemo(() => {
    return [...new Set(students.map(s => s.seccion).filter(Boolean))].sort();
  }, [students]);

  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchName = (student.nombres || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDNI = (student.dni || '').toString().includes(searchTerm);
      const matchSearch = matchName || matchDNI;

      const matchGrado = filterGrado ? student.grado === filterGrado : true;
      const matchSeccion = filterSeccion ? student.seccion === filterSeccion : true;

      return matchSearch && matchGrado && matchSeccion;
    });
  }, [students, searchTerm, filterGrado, filterSeccion]);

  return (
    <div>
      <div className="controls-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nombre o DNI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="select-input"
          value={filterGrado}
          onChange={(e) => setFilterGrado(e.target.value)}
        >
          <option value="">Todos los Grados</option>
          {grados.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select 
          className="select-input"
          value={filterSeccion}
          onChange={(e) => setFilterSeccion(e.target.value)}
        >
          <option value="">Todas las Secciones</option>
          {secciones.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Mostrando {filteredStudents.length} estudiantes
        </div>
      </div>

      <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--color-primary-hover)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
        👉 <span><strong>Tip:</strong> Haz clic sobre cualquier estudiante de la tabla para ver su ficha completa (Teléfonos, datos de los Padres, Dirección, etc.).</span>
      </div>

    {/* VISTA PC */}
<div className="table-container desktop-directory">
  {filteredStudents.length > 0 ? (
    <table>
      <thead>
        <tr>
          <th>Grado</th>
          <th>Sección</th>
          <th>Apellidos y Nombres</th>
          <th>DNI</th>
          <th>Apoderado</th>
          <th>Celular Principal</th>
          <th>Acción</th>
        </tr>
      </thead>

      <tbody>
        {filteredStudents.map((student) => (
          <tr
            key={student.id}
            onClick={() => setSelectedStudent(student)}
          >
            <td>
              <span className="badge badge-primary">
                {student.grado || '-'}
              </span>
            </td>

            <td>{student.seccion || '-'}</td>

            <td style={{
              fontWeight: 500,
              color: 'var(--color-dark)'
            }}>
              {student.nombres || '-'}
            </td>

            <td>{student.dni || '-'}</td>

            <td>
              {student.apoderadoNombre ||
                student.quienEsApoderado ||
                '-'}
            </td>

            <td>
              {student.apoderadoCelular ||
                student.madreCelular ||
                student.padreCelular ||
                '-'}
            </td>

            <td>
              <button
                className="mobile-card-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudent(student);
                }}
              >
                Ver Ficha 👀
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="empty-state">
      <Users className="icon" />
      <h3>No hay resultados</h3>
      <p>
        No se encontraron estudiantes que coincidan con la búsqueda.
      </p>
    </div>
  )}
</div>


{/* VISTA CELULAR */}
<div className="mobile-directory">
  {filteredStudents.length > 0 ? (
    <div className="student-cards">

      {filteredStudents.map((student) => (
        <div
          className="student-card"
          key={student.id}
          onClick={() => setSelectedStudent(student)}
        >

          <div className="student-card-header">

            <div className="student-card-name">
              {student.nombres || 'Sin nombre'}
            </div>

            <span className="badge badge-primary">
              {student.grado || '-'}
            </span>

          </div>

          <div className="student-card-info">

            <div>
              <span className="student-label">
                Sección
              </span>

              <strong>
                {student.seccion || '-'}
              </strong>
            </div>

            <div>
              <span className="student-label">
                DNI
              </span>

              <strong>
                {student.dni || '-'}
              </strong>
            </div>

            <div className="student-card-full">
              <span className="student-label">
                Apoderado
              </span>

              <strong>
                {student.apoderadoNombre ||
                  student.quienEsApoderado ||
                  '-'}
              </strong>
            </div>

            <div className="student-card-full">
              <span className="student-label">
                Celular
              </span>

              <strong>
                {student.apoderadoCelular ||
                  student.madreCelular ||
                  student.padreCelular ||
                  '-'}
              </strong>
            </div>

          </div>

          <button
            className="student-view-button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
            }}
          >
            Ver ficha completa →
          </button>

        </div>
      ))}

    </div>
  ) : (
    <div className="empty-state">
      <Users className="icon" />
      <h3>No hay resultados</h3>
      <p>
        No se encontraron estudiantes.
      </p>
    </div>
  )}
</div>

      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
}
