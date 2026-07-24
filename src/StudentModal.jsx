import React from 'react';
import { X, User, Users, Shield, MapPin, Phone, HeartPulse } from 'lucide-react';

export default function StudentModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{student.nombres || 'Sin Nombre'}</h2>
            <p>{student.grado} - {student.seccion}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Estudiante Info */}
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
                <span className="label">Domicilio</span>
                <span className="value">{student.domicilio || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Referencia</span>
                <span className="value">{student.referencia || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">Seguro</span>
                <span className="value badge badge-primary" style={{ display: 'inline-block', width: 'fit-content' }}>
                  {student.seguro || 'Ninguno'}
                </span>
              </div>
            </div>
          </div>

          {/* Padre Info */}
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
              <div className="info-item">
                <span className="label">Celular</span>
                <span className="value">{student.padreCelular || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Domicilio</span>
                <span className="value">{student.padreDomicilio || '-'}</span>
              </div>
            </div>
          </div>

          {/* Madre Info */}
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
                <span className="label">Celular</span>
                <span className="value">{student.madreCelular || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Domicilio</span>
                <span className="value">{student.madreDomicilio || '-'}</span>
              </div>
            </div>
          </div>

          {/* Apoderado Info */}
          <div className="info-section">
            <h3><Shield size={18} className="icon" /> Datos del Apoderado</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">¿Quién es el apoderado?</span>
                <span className="value">{student.quienEsApoderado || '-'}</span>
              </div>
              <div className="info-item">
                <span className="label">Parentesco</span>
                <span className="value badge badge-secondary" style={{ display: 'inline-block', width: 'fit-content' }}>
                  {student.apoderadoParentesco || '-'}
                </span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Nombre del Apoderado Actual</span>
                <span className="value">{student.apoderadoNombre || '-'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">Celular del Apoderado</span>
                <span className="value">{student.apoderadoCelular || '-'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
