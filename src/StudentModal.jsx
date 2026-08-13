import React from 'react';
import {
  X,
  User,
  Users,
  Shield
} from 'lucide-react';
import { cleanPhoneNumber } from '../utils/phoneUtils';

export default function StudentModal({
  student,
  onClose
}) {
  if (!student) return null;

  // Función para renderizar un enlace telefónico
  const renderPhoneLink = (phone) => {
    if (!phone) return <span>-</span>;
    const cleaned = cleanPhoneNumber(phone);
    return (
      <a
        href={`tel:${cleaned}`}
        className="phone-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {phone}
      </a>
    );
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ================= HEADER ================= */}

        <div className="modal-header">

          <div>
            <h2>
              {student.nombres || 'Sin Nombre'}
            </h2>

            <p>
              {student.grado || '-'}
              {' - '}
              {student.seccion || '-'}
            </p>
          </div>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>


        <div className="modal-body">

          {/* ================================================= */}
          {/* DATOS DEL ESTUDIANTE */}
          {/* ================================================= */}

          <div className="info-section">

            <h3>
              <User
                size={18}
                className="icon"
              />

              Datos del Estudiante
            </h3>

            <div className="info-grid">

              <div className="info-item">
                <span className="label">
                  DNI
                </span>

                <span className="value">
                  {student.dni || '-'}
                </span>
              </div>


              <div className="info-item">
                <span className="label">
                  F. Nacimiento
                </span>

                <span className="value">
                  {student.fechaNacimiento || '-'}
                </span>
              </div>


              {/* DIRECCIÓN DEL ESTUDIANTE */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Dirección de domicilio actual
                </span>

                <span className="value">
                  {student.domicilio || '-'}
                </span>
              </div>


              {/* REFERENCIA */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Referencia del domicilio
                </span>

                <span className="value">
                  {student.referencia || '-'}
                </span>
              </div>


              {/* SEGURO */}

              <div className="info-item">

                <span className="label">
                  Tipo de seguro
                </span>

                <span
                  className="value badge badge-primary"
                  style={{
                    display: 'inline-block',
                    width: 'fit-content'
                  }}
                >
                  {student.seguro || 'Ninguno'}
                </span>

              </div>

            </div>
          </div>


          {/* ================================================= */}
          {/* DATOS DEL PADRE */}
          {/* ================================================= */}

          <div className="info-section">

            <h3>
              <Users
                size={18}
                className="icon"
              />

              Datos del Padre
            </h3>

            <div className="info-grid">

              {/* NOMBRE */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Nombre
                </span>

                <span className="value">
                  {student.padreNombre || '-'}
                </span>
              </div>


              {/* VIVE */}

              <div className="info-item">

                <span className="label">
                  ¿Vive?
                </span>

                <span className="value">
                  {student.padreVive || '-'}
                </span>

              </div>


              {/* CELULAR */}

              <div className="info-item">

                <span className="label">
                  Celular
                </span>

                <span className="value">
                  {renderPhoneLink(student.padreCelular)}
                </span>

              </div>


              {/* DIRECCIÓN PADRE */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Dirección del domicilio actual
                </span>

                <span className="value">
                  {student.padreDomicilio || '-'}
                </span>
              </div>

            </div>
          </div>


          {/* ================================================= */}
          {/* DATOS DE LA MADRE */}
          {/* ================================================= */}

          <div className="info-section">

            <h3>
              <Users
                size={18}
                className="icon"
              />

              Datos de la Madre
            </h3>

            <div className="info-grid">

              {/* NOMBRE */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Nombre
                </span>

                <span className="value">
                  {student.madreNombre || '-'}
                </span>
              </div>


              {/* VIVE */}

              <div className="info-item">

                <span className="label">
                  ¿Vive?
                </span>

                <span className="value">
                  {student.madreVive || '-'}
                </span>

              </div>


              {/* VIVE CON ESTUDIANTE */}

              <div className="info-item">

                <span className="label">
                  ¿Vive con la estudiante?
                </span>

                <span className="value">
                  {student.madreViveConEstudiante || '-'}
                </span>

              </div>


              {/* CELULAR */}

              <div className="info-item">

                <span className="label">
                  Celular
                </span>

                <span className="value">
                  {renderPhoneLink(student.madreCelular)}
                </span>

              </div>


              {/* DIRECCIÓN MADRE */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Dirección del domicilio actual
                </span>

                <span className="value">
                  {student.madreDomicilio || '-'}
                </span>
              </div>

            </div>
          </div>


          {/* ================================================= */}
          {/* DATOS DEL APODERADO */}
          {/* ================================================= */}

          <div className="info-section">

            <h3>
              <Shield
                size={18}
                className="icon"
              />

              Datos del Apoderado
            </h3>

            <div className="info-grid">

              {/* QUIÉN ES */}

              <div className="info-item">

                <span className="label">
                  ¿Quién es el apoderado?
                </span>

                <span className="value">
                  {student.quienEsApoderado || '-'}
                </span>

              </div>


              {/* PARENTESCO */}

              <div className="info-item">

                <span className="label">
                  Relación con la estudiante
                </span>

                <span
                  className="value badge badge-secondary"
                  style={{
                    display: 'inline-block',
                    width: 'fit-content'
                  }}
                >
                  {student.apoderadoParentesco || '-'}
                </span>

              </div>


              {/* NOMBRE APODERADO */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Nombre del Apoderado Actual
                </span>

                <span className="value">
                  {student.apoderadoNombre || '-'}
                </span>
              </div>


              {/* DIRECCIÓN APODERADO */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Dirección actual del apoderado
                </span>

                <span className="value">
                  {student.apoderadoDomicilio || '-'}
                </span>
              </div>


              {/* CELULAR */}

              <div
                className="info-item"
                style={{
                  gridColumn: '1 / -1'
                }}
              >
                <span className="label">
                  Celular del Apoderado
                </span>

                <span className="value">
                  {renderPhoneLink(student.apoderadoCelular)}
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}