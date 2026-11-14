-- Login opcional + progreso (decisión de Santiago, 14 nov). El invitado no se guarda aquí.
-- Minimización de datos (jugadores de 7–12 años): solo un nombre de usuario elegido, SIN correo,
-- sin nombre real, sin IP. La contraseña se guarda como hash PBKDF2-SHA256 con sal.

CREATE TABLE usuarios (
  id          TEXT PRIMARY KEY,                 -- aleatorio (crypto.randomUUID)
  usuario     TEXT NOT NULL UNIQUE COLLATE NOCASE,
  clave_hash  TEXT NOT NULL,                    -- base64url
  clave_sal   TEXT NOT NULL,                    -- base64url
  iteraciones INTEGER NOT NULL,
  creado      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sesión opaca: el navegador guarda el token en una cookie HttpOnly; aquí solo su hash.
CREATE TABLE sesiones (
  token_hash  TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creada      TEXT NOT NULL DEFAULT (datetime('now')),
  expira      TEXT NOT NULL
);
CREATE INDEX sesiones_por_usuario ON sesiones(usuario_id);

-- Un documento de progreso por usuario (JSON que define la pantalla: rango, atlas, misiones…).
CREATE TABLE progreso (
  usuario_id  TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  datos       TEXT NOT NULL,
  actualizado TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Límite de intentos de login por usuario (ventana de 15 min).
CREATE TABLE intentos (
  clave   TEXT PRIMARY KEY,
  n       INTEGER NOT NULL,
  ventana INTEGER NOT NULL
);
