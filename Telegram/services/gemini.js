import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Un solo modelo multimodal optimizado
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
  }

  async procesarTexto(texto) {
    const prompt = `Del siguiente texto que describe un formulario de solicitud para sorteo de parqueadero:
"${texto}"
Extrae estos campos específicos:
- torre: número de torre
- apartamento: número de apartamento
- fecha_solicitud: fecha de solicitud (YYYY-MM-DD)
- nombre_interesado: nombre completo del interesado
- correo: correo electrónico
- telefono_fijo: teléfono fijo
- celular: número de celular
- nombre_propietario: nombre completo del propietario
- vehiculo_a_nombre: a nombre de quién está el vehículo
- automovil: escribe "X" si el campo Automóvil está marcado con X; si no, deja vacío ""
- automovil_marca: marca del automóvil (si hay una X en el campo de automóvil, extrae la marca)
- automovil_placa: placa del automóvil (si hay una X en el campo de automóvil, extrae la placa)
- moto: escribe "X" si el campo Moto está marcado con X; si no, deja vacío ""
- moto_tipo: tipo de moto (si hay una X en el campo de moto, extrae el tipo)
- moto_clase: clase de moto (si hay una X en el campo de moto, extrae la clase)
- moto_color: color de moto (si hay una X en el campo de moto, extrae el color)

IMPORTANTE: Si ves una "X" o marca similar en el campo de automóvil, eso significa que está inscribiendo un automóvil. Si ves una "X" en el campo de moto, eso significa que está inscribiendo una moto.
Si automovil no es "X", entonces automovil_marca y automovil_placa deben ser "".
Si moto no es "X", entonces moto_tipo, moto_clase y moto_color deben ser "".

Si algún campo no está mencionado, usa "No especificado"
Devuelve SOLO este JSON:
{"torre":"","apartamento":"","fecha_solicitud":"YYYY-MM-DD","nombre_interesado":"","correo":"","telefono_fijo":"","celular":"","nombre_propietario":"","vehiculo_a_nombre":"","automovil":"","automovil_marca":"","automovil_placa":"","moto":"","moto_tipo":"","moto_clase":"","moto_color":""}`;

    try {
      const result = await this.model.generateContent(prompt);
      let response = result.response.text().trim();
      
      // Limpiar bloques de código markdown si existen
      response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error procesando texto:', error);
      return { error: true, detalle: error.message, raw: error.response || 'Sin respuesta' };
    }
  }

  async procesarImagen(imagenBase64, textoAdicional = '') {
    const prompt = `Del formulario de solicitud para sorteo de parqueadero en la imagen ${textoAdicional}
Extrae estos campos específicos:
- torre: número de torre
- apartamento: número de apartamento
- fecha_solicitud: fecha de solicitud (YYYY-MM-DD)
- nombre_interesado: nombre completo del interesado
- correo: correo electrónico
- telefono_fijo: teléfono fijo
- celular: número de celular
- nombre_propietario: nombre completo del propietario
- vehiculo_a_nombre: a nombre de quién está el vehículo
- automovil: escribe "X" si el campo Automóvil está marcado con X; si no, deja vacío ""
- automovil_marca: marca del automóvil (si hay una X en el campo de automóvil, extrae la marca)
- automovil_placa: placa del automóvil (si hay una X en el campo de automóvil, extrae la placa)
- moto: escribe "X" si el campo Moto está marcado con X; si no, deja vacío ""
- moto_tipo: tipo de moto (si hay una X en el campo de moto, extrae el tipo)
- moto_clase: clase de moto (si hay una X en el campo de moto, extrae la clase)
- moto_color: color de moto (si hay una X en el campo de moto, extrae el color)

IMPORTANTE: Si ves una "X" o marca similar en el campo de automóvil, eso significa que está inscribiendo un automóvil. Si ves una "X" en el campo de moto, eso significa que está inscribiendo una moto.
Si automovil no es "X", entonces automovil_marca y automovil_placa deben ser "".
Si moto no es "X", entonces moto_tipo, moto_clase y moto_color deben ser "".

Si algún campo no está visible o legible, usa "No especificado"
Devuelve SOLO este JSON:
{"torre":"","apartamento":"","fecha_solicitud":"YYYY-MM-DD","nombre_interesado":"","correo":"","telefono_fijo":"","celular":"","nombre_propietario":"","vehiculo_a_nombre":"","automovil":"","automovil_marca":"","automovil_placa":"","moto":"","moto_tipo":"","moto_clase":"","moto_color":""}`;

    try {
      const base64Data = imagenBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const result = await this.model.generateContent([
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
      ]);
      
      let response = result.response.text().trim();
      
      // Limpiar bloques de código markdown si existen
      response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error procesando imagen:', error);
      return { error: true, detalle: error.message, raw: error.response || 'Sin respuesta' };
    }
  }

  async procesarPDF(pdfBase64, textoAdicional = '') {
    const prompt = `Del formulario de solicitud para sorteo de parqueadero en el PDF ${textoAdicional}
Extrae estos campos específicos:
- torre: número de torre
- apartamento: número de apartamento
- fecha_solicitud: fecha de solicitud (YYYY-MM-DD)
- nombre_interesado: nombre completo del interesado
- correo: correo electrónico
- telefono_fijo: teléfono fijo
- celular: número de celular
- nombre_propietario: nombre completo del propietario
- vehiculo_a_nombre: a nombre de quién está el vehículo
- automovil: escribe "X" si el campo Automóvil está marcado con X; si no, deja vacío ""
- automovil_marca: marca del automóvil (si hay una X en el campo de automóvil, extrae la marca)
- automovil_placa: placa del automóvil (si hay una X en el campo de automóvil, extrae la placa)
- moto: escribe "X" si el campo Moto está marcado con X; si no, deja vacío ""
- moto_tipo: tipo de moto (si hay una X en el campo de moto, extrae el tipo)
- moto_clase: clase de moto (si hay una X en el campo de moto, extrae la clase)
- moto_color: color de moto (si hay una X en el campo de moto, extrae el color)

IMPORTANTE: Si ves una "X" o marca similar en el campo de automóvil, eso significa que está inscribiendo un automóvil. Si ves una "X" en el campo de moto, eso significa que está inscribiendo una moto.
Si automovil no es "X", entonces automovil_marca y automovil_placa deben ser "".
Si moto no es "X", entonces moto_tipo, moto_clase y moto_color deben ser "".

Si algún campo no está visible o legible, usa "No especificado"
Devuelve SOLO este JSON:
{"torre":"","apartamento":"","fecha_solicitud":"YYYY-MM-DD","nombre_interesado":"","correo":"","telefono_fijo":"","celular":"","nombre_propietario":"","vehiculo_a_nombre":"","automovil":"","automovil_marca":"","automovil_placa":"","moto":"","moto_tipo":"","moto_clase":"","moto_color":""}`;

    try {
      const result = await this.model.generateContent([
        { text: prompt },
        { inlineData: { data: pdfBase64.replace(/^data:application\/pdf;base64,/, ''), mimeType: 'application/pdf' } }
      ]);
      let response = result.response.text().trim();
      response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      return JSON.parse(response);
    } catch (error) {
      console.error('Error procesando PDF:', error);
      return { error: true, detalle: error.message, raw: error.response || 'Sin respuesta' };
    }
  }

  extraerJson(texto) {
    const limpio = String(texto || '').replace(/```json\s*/g, '').replace(/```/g, '').trim();
    const match = limpio.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : limpio);
  }

  normalizarLinkDrive(url) {
    const str = String(url || '').trim();
    const idMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch?.[1]) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    return str;
  }

  async auditarDocumentosFila({ fechaBogota, propietarioArr, placa, marca, color, archivoExpediente }) {
    try {
      const prompt = `Eres auditor documental en Bogotá.
Fecha de referencia: ${fechaBogota}.
Documento de entrada: UN SOLO PDF (puede ser escaneado en imágenes). Aplica OCR visual completo.

Debes validar dentro del PDF (obligatorio todo):
1) Cédula por ambas caras.
2) Tarjeta de propiedad por ambas caras.
3) SOAT vigente (fecha vencimiento posterior a ${fechaBogota}).
4) Tres consignaciones de Administración Parques de Almazán.
5) Las consignaciones deben corresponder a los últimos 3 meses calendario respecto a ${fechaBogota}.

Comparación de tarjeta de propiedad contra formulario:
- Propietario/Arr.: ${propietarioArr}
- Marca: ${marca}
- Placa: ${placa}
- Color: ${color}

RESPONDE SOLO JSON:
{"cedula_ok":true,"vehiculo_match":true,"soat_vigente":true,"pagos_al_dia":true,"observaciones":""}`;

      const partes = [
        { text: prompt },
        { inlineData: { data: archivoExpediente.data, mimeType: archivoExpediente.mimeType || 'application/pdf' } }
      ];

      const result = await this.model.generateContent(partes);
      const parsed = this.extraerJson(result.response.text());

      return {
        cedula_ok: Boolean(parsed.cedula_ok),
        vehiculo_match: Boolean(parsed.vehiculo_match),
        soat_vigente: Boolean(parsed.soat_vigente),
        pagos_al_dia: Boolean(parsed.pagos_al_dia),
        observaciones: parsed.observaciones || ''
      };
    } catch (error) {
      return {
        cedula_ok: false,
        vehiculo_match: false,
        soat_vigente: false,
        pagos_al_dia: false,
        observaciones: `Error IA: ${error.message}`
      };
    }
  }
}
