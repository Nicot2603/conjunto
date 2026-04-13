# bot telegram parqueadero
/start
/help
/informe


## prompts

vamos a dar el siguiente paso importante para el bot, este es un resumen de los nuevos cambios que deben implementarse a este bot. quiero que solamente cambies la funcionalidad y el .env, no toques el readme ni que cambies mucho el telegram.js: 
 
 Este enfoque de usar dos hojas de cálculo  es excelente por seguridad y orden: la primera actúa como "buzón de entrada" (datos crudos) y la segunda como "base de datos maestra" donde la IA escribe sus hallazgos. 
 Aquí tienes el diseño técnico del flujo y cómo debe configurarse el código en JS para que la IA no cometa errores con los pagos y la fecha de Bogotá: 
 1. El Flujo de Datos entre Hojas 
 Hoja A (Forms):  Solo recibe. No se toca. 
 Script de Sincronización:  El bot lee la Hoja A, copia los datos importantes a la Hoja B , y es en la Hoja B donde el "Batch Worker" (IA) hará su magia. 
 Hoja B (Maestra):  Aquí es donde el bot de Telegram consultará para darte los informes. 
 2. Configuración de la IA para Validaciones Específicas 
 Para que la IA verifique consignaciones y documentos, el código debe enviarle a Gemini no solo las imágenes, sino el contexto de comparación . 
 El "Checklist" de la IA (Campos de Procesamiento): 
 Cédula:  Verificación de nombre y número de identificación. 
 Vehículo:  Comparación visual (¿La placa en la foto es la misma que escribió en el Forms?). 
 SOAT:  Extracción de fecha de vencimiento y comparación con la fecha actual. 
 Consignaciones (Pagos):  Aquí la IA debe buscar 3 recibos y verificar que las fechas correspondan a los últimos 3 meses calendario. 
 3. Código Sugerido (Node.js) para el Procesamiento 
 Para manejar la fecha de Colombia y las validaciones, tu función de procesamiento debería verse así: 
 JavaScript 
 import { moment } from 'moment-timezone'; // Para manejar la hora de Bogotá 
 
 export async function procesarLoteIA(filaMaestra, gemini) { 
   // 1. Obtener fecha actual en Bogotá 
   const fechaBogota = moment().tz("America/Bogota").format('YYYY-MM-DD' ); 
   
   // 2. Preparar los archivos (Cédula, Tarjeta, SOAT, 3 Pagos) 
   const  links = [ 
     filaMaestra.get('Link Cédula' ), 
     filaMaestra.get('Link Tarjeta Propiedad' ), 
     
     filaMaestra.get('Link SOAT' ), 
     filaMaestra.get('Link Pago 1' ), 
     filaMaestra.get('Link Pago 2' ), 
     filaMaestra.get('Link Pago 3' ) 
   ]; 
 
   // 3. Prompt Maestro para la IA 
   const prompt = ` 
     Eres un auditor de documentos para un conjunto residencial en Bogotá. 
     Fecha actual de referencia: ${fechaBogota} . 
     
     TAREAS: 
     1. Cédula: ¿Es legible y coincide con el nombre ${filaMaestra.get('Nombre')} ? 
     2. Vehículo: ¿La placa en la tarjeta es ${filaMaestra.get('Placa')} y la marca es ${filaMaestra.get('Marca')} ? 
     3. SOAT: ¿La fecha de vencimiento es posterior a ${fechaBogota} ? 
     4. Administración: Verifica 3 comprobantes de pago. Deben ser de los últimos 3 meses y estar pagados. 
     
     RESPONDE en JSON con campos: cedula_ok (bool), vehiculo_match (bool), soat_vigente (bool), pagos_al_dia (bool), observaciones (string). 
   ` ; 
 
   // Ejecutar análisis 
   const resultado = await  gemini.analizarMultimodal(links, prompt); 
 
   // 4. Actualizar Hoja B (Campos de chuleo) 
   filaMaestra.set('IA_Cedula', resultado.cedula_ok ? '✅' : '❌' ); 
   filaMaestra.set('IA_Vehiculo', resultado.vehiculo_match ? '✅' : '❌' ); 
   filaMaestra.set('IA_SOAT', resultado.soat_vigente ? 'Vigente' : 'Vencido' ); 
   filaMaestra.set('IA_Pagos', resultado.pagos_al_dia ? 'Al día' : 'Pendiente/Incompleto' ); 
   filaMaestra.set('IA_Observaciones' , resultado.observaciones); 
   filaMaestra.set('Ultima_Revision' , fechaBogota); 
 
   await  filaMaestra.save(); 
 } 
 
 4. Resumen de los Campos de la Hoja B (Maestra) 
 Datos Personales 
 Datos Vehículo 
 Enlaces Drive 
 Campos de IA (Chuleo) 
 Correo 
 Marca 
 Link PDF 1 (Papeles) 
 IA_Cedula  (✅/❌) 
 Torre/Apto 
 Placa 
 Link PDF 2 (Pagos) 
 IA_Vehiculo  (Coincide/No) 
 Teléfono 
 Color 
 IA_SOAT  (Vigente/Vencido) 
 Propietario/Arr. 
 IA_Pagos  (3/3 Al día) 
 Observaciones IA 
 5. Cómo el Bot te da el informe 
 Cuando uses el comando /informe  en Telegram, el código hará un filtro en la Hoja B : 
 Total:  Conteo de filas. 
 Al día:  Filas donde IA_SOAT == 'Vigente'  Y IA_Pagos == 'Al día' . 
 Morosos/Vencidos:  Filas con alguna ❌ . 
 Ventaja de este sistema:  Al tener la IA revisando los comprobantes de pago mensualmente, te ahorras horas de revisar fotos de transferencias bancarias borrosas. La IA detectará la fecha y el monto en el comprobante automáticamente. 
 
 para el .env este es el nuevo forms. son 2 hojas una que se llama "Respuestas de formulario 1" y la otra hoja se llama "Procesamiento" 

 
 
 este es el link del drive 
 ruta principal 

 subcarpeta moto (cuando la persona escoje carro y moto) 

 subcarpeta carro (cuando la persona escoje carro y moto) 

 subcarpeta archivos adjuntos (cuando la persona escoje solo o carro o solo moto) 
