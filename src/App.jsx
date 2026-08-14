import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  RefreshCw,
  LogIn,
  LogOut,
  CloudUpload,
  UserPlus,
  Trash2,
  Shield
} from 'lucide-react';

import FileUpload from './FileUpload';
import Directory from './Directory';
import { parseExcelFile } from './excelParser';
import { supabase, BUCKET_NAME, FILE_NAME } from './supabaseClient';

function App() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadError, setUploadError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const [view, setView] = useState('public');

  // Login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Usuario actualmente autenticado
  const [currentUser, setCurrentUser] = useState(null);

  // Correos autorizados
  const [adminUsers, setAdminUsers] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminUsersError, setAdminUsersError] = useState(null);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  // =========================================================
  // INICIO
  // =========================================================

  useEffect(() => {
    loadDirectoryFromCloud();
    checkCurrentSession();

    // Detectar login/logout de Supabase
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);

        const authorized = await isAuthorizedEmail(session.user.email);

        if (authorized) {
          setView('admin');
          loadAdminUsers();
        } else {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setView('public');
        }
      } else {
        setCurrentUser(null);

        if (view === 'admin') {
          setView('public');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // SESIÓN ACTUAL
  // =========================================================

  const checkCurrentSession = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const authorized = await isAuthorizedEmail(session.user.email);

      if (authorized) {
        setCurrentUser(session.user);
        setView('admin');
        loadAdminUsers();
      } else {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error comprobando sesión:', error);
    }
  };

  // =========================================================
  // COMPROBAR SI EL CORREO ESTÁ AUTORIZADO
  // =========================================================

  const isAuthorizedEmail = async (email) => {
    if (!email) return false;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error comprobando administrador:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // =========================================================
  // CARGAR DIRECTORIO
  // =========================================================

  const loadDirectoryFromCloud = async () => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      const { data, error: downloadError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(FILE_NAME);

      if (downloadError) {
        if (
          downloadError.message?.includes('Not Found') ||
          downloadError.message?.includes('Object not found')
        ) {
          setStudents([]);
        } else {
          throw downloadError;
        }
      } else {
        const file = new File([data], FILE_NAME);
        const parsedStudents = await parseExcelFile(file);

        setStudents(parsedStudents);

        const { data: fileInfo, error: listError } = await supabase
          .storage
          .from(BUCKET_NAME)
          .list('', {
            search: FILE_NAME
          });

        if (!listError && fileInfo && fileInfo.length > 0) {
          setLastUpdated(
            new Date(fileInfo[0].updated_at).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          );
        }
      }
    } catch (err) {
      console.error('Error al cargar:', err);

      setConnectionError(
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError(null);

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email || !password) {
      setLoginError('Ingresa tu correo y contraseña.');
      return;
    }

    try {
      // PRIMERO comprobamos que el correo esté autorizado
      const authorized = await isAuthorizedEmail(email);

      if (!authorized) {
        setLoginError(
          'Este correo no está autorizado para acceder al administrador.'
        );
        return;
      }

      // Después hacemos login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error de login:', error);

        setLoginError(
          'Correo o contraseña incorrectos.'
        );

        return;
      }

      if (!data.user) {
        setLoginError('No se pudo iniciar sesión.');
        return;
      }

      setCurrentUser(data.user);
      setEmailInput('');
      setPasswordInput('');
      setLoginError(null);
      setView('admin');

      await loadAdminUsers();

    } catch (error) {
      console.error('Error completo de login:', error);

      setLoginError(
        error.message || 'No se pudo iniciar sesión.'
      );
    }
  };

  // =========================================================
  // CERRAR SESIÓN
  // =========================================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      setCurrentUser(null);
      setView('public');
      setEmailInput('');
      setPasswordInput('');
      setLoginError(null);
      setAdminUsers([]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  // =========================================================
  // SUBIR EXCEL
  // =========================================================

  const handleFileSelect = async (file) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      console.log('📁 Archivo seleccionado:', file);
      console.log('📁 Nombre:', file.name);
      console.log('📁 Tamaño:', file.size);
      console.log('📁 Tipo:', file.type);
      console.log('☁️ Bucket:', BUCKET_NAME);
      console.log('📄 Nombre destino:', FILE_NAME);

      const {
        data,
        error
      } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(FILE_NAME, file, {
          upsert: true,
          contentType:
            file.type ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      console.log('☁️ RESPUESTA SUPABASE:', data);
      console.log('❌ ERROR SUPABASE:', error);

      if (error) {
        throw error;
      }

      console.log('✅ ARCHIVO SUBIDO CORRECTAMENTE');

      const parsedStudents = await parseExcelFile(file);

      console.log(
        '👨‍🎓 Estudiantes encontrados:',
        parsedStudents.length
      );

      if (parsedStudents.length === 0) {
        setUploadError(
          'El archivo se subió, pero no se encontraron estudiantes válidos.'
        );
        return;
      }

      setStudents(parsedStudents);

      setLastUpdated(
        new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );

      alert(
        `✅ ¡Éxito! Se cargaron ${parsedStudents.length} estudiantes.`
      );

    } catch (err) {
      console.error('🔥 ERROR COMPLETO:', err);

      setUploadError(
        `Error al subir: ${err.message || 'Error desconocido'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  // =========================================================
  // CARGAR CORREOS AUTORIZADOS
  // =========================================================

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    setAdminUsersError(null);

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, created_at')
        .order('email', {
          ascending: true
        });

      if (error) {
        throw error;
      }

      setAdminUsers(data || []);

    } catch (error) {
      console.error('Error cargando administradores:', error);

      setAdminUsersError(
        'No se pudieron cargar los correos autorizados.'
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };

  // =========================================================
  // AGREGAR CORREO
  // =========================================================

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    setAdminUsersError(null);

    const email = newAdminEmail.trim().toLowerCase();

    if (!email) {
      setAdminUsersError('Escribe un correo electrónico.');
      return;
    }

    if (!email.includes('@')) {
      setAdminUsersError('Escribe un correo electrónico válido.');
      return;
    }

    try {
      setAdminUsersLoading(true);

      const { error } = await supabase
        .from('admin_users')
        .insert({
          email
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ese correo ya está autorizado.');
        }

        throw error;
      }

      setNewAdminEmail('');

      await loadAdminUsers();

      alert(
        `✅ ${email} ahora está autorizado como administrador.`
      );

    } catch (error) {
      console.error('Error agregando administrador:', error);

      setAdminUsersError(
        error.message || 'No se pudo agregar el correo.'
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };

  // =========================================================
  // ELIMINAR CORREO
  // =========================================================

  const handleDeleteAdmin = async (admin) => {
    if (!admin?.email) return;

    // Evitar que el administrador se elimine a sí mismo
    if (
      currentUser?.email?.toLowerCase() ===
      admin.email.toLowerCase()
    ) {
      alert(
        '⚠️ No puedes eliminar el correo con el que estás conectado.'
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar a ${admin.email} de los administradores?`
    );

    if (!confirmed) return;

    try {
      setAdminUsersLoading(true);
      setAdminUsersError(null);

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', admin.id);

      if (error) {
        throw error;
      }

      await loadAdminUsers();

      alert(
        `🗑️ ${admin.email} fue eliminado de los administradores.`
      );

    } catch (error) {
      console.error('Error eliminando administrador:', error);

      setAdminUsersError(
        error.message || 'No se pudo eliminar el correo.'
      );
    } finally {
      setAdminUsersLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const renderLogin = () => {
    return (
      <div
        style={{
          maxWidth: '420px',
          margin: '4rem auto'
        }}
      >
        <div
          className="card"
          style={{
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--color-dark)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <LogIn
              size={28}
              color="white"
            />
          </div>

          <h2
            style={{
              marginBottom: '0.5rem'
            }}
          >
            Acceso de Administrador
          </h2>

          <p
            style={{
              color: 'var(--color-text-muted)',
              marginBottom: '1.5rem'
            }}
          >
            Ingresa con un correo autorizado y tu contraseña.
          </p>

          {loginError && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}
            >
              {loginError}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <input
              type="email"
              value={emailInput}
              onChange={(e) =>
                setEmailInput(e.target.value)
              }
              placeholder="Correo electrónico"
              className="search-input"
              style={{
                paddingLeft: '1rem',
                fontSize: '1rem',
                padding: '0.75rem 1rem'
              }}
              autoComplete="email"
              autoFocus
            />

            <input
              type="password"
              value={passwordInput}
              onChange={(e) =>
                setPasswordInput(e.target.value)
              }
              placeholder="Contraseña"
              className="search-input"
              style={{
                paddingLeft: '1rem',
                fontSize: '1rem',
                padding: '0.75rem 1rem'
              }}
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="btn"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem',
                fontSize: '1rem'
              }}
            >
              <LogIn size={18} />
              Ingresar como Administrador
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setView('public');
                setLoginError(null);
                setEmailInput('');
                setPasswordInput('');
              }}
            >
              Volver al Directorio
            </button>
          </form>
        </div>
      </div>
    );
  };

  // =========================================================
  // PANEL ADMIN
  // =========================================================

  const renderAdmin = () => {
    return (
      <div>

        {/* Información administrador */}
        <div
          style={{
            backgroundColor: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 'bold',
                color: 'var(--color-primary-hover)',
                marginBottom: '0.25rem'
              }}
            >
              🛡️ Estás en Modo Administrador
            </p>

            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem'
              }}
            >
              Sesión iniciada como:{' '}
              <strong>
                {currentUser?.email}
              </strong>
            </p>
          </div>

          {students.length > 0 && lastUpdated && (
            <div
              style={{
                textAlign: 'right',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <div>
                Última actualización:
              </div>

              <div
                style={{
                  fontWeight: 'bold'
                }}
              >
                {lastUpdated}
              </div>

              <div>
                {students.length} estudiantes
              </div>
            </div>
          )}
        </div>

        {/* Subir Excel */}
        {isUploading ? (
          <div className="empty-state">
            <CloudUpload
              className="icon"
              style={{
                animation:
                  'spin 1s linear infinite',
                color:
                  'var(--color-primary)'
              }}
            />

            <h3>
              Subiendo a la nube...
            </h3>

            <p>
              Por favor espera, esto puede tomar unos segundos.
            </p>

            <style>
              {`
                @keyframes spin {
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
          </div>
        ) : (
          <>
            {uploadError && (
              <div
                style={{
                  backgroundColor:
                    'rgba(239,68,68,0.1)',
                  color: '#dc2626',
                  padding: '1rem',
                  borderRadius:
                    'var(--radius-md)',
                  marginBottom: '1rem',
                  border:
                    '1px solid rgba(239,68,68,0.3)',
                  fontSize: '0.875rem'
                }}
              >
                <strong>
                  ⚠️ Error:
                </strong>{' '}
                {uploadError}
              </div>
            )}

            <FileUpload
              onFileSelect={
                handleFileSelect
              }
              currentCount={
                students.length
              }
            />
          </>
        )}

        {/* Separador */}
        <div
          style={{
            borderTop:
              '1px solid var(--color-border)',
            margin:
              '2rem 0'
          }}
        />

        {/* Administradores */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <Shield
              size={24}
              color="var(--color-primary)"
            />

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem'
                }}
              >
                Administradores autorizados
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    'var(--color-text-muted)',
                  fontSize: '0.875rem'
                }}
              >
                Estos correos pueden entrar al panel de administración.
              </p>
            </div>
          </div>

          {/* Agregar correo */}
          <form
            onSubmit={handleAddAdmin}
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}
          >
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) =>
                setNewAdminEmail(
                  e.target.value
                )
              }
              placeholder="nuevoadmin@colegio.edu.pe"
              className="search-input"
              style={{
                flex: 1,
                minWidth: '220px',
                padding:
                  '0.75rem 1rem'
              }}
            />

            <button
              type="submit"
              className="btn"
              disabled={
                adminUsersLoading
              }
              style={{
                backgroundColor:
                  'var(--color-primary)',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              <UserPlus size={18} />
              Agregar correo
            </button>
          </form>

          {adminUsersError && (
            <div
              style={{
                backgroundColor:
                  'rgba(239,68,68,0.1)',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius:
                  'var(--radius-md)',
                marginBottom: '1rem',
                fontSize:
                  '0.875rem'
              }}
            >
              ⚠️ {adminUsersError}
            </div>
          )}

          {/* Lista */}
          {adminUsersLoading &&
          adminUsers.length === 0 ? (
            <p>
              Cargando administradores...
            </p>
          ) : adminUsers.length === 0 ? (
            <p
              style={{
                color:
                  'var(--color-text-muted)'
              }}
            >
              No hay correos autorizados.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '0.5rem'
              }}
            >
              {adminUsers.map(
                (admin) => (
                  <div
                    key={admin.id}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      gap: '1rem',
                      padding:
                        '0.75rem 1rem',
                      border:
                        '1px solid var(--color-border)',
                      borderRadius:
                        'var(--radius-md)',
                      background:
                        'var(--color-background)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '0.5rem',
                        minWidth: 0
                      }}
                    >
                      <Shield
                        size={18}
                        color="var(--color-primary)"
                      />

                      <span
                        style={{
                          wordBreak:
                            'break-word'
                        }}
                      >
                        {admin.email}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        handleDeleteAdmin(
                          admin
                        )
                      }
                      disabled={
                        currentUser?.email?.toLowerCase() ===
                        admin.email.toLowerCase()
                      }
                      title={
                        currentUser?.email?.toLowerCase() ===
                        admin.email.toLowerCase()
                          ? 'No puedes eliminar tu propio usuario'
                          : 'Eliminar administrador'
                      }
                    >
                      <Trash2
                        size={17}
                      />
                      Eliminar
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // CONTENIDO PRINCIPAL
  // =========================================================

  const renderContent = () => {

    if (view === 'login') {
      return renderLogin();
    }

    if (view === 'admin') {

      // Seguridad adicional:
      // si no hay usuario autenticado,
      // no mostramos el panel.
      if (!currentUser) {
        return renderLogin();
      }

      return renderAdmin();
    }

    // =======================================================
    // DIRECTORIO PÚBLICO
    // =======================================================

    if (students.length === 0) {
      return (
        <div
          className="empty-state"
          style={{
            padding: '6rem 2rem'
          }}
        >
          <BookOpen
            className="icon"
            style={{
              color:
                'var(--color-border)',
              width: 64,
              height: 64,
              marginBottom: '1rem'
            }}
          />

          <h3
            style={{
              color:
                'var(--color-dark)',
              marginBottom:
                '0.5rem'
            }}
          >
            Directorio no disponible aún
          </h3>

          <p
            style={{
              color:
                'var(--color-text-muted)',
              maxWidth: '400px'
            }}
          >
            El administrador del colegio aún no ha subido los datos. Por favor, comunícate con la secretaría.
          </p>
        </div>
      );
    }

    return (
      <Directory
        students={students}
      />
    );
  };

  // =========================================================
  // APP
  // =========================================================

  return (
    <div className="app-container">

      <header className="header">

        <div className="header-title">

          <BookOpen
            className="icon"
            size={32}
          />

          <div>

            <h1
              style={{
                fontSize:
                  '1.5rem'
              }}
            >
              Directorio Escolar
            </h1>

            {lastUpdated &&
              students.length > 0 && (
                <p
                  style={{
                    fontSize:
                      '0.75rem',
                    color:
                      'var(--color-text-muted)',
                    fontWeight: 400
                  }}
                >
                  Actualizado:{' '}
                  {lastUpdated} ·{' '}
                  {students.length}{' '}
                  estudiantes
                </p>
              )}

          </div>

        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems:
              'center'
          }}
        >

          {/* Recargar directorio */}
          <button
            className="btn btn-outline"
            onClick={
              loadDirectoryFromCloud
            }
            title="Recargar datos"
            style={{
              padding: '0.5rem'
            }}
          >
            <RefreshCw
              size={16}
            />
          </button>

          {/* ADMIN */}
          {view === 'public' && (
            <button
              className="btn"
              onClick={() =>
                setView('login')
              }
              style={{
                backgroundColor:
                  'var(--color-dark)',
                color: 'white',
                fontWeight:
                  'bold'
              }}
            >
              <LogIn size={16} />
              Administrador
            </button>
          )}

          {/* SALIR */}
          {view === 'admin' && (
            <button
              className="btn btn-outline"
              onClick={
                handleLogout
              }
              style={{
                color:
                  'var(--color-secondary)'
              }}
            >
              <LogOut
                size={16}
              />
              Salir
            </button>
          )}

          {/* Volver al público desde login */}
          {view === 'login' && (
            <button
              className="btn btn-outline"
              onClick={() => {
                setView('public');
                setLoginError(null);
              }}
            >
              Volver
            </button>
          )}

        </div>

      </header>

      <main>

        {connectionError && (
          <div
            style={{
              backgroundColor:
                'rgba(239,68,68,0.1)',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius:
                'var(--radius-md)',
              marginBottom:
                '1rem',
              border:
                '1px solid rgba(239,68,68,0.3)'
            }}
          >
            ⚠️ {connectionError}
          </div>
        )}

        {isLoading ? (
          <div
            className="empty-state"
            style={{
              padding:
                '6rem 2rem'
            }}
          >
            <RefreshCw
              className="icon"
              style={{
                animation:
                  'spin 1s linear infinite',
                color:
                  'var(--color-primary)',
                width: 48,
                height: 48,
                marginBottom:
                  '1rem'
              }}
            />

            <h3>
              Cargando directorio...
            </h3>

            <p>
              Conectando con el servidor del colegio.
            </p>

            <style>
              {`
                @keyframes spin {
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
          </div>
        ) : (
          renderContent()
        )}

      </main>

    </div>
  );
}

export default App;