import type { APIRoute } from 'astro';

export const prerender = false; // Forza a este endpoint a ser dinámico (Server-Side)

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const nombre = data.get('nombre')?.toString();
    const empresa = data.get('empresa')?.toString();
    const correo = data.get('correo')?.toString();
    const telefono = data.get('telefono')?.toString();
    const unidad = data.get('unidad')?.toString();
    const ruta = data.get('ruta')?.toString();

    // Validaciones básicas del lado del servidor
    if (!nombre || !empresa || !correo || !telefono || !unidad) {
      return new Response(
        JSON.stringify({ message: 'Faltan campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Soporte para múltiples correos separados por comas
    const destinatarios = import.meta.env.PREFERED_RECEIVER_EMAIL
      .split(',')
      .map((correo: string) => ({ email: correo.trim(), name: "Ventas MAFRA" }));

    // Configuración de la petición a la API de Brevo (v3)
    const brevoPayload = {
      sender: { name: "MAFRA LP Lead", email: "noreply@futurite.info" },
      to: destinatarios,
      subject: `Nueva Cotización Industrial: ${empresa}`,
      htmlContent: `
        <h3>Información del Lead de Logística</h3>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Empresa:</strong> ${empresa}</p>
        <p><strong>Correo:</strong> ${correo}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Tipo de Unidad:</strong> ${unidad}</p>
        <p><strong>Ruta solicitada:</strong> ${ruta || 'No especificada'}</p>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': import.meta.env.BREVO_API_KEY || '',
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Brevo:', errorText);
      return new Response(
        JSON.stringify({ message: 'Error al enviar el correo a través del proveedor.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Cotización enviada con éxito.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en el endpoint:', error);
    return new Response(
      JSON.stringify({ message: 'Error interno del servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
