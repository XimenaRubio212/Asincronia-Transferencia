// Parámetros de configuración para la integración
// usuarioId: identificador único del usuario a consultar
//tiempos: duración estimada (en ms) de cada servicio
//fallarServicio: permite forzar un fallo en un servicio específico (para pruebas)
const params = {
  usuarioId: "USR-1024",
  tiempos: {
    A: 600,  // Servicio de disponibilidad de recursos
    B: 1000, // Servicio de información del usuario
    C: 800,  // Servicio de historial de acciones
    D: 1200  // Servicio de recomendaciones (depende de B y C)
  },
  fallarServicio: null // Valores posibles: "A", "B", "C", "D", o null (sin fallos)
};

//verifica si los recursos necesarios están disponibles
const servicioA = () => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (params.fallarServicio === "A") {
        reject({ servicio: "A", error: "Timeout en disponibilidad" });
      } else {
        resolve({
          servicio: "A",
          disponible: true,
          recursos: ["API", "DB", "Cache"]
        });
      }
    }, params.tiempos.A);
  });

//obtiene los datos básicos del usuario
const servicioB = () => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (params.fallarServicio === "B") {
        reject({ servicio: "B", error: "Usuario no encontrado" });
      } else {
        resolve({
          servicio: "B",
          usuario: { id: params.usuarioId, nombre: "Mario", rol: "cliente" }
        });
      }
    }, params.tiempos.B);
  });

//recupera el historial de interacciones del usuario
const servicioC = () => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (params.fallarServicio === "C") {
        reject({ servicio: "C", error: "Base de datos caída" });
      } else {
        resolve({
          servicio: "C",
          historial: [
            { accion: "login", fecha: "2025-12-15" },
            { accion: "compra", monto: 35000 }
          ]
        });
      }
    }, params.tiempos.C);
  });

//genera recomendaciones personalizadas
// Depende de los resultados de los servicios B (usuario) y C (historial)
const servicioD = (datosB, datosC) => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (params.fallarServicio === "D") {
        reject({ servicio: "D", error: "Motor de ML no responde" });
      } else {
        // Lógica de negocio: si hay compras en el historial, se ofrecen promociones
        const recomendaciones = datosC.historial.some(h => h.accion === "compra")
          ? ["Oferta premium", "Descuento en próxima compra"]
          : ["Bienvenido", "Guía de inicio"];
        resolve({
          servicio: "D",
          recomendaciones,
          basadoEn: [datosB.usuario.nombre, datosC.historial.length + " acciones"]
        });
      }
    }, params.tiempos.D);
  });

//orquesta la integración de los cuatro servicios
//A, B y C se ejecutan en paralelo
//D se ejecuta después, una vez disponibles los resultados de B y C
async function integrarServicios(params) {
  console.log(`→ Integrando servicios para usuario ${params.usuarioId}...\n`);

  const inicioGlobal = Date.now(); // Para medir el tiempo total de integración
  const resultados = {};           // Almacena los resultados parciales por servicio

  try {
    //Invocar servicios A, B y C concurrentemente
    // Se agrega la marca de tiempo de finalización a cada resultado
    const [resA, resB, resC] = await Promise.all([
      servicioA().then(r => ({ ...r, fin: Date.now() })),
      servicioB().then(r => ({ ...r, fin: Date.now() })),
      servicioC().then(r => ({ ...r, fin: Date.now() }))
    ]);

    // Registrar los resultados obtenidos
    resultados.A = resA;
    resultados.B = resB;
    resultados.C = resC;

    console.log(`✅ Servicio A terminado (${resA.fin - inicioGlobal}ms)`);
    console.log(`✅ Servicio B terminado (${resB.fin - inicioGlobal}ms)`);
    console.log(`✅ Servicio C terminado (${resC.fin - inicioGlobal}ms)`);

    //Ejecutar servicio D, que requiere datos de B y C
    const inicioD = Date.now();
    const resD = await servicioD(resB, resC);
    resD.fin = Date.now();
    resultados.D = resD;

    console.log(`Servicio D terminado (${resD.fin - inicioD}ms)`);

    // Determinar el orden real en que finalizaron los servicios
    const ordenFinalizacion = Object.values(resultados)
      .sort((x, y) => x.fin - y.fin)
      .map(r => r.servicio);

    const finGlobal = Date.now();
    const total = finGlobal - inicioGlobal;

    // Construir informe consolidado con los datos relevantes
    const informe = {
      usuario: resB.usuario,
      disponible: resA.disponible,
      historial: resC.historial,
      recomendaciones: resD.recomendaciones,
      tiempoPorServicio: {
        A: resA.fin - inicioGlobal,
        B: resB.fin - inicioGlobal,
        C: resC.fin - inicioGlobal,
        D: resD.fin - inicioD
      },
      ordenFinalizacion,
      tiempoTotal: total,
      estado: "Integración exitosa"
    };

    // Mostrar resumen estructurado en consola
    console.log("\nInforme central:");
    console.log(`Usuario: ${informe.usuario.nombre}`);
    console.log(`Disponible: ${informe.disponible ? "Sí" : "No"}`);
    console.log(`Recomendaciones: ${informe.recomendaciones.join(", ")}`);
    console.log(`Tiempo total: ${total}ms`);
    console.log(`Orden de finalización: ${ordenFinalizacion.join(" → ")}`);

    return {
      exito: true,
      informe,
      resultados
    };

  } catch (error) {
    // Si algún servicio falla, se captura el error y se reporta el estado parcial
    const fin = Date.now();
    const total = fin - inicioGlobal;

    console.log(`\nFalló el servicio ${error.servicio}: ${error.error}`);
    console.log(`Tiempo hasta fallo: ${total}ms`);

    return {
      exito: false,
      error,
      resultadosParciales: resultados,
      tiempoHastaFallo: total
    };
  }
}

// Ejecutar integración (sin fallos por defecto)
integrarServicios(params);