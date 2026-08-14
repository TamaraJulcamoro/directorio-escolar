import React from 'react';
import {
  X,
  User,
  Users,
  Shield,
  Phone,
  MessageCircle
} from 'lucide-react';
import { cleanPhoneNumber } from './utils/phoneUtils';

export default function StudentModal({ student, onClose }) {
  if (!student) return null;

  // Función para renderizar un número con dos botones
  const renderPhoneWithButtons = (phone, label) => {
    if (!phone) return <span>-</span>;
    const cleaned = cleanPhoneNumber(phone);
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>{phone}</span>
        <button
          className="contact-popup-btn call"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          onClick={() => window.location.href = `tel:${cleaned}`}
        >
          <Phone size={14} /> Llamar
        </button>
        <button
          className="contact-popup-btn whatsapp"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          onClick={() => window.open(`https://wa.me/${cleaned.replace('+', '')}`, '_blank')}
        >
          <MessageCircle size={14} /> WhatsApp
        </button>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* ================= HEADER ================= */}

        <div className="modal-header">
          <div>
            <h2>{student.nombres || 'Sin Nombre'}</h2>
            <p>{student.grado || '-'} - {student.seccion || '-'}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">

          {/* Instrucción */}
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
            📞 Para llamar o enviar mensaje por WhatsApp, usa los botones junto a cada número.
          </div>

          {/* ================================================= */}
          {/* DATOS DEL ESTUDIANTE */}
          {/* ================================================= */}

          <div className="info-section">
            <h3><User size={18} className="icon" /> Datos del Estudiante</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">DNI</span>
                <span className="value">{student.dni || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">F. Nacimiento</span>
                <span className="value">{student.fechaNacimiento || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Dirección de domicilio actual</span>
                <span className="value">{student.domicilio || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Referencia del domicilio</span>
                <span className="value">{student.referencia || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">Tipo de seguro</span>
                <span className="value badge badge-primary" style={{ display: 'inline-block', width: 'fit-content' }}>
                  {student.seguro || 'Ninguno'}
                </span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* DATOS DEL PADRE */}
          {/* ================================================= */}

          <div className="info-section">
            <h3><Users size={18} className="icon" /> Datos del Padre</h3>
            <div className="info-grid">
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Nombre</span>
                <span className="value">{student.padreNombre || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">¿Vive?</span>
                <span className="value">{student.padreVive || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Celular</span>
                <span className="value">{renderPhoneWithButtons(student.padreCelular, 'Padre')}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Dirección del domicilio actual</span>
                <span className="value">{student.padreDomicilio || '-'}</span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* DATOS DE LA MADRE */}
          {/* ================================================= */}

          <div className="info-section">
            <h3><Users size={18} className="icon" /> Datos de la Madre</h3>
            <div className="info-grid">
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Nombre</span>
                <span className="value">{student.madreNombre || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">¿Vive?</span>
                <span className="value">{student.madreVive || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">¿Vive con la estudiante?</span>
                <span className="value">{student.madreViveConEstudiante || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Celular</span>
                <span className="value">{renderPhoneWithButtons(student.madreCelular, 'Madre')}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Dirección del domicilio actual</span>
                <span className="value">{student.madreDomicilio || '-'}</span>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* DATOS DEL APODERADO */}
          {/* ================================================= */}

          <div className="info-section">
            <h3><Shield size={18} className="icon" /> Datos del Apoderado</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">¿Quién es el apoderado?</span>
                <span className="value">{student.quienEsApoderado || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">Relación con la estudiante</span>
                <span className="value badge badge-secondary" style={{ display: 'inline-block', width: 'fit-content' }}>
                  {student.apoderadoParentesco || '-'}
                </span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Nombre del Apoderado Actual</span>
                <span className="value">{student.apoderadoNombre || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Dirección actual del apoderado</span>
                <span className="value">{student.apoderadoDomicilio || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Celular del Apoderado</span>
                <span className="value">{renderPhoneWithButtons(student.apoderadoCelular, 'Apoderado')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}