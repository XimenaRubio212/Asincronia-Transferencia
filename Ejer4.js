// Datos de entrada: identificador del pedido y tiempos estimados para cada etapa (en ms)
const pedido = {
  id: "ORD-789",
  tiempos: {
    stock: 700,
    costos: 900,
    recomendaciones: 1500,
    factura: 500
  }
};

// Validación de disponibilidad de productos en inventario
// Puede fallar si no hay stock suficiente
const validarStock = () => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const disponible = Math.random() > 0.1; // 90% de probabilidad de éxito
      if (disponible) {
        resolve({ paso: "stock", exito: true, stock: 23 });
      } else {
        reject({ paso: "stock", exito: false, error: "Stock insuficiente" });
      }
    }, pedido.tiempos.stock);
  });

// Cálculo del total del pedido (impuestos, descuentos, etc.)
// Siempre exitoso en este flujo
const calcularCostos = () => 
  new Promise(resolve => {
    setTimeout(() => {
      resolve({ paso: "costos", exito: true, total: 42500 });
    }, pedido.tiempos.costos);
  });

// Generación de sugerencias personalizadas al cliente
// No bloquea el flujo principal y se ejecuta en paralelo con la facturación
const generarRecomendaciones = () => 
  new Promise(resolve => {
    setTimeout(() => {
      resolve({
        paso: "recomendaciones",
        exito: true,
        items: ["Combo Familiar", "Postre Premium"]
      });
    }, pedido.tiempos.recomendaciones);
  });

// Emisión de la factura electrónica
// Requiere que los pasos anteriores (stock y costos) hayan sido exitosos
// Puede fallar por errores en el servicio externo de facturación
const enviarFactura = (datos) => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const exito = Math.random() > 0.05; // 95% de probabilidad de éxito
      if (exito) {
        const numeroFactura = `FAC-${pedido.id}-${Date.now().toString().slice(-4)}`;
        resolve({
          paso: "factura",
          exito: true,
          factura: numeroFactura
        });
      } else {
        reject({ paso: "factura", exito: false, error: "Error en servicio de facturación" });
      }
    }, pedido.tiempos.factura);
  });

// Procesa un pedido siguiendo un flujo con dependencias:
// - stock - costos - factura (secuencia obligatoria)
// - recomendaciones se inicia tras costos, pero no bloquea la factura
async function procesarPedido(pedido) {
  console.log(`→ Iniciando procesamiento del pedido ${pedido.id}...\n`);

  const log = []; // Registra cada paso completado, en orden real de finalización
  const inicio = Date.now(); // Para medir duración total del proceso

  try {
    //Validar stock (requisito previo para continuar)
    const stockResult = await validarStock();
    log.push(stockResult);
    console.log(`Stock validado: ${stockResult.stock} unidades disponibles`);

    //Calcular costos (depende del stock verificado)
    const costosResult = await calcularCostos();
    log.push(costosResult);
    console.log(`Costos calculados: $${costosResult.total}`);

    //Iniciar generación de recomendaciones (no obligatorio, no bloqueante)
    // Se lanza aquí para aprovechar tiempo, pero no se espera aún
    const promesaRecomendaciones = generarRecomendaciones();

    //Emitir factura (requiere stock y costos validados)
    const facturaResult = await enviarFactura({ stock: stockResult, costos: costosResult });
    log.push(facturaResult);
    console.log(`Factura generada: ${facturaResult.factura}`);

    // Ahora sí se espera el resultado de recomendaciones (ya se estaba ejecutando en paralelo)
    const recResult = await promesaRecomendaciones;
    log.push(recResult);
    console.log(`Recomendaciones: ${recResult.items.join(", ")}`);

    // Cálculo del tiempo total desde el inicio hasta la finalización de todos los pasos
    const fin = Date.now();
    const duracion = fin - inicio;

    console.log(`\nPedido ${pedido.id} procesado exitosamente`);
    console.log(`Tiempo total: ${duracion}ms`);
    console.log(`Flujo real de ejecución:`, log.map(l => l.paso));

    // Retorna un objeto con información estructurada para auditoría o integración
    return {
      exito: true,
      factura: facturaResult.factura,
      flujo: log.map(l => l.paso),          // Orden cronológico de finalización
      tiempoTotal: duracion,
      resultados: log                       // Detalle de cada etapa
    };

  } catch (error) {
    // Si cualquier paso obligatorio falla, se interrumpe el flujo
    const fin = Date.now();
    const duracion = fin - inicio;

    console.log(`\nError en el paso '${error.paso}': ${error.error}`);
    console.log(`Tiempo hasta fallo: ${duracion}ms`);

    return {
      exito: false,
      error,
      tiempoHastaFallo: duracion,
      flujoParcial: log.map(l => l.paso)   // Pasos completados antes del error
    };
  }
}

// Ejecuta el procesamiento del pedido
procesarPedido(pedido);