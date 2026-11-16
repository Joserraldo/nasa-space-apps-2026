# Estado — Frente A (José)

**Hecho (15 nov):**
- A0 fusionado (#337).
- A1 (#340, abierto): objetivo del paso 4 en el turno 0; avería de Iris revelada desde el paso 6.
- A2 parte 1 (rama `feat/frente-a-A2-objetivos`): `pedidoDeGuia` (juego/pedidoEscena.ts), Iris rueda delante
  del niño hacia el objetivo (`guiarIrisA`), cara de error desde la guía, globo DOM anclado sobre el actor con un
  sistema del gancho de A0. Probado en local conectando las props (sin commit en archivos de E).

**Sigue:** A3 (propuesta de misión interactiva, un documento).

**Bloqueado:**
- #339 (E): `MundoBase.tsx` revela la avería en el turno 0; e2e del respaldo 2D espera "Repair Iris".
- #344 (E): conectar `pedidoDeGuia` a `EscenaBase` y la e2e "seguir a Iris" (Hecho cuando de A2).
