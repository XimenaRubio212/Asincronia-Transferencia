// Datos del usuario a validar (entrada del formulario)
const usuario = {
  correo: "darcy@gmail.com",
  documento: "123456789",
  nombre: "darcy rubio"
};

// Tiempos simulados de respuesta de los servicios externos (en ms)
const tiempos = {
  correo: 800,         // Servicio de validación de correo
  documento: 1100,     // Servicio de verificación de documento
  disponibilidad: 600  // Servicio de registro global (nombres únicos)
};

//validación de correo (rechaza si no tiene '@' o es muy corto)
const validarCorreo = (correo) => 
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const valido = correo.includes("@") && correo.length > 5;
      if (valido) {
        resolve({ campo: "correo", valido: true, valor: correo });
      } else {
        reject({ campo: "correo", valido: false, error: "Correo inválido" });
      }
    }, tiempos.correo); // Simula latencia de red/servicio
  });

//validación de documento (acepta solo 6 a 10 dígitos)
const validarDocumento = (doc) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      //devuelve true si cumple el formato
      //es un metodo de validacion qeu asegura que el campo documento contenga solo numeros
      //y que su longitud este comprendida entre 6 y 10
      const valido = /^\d{6,10}$/.test(doc);
      if (valido) {
        resolve({ campo: "documento", valido: true, valor: doc });
      } else {
        reject({ campo: "documento", valido: false, error: "Documento no cumple formato" });
      }
    }, tiempos.documento);
  });

//validación de disponibilidad (nombre único → "Ana López" está ocupado)
const validarDisponibilidad = (nombre) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const disponible = nombre !== "Ana López"; 
      if (disponible) {
        resolve({ campo: "disponibilidad", valido: true, valor: nombre });
      } else {
        reject({ campo: "disponibilidad", valido: false, error: "Nombre ya registrado" });
      }
    }, tiempos.disponibilidad);
  });

//ejecuta las 3 validaciones en paralelo y decide el resultado final
async function validarFormulario(usuario) {
  console.log("Iniciando validación del formulario en paralelo...\n");

  const inicio = Date.now(); // Marca el inicio para medir rendimiento

  // Lanzamos las 3 validaciones al mismo tiempo
  // `.catch(err => err)` convierte rechazos en resoluciones con el error (evita que falle Promise.all)
  const promesas = [
    validarCorreo(usuario.correo).catch(err => err),
    validarDocumento(usuario.documento).catch(err => err),
    validarDisponibilidad(usuario.nombre).catch(err => err)
  ];

  // `Promise.allSettled` espera a que *todas* terminen (éxitos o fallos), sin interrumpirse
  const resultados = await Promise.allSettled(promesas);

  // Normalizamos los resultados: tanto éxitos (`value`) como fallos (`reason`) quedan como objetos
  const estados = resultados.map(r => 
    r.status === "fulfilled" ? r.value : r.reason
  );

  //Determinamos si *todas* las validaciones fueron exitosas
  const todasValidas = estados.every(e => e.valido === true);

  const fin = Date.now();
  const duracion = fin - inicio;

  // Mostramos el estado de cada validación
  console.log("Estados individuales:");
  estados.forEach(e => {
    console.log(`- ${e.campo}: ${e.valido ? "válido" : `${e.error}`}`);
  });

  // Resultado global
  const resultadoFinal = todasValidas ? "Formulario validado" : "Validación fallida";
  console.log(`\nResultado final: ${resultadoFinal}`);
  console.log(`Tiempo total: ${duracion}ms`);

  // Retornamos un objeto estructurado para integración con UI o tests
  return {
    estados,          // Detalle de cada campo
    exito: todasValidas,
    resultado: resultadoFinal,
    tiempoTotal: duracion
  };
}

// Ejecutamos la validación
validarFormulario(usuario);