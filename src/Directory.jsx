import React, { useState, useMemo } from 'react';
import { Search, Users, Phone, MessageCircle } from 'lucide-react';
import StudentModal from './StudentModal';
import { cleanPhoneNumber } from './utils/phoneUtils';

export default function Directory({ students }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [filterSeccion, setFilterSeccion] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [contactPopup, setContactPopup] = useState(null); // { phone, display }

  // ==========================================
  // ORDEN CORRECTO DE LOS GRADOS
  // ==========================================

  const gradeOrder = [
    'Primero',
    'Segundo',
    'Tercero',
    'Cuarto',
    'Quinto',
    'Sexto'
  ];

  // ==========================================
  // GRADOS
  // ==========================================

  const grados = useMemo(() => {
    const encontrados = [
      ...new Set(
        students
          .map((student) =>
            String(student.grado || '').trim()
          )
          .filter(Boolean)
      )
    ];

    return encontrados.sort((a, b) => {
      const indexA = gradeOrder.findIndex(
        (grade) =>
          grade.toLowerCase() ===
          a.toLowerCase()
      );

      const indexB = gradeOrder.findIndex(
        (grade) =>
          grade.toLowerCase() ===
          b.toLowerCase()
      );

      if (
        indexA !== -1 &&
        indexB !== -1
      ) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;

      if (indexB !== -1) return 1;

      return a.localeCompare(b, 'es');
    });
  }, [students]);

  // ==========================================
  // SECCIONES
  // ==========================================

  const secciones = useMemo(() => {
    const lista = [
      ...new Set(
        students
          .map((student) =>
            String(
              student.seccion || ''
            ).trim()
          )
          .filter(Boolean)
      )
    ];

    return lista.sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }, [students]);

  // ==========================================
  // FILTRAR ESTUDIANTES
  // ==========================================

  const filteredStudents = useMemo(() => {
    const textoBusqueda =
      searchTerm.toLowerCase().trim();

    return students.filter((student) => {
      const nombres = String(
        student.nombres || ''
      ).toLowerCase();

      const dni = String(
        student.dni || ''
      );

      const matchName =
        nombres.includes(textoBusqueda);

      const matchDNI =
        dni.includes(textoBusqueda);

      const matchSearch =
        !textoBusqueda ||
        matchName ||
        matchDNI;

      const matchGrado =
        filterGrado
          ? student.grado === filterGrado
          : true;

      const matchSeccion =
        filterSeccion
          ? student.seccion === filterSeccion
          : true;

      return (
        matchSearch &&
        matchGrado &&
        matchSeccion
      );
    });
  }, [
    students,
    searchTerm,
    filterGrado,
    filterSeccion
  ]);

  // ==========================================
  // MANEJADORES DEL POPUP DE CONTACTO
  // ==========================================

  const closePopup = () => setContactPopup(null);

  const handleCall = () => {
    if (contactPopup?.phone) {
      window.location.href = `tel:${contactPopup.phone}`;
      closePopup();
    }
  };

  const handleWhatsApp = () => {
    if (contactPopup?.phone) {
      const waNumber = contactPopup.phone.replace('+', '');
      window.open(`https://wa.me/${waNumber}`, '_blank');
      closePopup();
    }
  };

  // ==========================================
  // RENDERIZAR ENLACE TELEFÓNICO
  // ==========================================

  const renderPhoneLink = (phone) => {
    if (!phone) return <span>-</span>;
    const display = phone;
    const cleaned = cleanPhoneNumber(phone);
    return (
      <span
        className="phone-link"
        onClick={(e) => {
          e.stopPropagation();
          setContactPopup({ phone: cleaned, display });
        }}
      >
        {display}
      </span>
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>

      {/* ========================================
          INSTRUCCIONES PARA LLAMAR/WHATSAPP
      ======================================== */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          color: 'var(--color-primary-hover)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 500
        }}
      >
        <span>📞</span>
        <span>
          <strong>Los números de teléfono son enlaces.</strong> Toca cualquier número para elegir entre{' '}
          <strong>llamar</strong> o <strong>enviar mensaje por WhatsApp</strong>.
        </span>
      </div>

      {/* ========================================
          CONTROLES
      ======================================== */}

      <div className="controls-bar">

        <div className="search-input-wrapper">

          <Search className="search-icon" />

          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

        </div>

        {/* GRADOS */}

        <select
          className="select-input"
          value={filterGrado}
          onChange={(e) =>
            setFilterGrado(e.target.value)
          }
        >
          <option value="">
            Todos los Grados
          </option>

          {grados.map((grado) => (
            <option
              key={grado}
              value={grado}
            >
              {grado}
            </option>
          ))}
        </select>

        {/* SECCIONES */}

        <select
          className="select-input"
          value={filterSeccion}
          onChange={(e) =>
            setFilterSeccion(e.target.value)
          }
        >
          <option value="">
            Todas las Secciones
          </option>

          {secciones.map((seccion) => (
            <option
              key={seccion}
              value={seccion}
            >
              {seccion}
            </option>
          ))}
        </select>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem'
          }}
        >
          Mostrando {filteredStudents.length}{' '}
          estudiantes
        </div>

      </div>

      {/* ========================================
          AVISO TIP (para ficha)
      ======================================== */}

      <div
        style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor:
            'rgba(14, 165, 233, 0.1)',
          color:
            'var(--color-primary-hover)',
          borderRadius:
            'var(--radius-md)',
          border:
            '1px solid rgba(14, 165, 233, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 500
        }}
      >
        👉

        <span>
          <strong>Tip:</strong> Haz clic
          sobre cualquier estudiante
          para ver su ficha completa.
        </span>

      </div>

      {/* ========================================
          VISTA PC
      ======================================== */}

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

              {filteredStudents.map(
                (student) => (

                  <tr
                    key={student.id}
                    onClick={() =>
                      setSelectedStudent(student)
                    }
                  >

                    <td>
                      <span className="badge badge-primary">
                        {student.grado || '-'}
                      </span>
                    </td>

                    <td>
                      {student.seccion || '-'}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                        color:
                          'var(--color-dark)'
                      }}
                    >
                      {student.nombres || '-'}
                    </td>

                    <td>
                      {student.dni || '-'}
                    </td>

                    <td>
                      {student.apoderadoNombre ||
                        student.quienEsApoderado ||
                        '-'}
                    </td>

                    <td>
                      {renderPhoneLink(
                        student.apoderadoCelular ||
                        student.madreCelular ||
                        student.padreCelular
                      )}
                    </td>

                    <td>

                      <button
                        className="mobile-card-button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setSelectedStudent(
                            student
                          );
                        }}
                      >
                        Ver Ficha 👀
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        ) : (

          <div className="empty-state">

            <Users className="icon" />

            <h3>
              No hay resultados
            </h3>

            <p>
              No se encontraron
              estudiantes que coincidan
              con la búsqueda.
            </p>

          </div>

        )}

      </div>

      {/* ========================================
          VISTA CELULAR
      ======================================== */}

      <div className="mobile-directory">

        {filteredStudents.length > 0 ? (

          <div className="student-cards">

            {filteredStudents.map(
              (student) => (

                <div
                  className="student-card"
                  key={student.id}
                  onClick={() =>
                    setSelectedStudent(student)
                  }
                >

                  <div className="student-card-header">

                    <div className="student-card-name">
                      {student.nombres ||
                        'Sin nombre'}
                    </div>

                    {/* MOSTRAMOS SECCIÓN, NO GRADO */}
                    <span className="badge badge-primary">
                      {student.seccion || '-'}
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
                      <span className="student-label">Celular</span>
                      <strong>
                        {renderPhoneLink(
                          student.apoderadoCelular ||
                          student.madreCelular ||
                          student.padreCelular
                        )}
                      </strong>
                    </div>

                  </div>

                  <button
                    className="student-view-button"
                    onClick={(e) => {
                      e.stopPropagation();

                      setSelectedStudent(
                        student
                      );
                    }}
                  >
                    Ver ficha completa →
                  </button>

                </div>

              )
            )}

          </div>

        ) : (

          <div className="empty-state">

            <Users className="icon" />

            <h3>
              No hay resultados
            </h3>

            <p>
              No se encontraron
              estudiantes.
            </p>

          </div>

        )}

      </div>

      {/* ========================================
          MODAL
      ======================================== */}

      {selectedStudent && (

        <StudentModal
          student={selectedStudent}
          onClose={() =>
            setSelectedStudent(null)
          }
        />

      )}

      {/* ========================================
          POPUP DE CONTACTO (Llamar / WhatsApp)
      ======================================== */}

      {contactPopup && (
        <div
          className="contact-popup-overlay"
          onClick={closePopup}
        >
          <div
            className="contact-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-dark)' }}>
              {contactPopup.display}
            </h4>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="contact-popup-btn call"
                onClick={handleCall}
              >
                <Phone size={20} /> Llamar
              </button>
              <button
                className="contact-popup-btn whatsapp"
                onClick={handleWhatsApp}
              >
                <MessageCircle size={20} /> WhatsApp
              </button>
            </div>
            <button
              className="contact-popup-close"
              onClick={closePopup}
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}