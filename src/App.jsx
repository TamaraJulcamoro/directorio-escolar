import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, LogIn, LogOut, CloudUpload } from 'lucide-react';
import FileUpload from './FileUpload';
import Directory from './Directory';
import { parseExcelFile } from './excelParser';
import { supabase, BUCKET_NAME, FILE_NAME } from './supabaseClient';

const ADMIN_PASSWORD = 'admin2026';

function App() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('public'); // 'public', 'login', 'admin'
  const [passwordInput, setPasswordInput] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Al iniciar la app, cargar el directorio desde Supabase
  useEffect(() => {
    loadDirectoryFromCloud();
  }, []);

  const loadDirectoryFromCloud = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Descargar el archivo Excel desde Supabase Storage
      const { data, error: downloadError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(FILE_NAME);

      if (downloadError) {
        // Si no existe aún el archivo, mostrar estado vacío (sin error)
        if (downloadError.message?.includes('Not Found') || downloadError.message?.includes('Object not found')) {
          setStudents([]);
        } else {
          throw downloadError;
        }
      } else {
        // Parsear el archivo Excel descargado
        const file = new File([data], FILE_NAME);
        const parsedStudents = await parseExcelFile(file);
        setStudents(parsedStudents);

        // Guardar fecha de última actualización
        const { data: fileInfo } = await supabase
          .storage
          .from(BUCKET_NAME)
          .list('', { search: FILE_NAME });
        if (fileInfo && fileInfo.length > 0) {
          setLastUpdated(new Date(fileInfo[0].updated_at).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
          }));
        }
      }
    } catch (err) {
      console.error('Error al cargar:', err);
      setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setView('admin');
      setPasswordInput('');
      setError(null);
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  const handleFileSelect = async (file) => {
    setIsUploading(true);
    setError(null);
    try {
      // 1. Subir el archivo Excel a Supabase Storage (reemplaza el anterior)
      const { error: uploadError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(FILE_NAME, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Parsear el archivo para mostrarlo localmente
      const parsedStudents = await parseExcelFile(file);
      if (parsedStudents.length === 0) {
        setError('No se encontraron estudiantes válidos en el archivo. Verifica el formato.');
        return;
      }
      setStudents(parsedStudents);
      setLastUpdated(new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric'
      }));
      alert(`✅ ¡Éxito! Se subieron ${parsedStudents.length} estudiantes al directorio. Todos los profesores ya pueden verlos.`);
    } catch (err) {
      console.error('Error al subir:', err);
      setError('Hubo un error al subir el archivo. Por favor intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderContent = () => {
    // Pantalla de login de administrador
    if (view === 'login') {
      return (
        <div style={{ maxWidth: '420px', margin: '4rem auto' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--color-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <LogIn size={28} color="white" />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Acceso de Administrador</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Solo el administrador del colegio puede subir o actualizar el directorio.
            </p>

            {error && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa la contraseña"
                className="search-input"
                style={{ paddingLeft: '1rem', fontSize: '1rem', padding: '0.75rem 1rem' }}
                autoFocus
              />
              <button type="submit" className="btn" style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold', padding: '0.75rem', fontSize: '1rem' }}>
                Ingresar como Administrador
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setView('public'); setError(null); }}>
                Volver al Directorio
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Vista Admin: subir nuevo Excel
    if (view === 'admin') {
      return (
        <div>
          <div style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 'bold', color: 'var(--color-primary-hover)', marginBottom: '0.25rem' }}>
                🛡️ Estás en Modo Administrador
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Puedes subir un nuevo archivo Excel. Al subirlo, <strong>todos los profesores verán los datos actualizados automáticamente</strong>.
              </p>
            </div>
            {students.length > 0 && lastUpdated && (
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <div>Última actualización:</div>
                <div style={{ fontWeight: 'bold' }}>{lastUpdated}</div>
                <div>{students.length} estudiantes</div>
              </div>
            )}
          </div>

          {isUploading ? (
            <div className="empty-state">
              <CloudUpload className="icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
              <h3>Subiendo a la nube...</h3>
              <p>Por favor espera, esto puede tomar unos segundos.</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <FileUpload onFileSelect={handleFileSelect} currentCount={students.length} />
          )}
        </div>
      );
    }

    // Vista Pública: solo ver el directorio
    if (students.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '6rem 2rem' }}>
          <BookOpen className="icon" style={{ color: 'var(--color-border)', width: 64, height: 64, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--color-dark)', marginBottom: '0.5rem' }}>Directorio no disponible aún</h3>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
            El administrador del colegio aún no ha subido los datos. Por favor, comunícate con la secretaría.
          </p>
        </div>
      );
    }

    return <Directory students={students} />;
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <BookOpen className="icon" size={32} />
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>Directorio Escolar</h1>
            {lastUpdated && students.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                Actualizado: {lastUpdated} · {students.length} estudiantes
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Botón para recargar desde la nube */}
          <button
            className="btn btn-outline"
            onClick={loadDirectoryFromCloud}
            title="Recargar datos"
            style={{ padding: '0.5rem' }}
          >
            <RefreshCw size={16} />
          </button>

          {/* Botón Admin / Salir */}
          {view === 'public' ? (
            <button className="btn" onClick={() => setView('login')} style={{ backgroundColor: 'var(--color-dark)', color: 'white', fontWeight: 'bold' }}>
              <LogIn size={16} /> Administrador
            </button>
          ) : view === 'admin' ? (
            <button className="btn btn-outline" onClick={() => setView('public')} style={{ color: 'var(--color-secondary)' }}>
              <LogOut size={16} /> Salir
            </button>
          ) : null}
        </div>
      </header>

      <main>
        {isLoading ? (
          <div className="empty-state" style={{ padding: '6rem 2rem' }}>
            <RefreshCw className="icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)', width: 48, height: 48, marginBottom: '1rem' }} />
            <h3>Cargando directorio...</h3>
            <p>Conectando con el servidor del colegio.</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}

export default App;
