import React, { useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import FileUpload from './FileUpload';
import Directory from './Directory';
import { parseExcelFile } from './excelParser';

function App() {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('students_directory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para vistas y login
  const [view, setView] = useState('public'); // 'public', 'login', 'admin'
  const [passwordInput, setPasswordInput] = useState('');

  const handleFileSelect = async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) {
        setError("No se encontraron estudiantes válidos en el archivo.");
      } else {
        setStudents(data);
        // Guardar en el almacenamiento del navegador para que persista
        localStorage.setItem('students_directory', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setError("Hubo un error al leer el archivo Excel. Asegúrate de que el formato sea el correcto.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Contraseña simple para el administrador
    if (passwordInput === 'admin2026') {
      setView('admin');
      setPasswordInput('');
      setError(null);
    } else {
      setError("Contraseña incorrecta.");
    }
  };

  const resetApp = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar los datos actuales y subir un nuevo archivo?")) {
      setStudents([]);
      setError(null);
      localStorage.removeItem('students_directory');
    }
  };

  const renderContent = () => {
    if (view === 'login') {
      return (
        <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-dark)' }}>Acceso de Administrador</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Contraseña"
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
            <button type="submit" className="btn" style={{ backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold' }}>
              Ingresar
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setView('public')}>
              Volver al Directorio
            </button>
          </form>
        </div>
      );
    }

    if (students.length === 0) {
      if (view === 'admin') {
        return <FileUpload onFileSelect={handleFileSelect} />;
      } else {
        return (
          <div className="empty-state">
            <BookOpen className="icon" />
            <h3 style={{ color: 'var(--color-dark)', marginBottom: '0.5rem' }}>Directorio Vacío</h3>
            <p>El administrador aún no ha subido la base de datos de estudiantes.</p>
          </div>
        );
      }
    }

    return <Directory students={students} />;
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <BookOpen className="icon" size={32} />
          <h1>Directorio Escolar</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {view === 'admin' && students.length > 0 && (
            <button className="btn btn-outline" onClick={resetApp} style={{ fontWeight: 'bold', border: '2px solid var(--color-border)' }}>
              <RefreshCw size={16} /> Reemplazar Archivo Excel
            </button>
          )}
          
          {view === 'public' ? (
            <button className="btn" onClick={() => setView('login')} style={{ backgroundColor: 'var(--color-dark)', color: 'white' }}>
              Soy Administrador
            </button>
          ) : view === 'admin' ? (
            <button className="btn btn-outline" onClick={() => setView('public')}>
              Salir de Admin
            </button>
          ) : null}
        </div>
      </header>

      <main>
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-secondary-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="empty-state">
            <RefreshCw className="icon" style={{ animation: 'spin 1s linear infinite' }} />
            <h3>Procesando archivo...</h3>
            <p>Por favor, espera mientras leemos los datos.</p>
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
