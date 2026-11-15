# Contrato estable de la ruta Jezero

José mantiene estos identificadores al montar UI/3D/intro/carga; el autor de cada componente los entrega en el mismo PR. No son textos visibles ni traducciones. Los roles/nombres accesibles siguen siendo obligatorios.

`app` expone `data-phase`; `language`, `start-mission`, `orbit-screen`, `continue-orbit`, `landing-option-<id>`, `module-<Equipment>`, `modules-ready`, `storm-screen`, `source-card`, `verify-iris`, `dilemma-<id>`, `dilemma-confirm`, `send-telemetry`, `resume-event`, `mission-result` con `data-result`, `play-again`.

La intro, cuando se monte, ofrece `intro-skip` y conduce al mismo `orbit-screen`. El test espera un estado visible, no una duración animada ni un porcentaje de carga. `orbit-screen` solo se hace visible cuando sea utilizable. No duplicar IDs simultáneamente en variantes ocultas de móvil/desktop.

Los dos casos EN/ES recorren la misma misión y comprueban victoria, fuente y reinicio. Actualizar comportamiento y e2e en la misma entrega; nunca fijar la prueba al texto literal de Continue/Continuar o a `details summary`.
