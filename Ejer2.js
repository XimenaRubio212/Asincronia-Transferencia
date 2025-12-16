// Lista de paquetes a entregar, con identificador y tiempo de entrega simulado (ms)
const paquetes = [
  { id: "Paque01", tiempo: 1500 },
  { id: "Paque02", tiempo: 900 },
  { id: "Paque03", tiempo: 1800 },
  { id: "Paque04", tiempo: 700 }
];

// Función asíncrona que simula entregas concurrentes (en paralelo)
async function entregarPaquetes(paquetes) {
  console.log("→ Iniciando entregas en paralelo...\n");

  const inicioGlobal = Date.now(); // Registra el momento de inicio del proceso total

  // Función interna: simula la entrega de un paquete con retraso y posible fallo
  const entregar = async (paquete) => {
    const inicio = Date.now(); // Marca el inicio de esta entrega específica

    // Retornamos una promesa que se resolverá tras el tiempo simulado
    return new Promise(resolve => {
      // 10% de probabilidad de fallo (simulación realista de errores)
      const falla = Math.random() < 0.1;

      setTimeout(() => {
        const fin = Date.now();
        const duracion = fin - inicio;

        if (falla) {
          console.log(`Error al entregar ${paquete.id}`);
          // Resolvemos con objeto de error (no rechazamos, para no romper Promise.all)
          resolve({
            id: paquete.id,
            exito: false,
            error: "Falla en reparto",
            duracion,
            fin // Necesario para ordenar después
          });
        } else {
          console.log(`${paquete.id} entregado en ${duracion}ms`);
          resolve({
            id: paquete.id,
            exito: true,
            duracion,
            fin
          });
        }
      }, paquete.tiempo);
    });
  };

  // Lanzamos todas las entregas *al mismo tiempo* (sin await aún)
  const promesas = paquetes.map(entregar); // Crea un array de promesas

  // Esperamos a que *todas* terminen (éxitos y fallos incluidos)
  const resultadosSinOrdenar = await Promise.all(promesas);

  // Ordenamos los resultados por momento de finalización (para saber quién terminó primero)
  const resultadosOrdenados = resultadosSinOrdenar
    .sort((a, b) => a.fin - b.fin) // De menor a mayor tiempo de finalización
    .map((r, i) => ({ ...r, orden: i + 1 })); // Añadimos número de orden (1°, 2°, etc.)

  const finGlobal = Date.now();
  const total = finGlobal - inicioGlobal;

  // Mostramos el orden real en que *terminaron* las entregas (no el de inicio)
  console.log("\nOrden real de finalización:");
  resultadosOrdenados.forEach(r => {
    console.log(`${r.orden}. ${r.id} — ${r.exito ? "" : ""} (${r.duracion}ms)`);
  });

  // Clasificamos resultados para el informe
  const exitosos = resultadosOrdenados.filter(r => r.exito);
  const fallidos = resultadosOrdenados.filter(r => !r.exito);

  // Generamos informe consolidado (útil para logs, tests o UI posterior)
  const informe = {
    entregados: exitosos.length,
    fallidos: fallidos.length,
    exitosos: exitosos.map(r => r.id), // Solo IDs de los exitosos
    fallidos: fallidos.map(r => ({ id: r.id, error: r.error })), // Detalle de fallos
    ordenFinalizacion: resultadosOrdenados.map(r => r.id), // Secuencia real de terminación
    tiempoTotal: total // Tiempo desde que empezó hasta que la última terminó
  };

  console.log("\nInforme final:", informe);
  return informe;
}

// Ejecutamos la simulación
entregarPaquetes(paquetes);