# Decisión de acceso reportada por el usuario

El usuario informa que Cabezas aprobó mantener usuario/apodo y contraseña, sin nombre real ni correo.
El acceso como invitado sigue disponible, sin registro.

La pantalla indica que los menores deben jugar con autorización de una persona adulta responsable.
El aviso es una condición de uso: no se afirma que verifique la autorización del adulto.
No se implementa recogida de correo parental, fecha de nacimiento, nombre real, colegio, imagen ni audio.

## Datos del sistema existente

La API guarda usuario/apodo, hash y sal de contraseña, identificador de cuenta,
hash de sesión con vencimiento, intentos de acceso y progreso de la misión.
La UI conserva una pista de sesión; la cookie es HttpOnly. No guarda contraseñas ni tokens en localStorage.
La cuenta no se presenta como anónima por usar un apodo.

La aprobación fue reportada en este chat por el usuario; el PR queda disponible para revisión del equipo.
