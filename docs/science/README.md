# Fuentes y verificación científica

Documentación del rol datos para revisar la ciencia y preparar la entrega. El catálogo funciona sin llamadas a NASA durante la partida: son datos curados, no en vivo.

## Para preparar la demo y el formulario
- [Datos usados y por qué](datos-usados.md): explicación del aporte de los datasets.
- [Fuentes](fuentes.md): procedencia, atribuciones y fuentes externas autorizadas.
- [Tarjetas de Jezero](tarjetas-mision1.md) y [otras misiones](tarjetas-misiones.md): textos y fuentes por paso.
- [Glosario](glosario.md): lenguaje científico para niños.

## Para verificar la implementación
- [Pipeline](pipeline.md): descarga, normalización y respaldo local.
- [Terreno](terreno.md): elevación medida y criterios derivados por el equipo.
- [Intensidad](intensidad.md): límites de la interpretación de tormentas.
- [Revisión de agentes](revision-agentes.md): afirmaciones científicas de los expertos.

Ejecutar desde la raíz: `npm test -- --run data/test`.
Verificación del 15 nov 2026: 18 archivos, 133 pruebas aprobadas. La auditoría cubre atribución, fechas, etiquetas y claves en inglés/español; no sustituye comprobar que la pantalla muestra esos créditos.

## Límites que deben conservarse
- Kp describe la Tierra: no presentarlo como medición de Marte.
- La dosis RAD de referencia se midió en Gale; no atribuirla a Jezero.
- No intercambiar dosis absorbida en µGy con dosis equivalente en mSv.
- No mostrar hielo de `SP_IceLoc_280m` como verificado mientras falte su atribución.
- Las reglas de balance y los criterios derivados del equipo no son mediciones de NASA.
