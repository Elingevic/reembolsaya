# ReembolsaYa — Pitch AseguraTech26

**Lema:** De la puerta de la clínica hasta que te pagan.
**Área:** RegTech (Desafío 4), con impacto directo en seguros de salud.
**Prototipo:** https://reembolsaya.vercel.app

## En una frase

ReembolsaYa acompaña al asegurado de salud desde la admisión hasta el pago (pase digital, carta aval, reembolso con foto, plazo y reclamo formal) y convierte cada paso en datos para que la SUDEASEG supervise tiempos de pago, negativas de atención y sobrecobros.

## El problema

- Solo **6 %** de los venezolanos tiene póliza de salud (Finanzas Digital, abril de 2026). Si la experiencia decepciona, ese mercado no crece.
- **Negativas en la puerta:** en 2023 el Ministerio Público anunció investigaciones a clínicas que se negaban a atender a asegurados (NTN24). La prensa regional (La Patilla, Diario de los Andes) ha reportado pacientes enviados de clínica en clínica porque las aseguradoras deben a los prestadores.
- **Reembolso manual:** los instructivos públicos piden escanear todo en un solo PDF y enviarlo por correo. Si falta un papel, el caso vuelve atrás y el asegurado no sabe cuánto falta.
- **Sin datos:** nadie ve con evidencia estructurada dónde se traba cada caso. El supervisor actúa por denuncias.

## La solución: cinco momentos

1. **Pase de salud.** QR que la clínica escanea: póliza vigente, saldo y carta aval. Si niegan la atención, el asegurado lo registra en un minuto; avisamos a la aseguradora, sugerimos clínicas con convenio y el caso suma (anónimo) al panel del supervisor.
2. **Presupuesto y carta aval.** Qué cubre la póliza, qué paga el asegurado y qué honorarios están por encima de la referencia. Carta aval pedida desde la app o la clínica.
3. **Reembolso con foto.** La IA lee médico, RIF, número de control, fecha y monto en Bs (con conversión a USD a la tasa del día), revisa los documentos exigidos, facturas duplicadas y sobrecobros antes de enviar.
4. **Seguimiento.** Estado de cada caso y días hábiles frente al plazo de la póliza.
5. **Reclamo formal.** Si se vence el plazo, el reclamo sale redactado y se envía con un toque; si no hay respuesta, se escala a la SUDEASEG con línea de tiempo y documentos.

Extra: **"¿Me cubre?"**, un asistente que responde citando la cláusula exacta de la póliza.

## RegTech: el panel del supervisor

- Días hábiles de pago por aseguradora contra el plazo.
- Negativas de atención por clínica, estado y motivo.
- Sobrecobros por procedimiento contra rangos de referencia por zona.
- Reclamos escalados con su expediente.

Solo datos agregados y anónimos, salvo el reclamo que el asegurado decide escalar.

## Modelo de negocio

- **Aseguradoras:** SaaS por asegurado HCM activo al mes + cargo por caso procesado. Retorno: menos devoluciones, menos llamadas, sobrecobros detectados.
- **Asegurados y clínicas:** gratis.
- **Supervisor:** acceso al panel agregado sin costo para el Estado.
- **Corredores:** API para seguir los casos de su cartera.

## Encaje regulatorio y riesgos

- Es **software**: no vende seguros, no intermedia, no asume riesgo.
- Piloto en entorno de pruebas regulatorio con una aseguradora y pocas clínicas.
- Datos de salud: consentimiento expreso, cifrado, acceso por rol, anonimización antes de agregar.
- Adopción de clínicas: el pase funciona aunque la clínica no esté integrada.
- Lectura con IA: el asegurado confirma cada campo antes de enviar.

## Plan de 12 meses

| Fase | Qué se hace |
|---|---|
| 0–3 meses | Piloto: 1 aseguradora, 3 clínicas, 500 asegurados. Pase, carta aval, reembolso con foto. |
| 4–6 meses | Seguimiento de plazos, reclamo formal y primer panel para la SUDEASEG. |
| 7–12 meses | 3 aseguradoras, red de clínicas por estado, precios de referencia, API para corredores. |

**Métricas:** % de casos completos al primer envío, días hábiles hasta el pago, minutos hasta la carta aval, negativas resueltas el mismo día.

## Guion de 5 minutos (demo en vivo)

1. **(0:00–0:45) Problema.** Inicio: tres datos y la frase "tener seguro no garantiza que te atiendan, ni que te paguen".
2. **(0:45–1:30) Pase.** Paciente → En la clínica. Mostrar el QR. Pulsar "Me negaron la atención" → registrar → aviso y clínicas con convenio.
3. **(1:30–2:00) Carta aval.** Presupuesto → $5.900 / $900 → pedir carta aval. Ir a Clínica → escanear pase → se ve la carta aval.
4. **(2:00–2:50) Reembolso.** Usar documentos de ejemplo → campos leídos, alerta de sobrecobro, falta el récipe → agregar → enviar.
5. **(2:50–3:30) Plazo y reclamo.** Mis casos → caso vencido → enviar reclamo formal.
6. **(3:30–4:30) Supervisor.** Días de pago, negativas (la que registramos suma 1) y sobrecobros. Aseguradora: bandeja con alertas.
7. **(4:30–5:00) Cierre.** Modelo, piloto y "de la puerta de la clínica hasta que te pagan".

## Preguntas probables del jurado

- **¿Por qué una aseguradora pagaría por algo que la expone ante el supervisor?** Porque reduce su costo operativo (casos completos, menos llamadas, sobrecobros detectados) y porque las que pagan a tiempo ganan reputación con datos. El supervisor ve agregados, no expedientes.
- **¿Y si la clínica no quiere usarlo?** El pase solo necesita un teléfono para escanearse. Las clínicas ganan cartas aval más rápidas y visibilidad de lo que les deben.
- **¿Qué pasa con la privacidad de datos de salud?** Consentimiento, mínimo necesario, cifrado y anonimización antes de agregar.
- **¿De dónde salen los precios de referencia?** De los propios reclamos procesados en la plataforma, por procedimiento y zona, y de los baremos que ya usan las aseguradoras.
- **¿Compite con los corredores?** No. Les da una herramienta para seguir los casos de su cartera.

## Fuentes

- Finanzas Digital (abril de 2026): penetración de pólizas de salud en Venezuela.
- NTN24 (agosto de 2023): investigación del Ministerio Público a clínicas que negaban atención a asegurados.
- La Patilla; Diario de los Andes: asegurados rechazados en clínicas por deudas de aseguradoras.
- Instructivos públicos de reembolso de aseguradoras y corredores en Venezuela.

Montos, aseguradoras, clínicas, cláusulas, plazos y cifras del panel en el prototipo son ilustrativos.
