// Lista de solicitudes con nombre y tiempo de atención simulado (en milisegundos)
const solicitudes = [
  { usuario: "ximena", tiempo: 800 },
  { usuario: "darcy", tiempo: 1200 },
  { usuario: "michi", tiempo: 600 }
];

// Función asíncrona que procesa las solicitudes una tras otra como una cola secuencial
async function gestionarCola(solicitudes) {
  console.log("Iniciando gestión de cola de atención...\n");

  const log = []; // Almacena detalles de cada atención (para el reporte final)
  const inicioGlobal = Date.now(); // Marca el inicio del proceso completo

  // Recorremos cada solicitud en orden (una a la vez)
  for (const solicitud of solicitudes) {
    const inicio = Date.now(); // Tiempo de inicio de esta solicitud específica
    console.log(`[INICIO] Atendiendo a ${solicitud.usuario}...`);

    // Usamos `await` para pausar el bucle hasta que termine esta solicitud
    await new Promise(resolve => {
      // Simulamos el tiempo de atención con `setTimeout`
      setTimeout(() => {
        const fin = Date.now(); // Momento en que termina la atención
        const duracion = fin - inicio; // Duración real (puede variar mínimamente)

        console.log(`[FIN] ${solicitud.usuario} atendido. Tiempo: ${duracion}ms`);

        // Guardamos el registro de esta solicitud
        log.push({
          usuario: solicitud.usuario,
          inicio: new Date(inicio).toISOString().slice(11, 19),
          fin: new Date(fin).toISOString().slice(11, 19),
          duracion
        });

        resolve(); // Marca la promesa como cumplida → permite continuar el bucle
      }, solicitud.tiempo); // Tiempo simulado asignado a esta solicitud
    });
  }

  // Calculamos el tiempo total desde el inicio hasta el final del proceso
  const finGlobal = Date.now();
  const duracionTotal = finGlobal - inicioGlobal;

  // Mostramos el orden de atención y tiempos individuales
  console.log("\nOrden real de atención:");
  log.forEach((item, i) => {
    console.log(`${i + 1}. ${item.usuario} — ${item.duracion}ms`);
  });

  console.log(`\nTiempo total del proceso: ${duracionTotal}ms`);

  // Retornamos los datos para posible uso posterior (ej: tests, logs)
  return {
    orden: log.map(l => l.usuario), // Solo los nombres en orden
    tiempos: log,                   // Detalle cronológico
    total: duracionTotal            // Duración acumulada
  };
}

// Ejecutamos la función
gestionarCola(solicitudes);