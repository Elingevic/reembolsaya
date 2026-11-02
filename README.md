# ReembolsaYa

> De la puerta de la clínica hasta que te pagan.

Plataforma para el seguro de salud (HCM) en Venezuela. Acompaña al asegurado en cinco momentos: pase de salud en la admisión, carta aval, reembolso con una foto, seguimiento del plazo y reclamo formal automático. Con los datos agregados y anónimos de cada paso arma un panel de supervisión para la SUDEASEG. Postulación a **AseguraTech26**, desafío 4 (RegTech).

## Carpetas

```
web/          prototipo (HTML, CSS y JS sin dependencias)
postulacion/  PDF único, lámina, video, guion y fuentes HTML
PITCH.md      pitch, guion de 5 minutos, preguntas del jurado y fuentes
vercel.json   le dice a Vercel que publique la carpeta web/
```

## Publicar en Vercel

Importa el repositorio en Vercel con *Framework Preset* = **Other** y sin comando de build. El `vercel.json` ya apunta a `web/`. Si reutilizas el proyecto **reembolsaya** que ya existe, la URL `reembolsaya.vercel.app` es la que traen los PDF y el video.

## Qué hace el prototipo

| Vista | Ruta | Qué muestra |
|---|---|---|
| Inicio | `#/` | Problema con fuentes, los cinco momentos y acceso a las cuatro vistas |
| Paciente | `#/paciente` | App de Carlos: pase de salud con QR, registro de negativa de atención, presupuesto y carta aval, reembolso con foto (lectura con IA, documentos faltantes, sobrecobro), mis casos con plazo y reclamo formal, y "¿Me cubre?" con cláusulas citadas |
| Clínica | `#/clinica` | Admisión con el pase: póliza, saldo, carta aval, estado de pagos de la aseguradora, admitir o registrar el motivo de no admisión |
| Aseguradora | `#/aseguradora` | Bandeja con alertas (duplicada, honorarios altos, plazo vencido), aprobar y pagar, KPIs |
| Supervisor | `#/supervisor` | Días de pago por aseguradora contra el plazo, negativas por estado y motivo, sobrecobros por procedimiento, reclamos escalados |

Todo corre en el navegador y el estado se guarda en `localStorage`. Lo que se hace en la vista del paciente aparece en las otras tres. **Reiniciar demo** vuelve a los datos de ejemplo. Personas, aseguradoras, clínicas, montos, cláusulas, plazos y precios de referencia son **ficticios o ilustrativos**.
