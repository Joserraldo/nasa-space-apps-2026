# Propuesta para revisar con Santiago y María Paula — acceso con un adulto

Estado: pendiente de decisión del equipo. #363 permanece en borrador.
El usuario propuso que, si el jugador es menor, use el correo de su padre, madre o tutor con autorización.
Ese correo NO se recoge en la implementación actual y escribirlo por sí solo no verifica autorización.

## Flujo propuesto antes de habilitar cuentas para menores

1. Mantener «Jugar como invitado» visible y funcional, sin correo ni creación de cuenta.
2. Separar «Soy adulto» de «Necesito ayuda de un adulto», sin pedir fecha de nacimiento exacta.
3. El adulto introduce su propio correo y recibe un enlace de confirmación; el niño no confirma por él.
4. Antes de confirmar, explicar al adulto qué se conserva, para qué, por cuánto tiempo y cómo borrarlo.
5. No crear la cuenta del menor ni subir progreso hasta que el adulto complete la confirmación.
6. Expirar y eliminar solicitudes incompletas. Permitir revocar autorización y borrar la cuenta/progreso.
7. No recoger nombre real del niño, colegio, ubicación, imagen, voz ni grabaciones.

## Decisiones que debe cerrar el equipo

- Si la política del proyecto permite alguna cuenta vinculada a un menor o requiere solo cuentas de adultos.
- Qué servicio envía la confirmación, quién lo administra y qué información recibe.
- Cómo se verifica la autorización, su alcance y su revocación.
- Plazos concretos de conservación y eliminación, incluida la información ya existente.
- Si es preferible una cuenta del adulto que conserva la misión, sin crear un perfil personal del niño.

## Inventario de lo que ya existe (no es un permiso para publicarlo)

La API existente guarda usuario/apodo, hash y sal de contraseña, identificador de cuenta,
hash de sesión con vencimiento, intentos de acceso y progreso de la misión. No solicita correo.
La UI de #363 solo recuerda una pista de sesión; la cookie de sesión es HttpOnly.
Un apodo vinculado a una cuenta y su progreso no se declara «anónimo» por no incluir nombre real.

#363 no implementa aún el flujo de autorización de un adulto. No debe presentarse como si lo hiciera.
La integración del Frente B permanece separada y no incorpora esta pantalla de cuentas.
