import "dotenv/config";
import { db } from "../db";
import { banners } from "../db/schema";

const noticias = [
  {
    id: "noticia_agbc_1",
    titulo: "AGBC procesó más de 75.000 envíos postales y consolida su cobertura nacional e internacional",
    descripcion: "La Agencia Boliviana de Correos (AGBC) presentó su balance operativo anual destacando la distribución efectiva de correspondencia, encomiendas y paquetería urgente en los 9 departamentos del país, fortaleciendo la integración territorial y los despachos a nivel global.",
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "1",
    createdAt: new Date("2026-03-01T10:00:00Z"),
    updatedAt: new Date("2026-03-01T10:00:00Z"),
  },
  {
    id: "noticia_agbc_2",
    titulo: "Lanzamiento del nuevo Sistema de Rastreo Digital 'TrackingBO 2.0'",
    descripcion: "Se implementó la versión renovada de la plataforma TrackingBO con seguimiento en tiempo real, notificaciones automáticas por código QR y geolocalización de paquetes para todos los envíos ordinarios y certificados.",
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://trackingbo.correos.gob.bo",
    activo: true,
    orden: "2",
    createdAt: new Date("2026-02-24T14:30:00Z"),
    updatedAt: new Date("2026-02-24T14:30:00Z"),
  },
  {
    id: "noticia_agbc_3",
    titulo: "Emisión de Sellos Postales Conmemorativos del Bicentenario de Bolivia",
    descripcion: "La AGBC presentó una exclusiva serie filatélica de colección que rinde homenaje a los 200 años de historia patria, monumentos emblemáticos, flora, fauna y figuras históricas que forjaron la identidad nacional.",
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo/filatelia",
    activo: true,
    orden: "3",
    createdAt: new Date("2026-02-18T09:00:00Z"),
    updatedAt: new Date("2026-02-18T09:00:00Z"),
  },
  {
    id: "noticia_agbc_4",
    titulo: "Alerta Institucional a la Población contra Estafas Digitales de 'Paquetes Perdidos'",
    descripcion: "La Dirección General de la AGBC exhorta a la ciudadanía a no dejarse engañar por páginas apócrifas en redes sociales. Se recuerda que la institución no subasta paquetes ni solicita depósitos bancarios mediante enlaces no oficiales.",
    imagen: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "4",
    createdAt: new Date("2026-02-12T16:20:00Z"),
    updatedAt: new Date("2026-02-12T16:20:00Z"),
  },
  {
    id: "noticia_agbc_5",
    titulo: "Modernización de los Centros de Tratamiento Postal en La Paz, Santa Cruz y Cochabamba",
    descripcion: "Concluyó la instalación de nuevos módulos automatizados de clasificación y pesaje digital en los centros neurálgicos del eje troncal, reduciendo en un 40% los tiempos de recepción y despacho de paquetería.",
    imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "5",
    createdAt: new Date("2026-02-05T11:15:00Z"),
    updatedAt: new Date("2026-02-05T11:15:00Z"),
  },
  {
    id: "noticia_agbc_6",
    titulo: "Firma de Convenio de Cooperación con la Unión Postal Universal (UPU)",
    descripcion: "Bolivia consolida estándares internacionales de calidad postal, intercambio de datos anticipados para aduanas y programas de asistencia técnica global mediante acuerdo bilateral con la UPU.",
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "6",
    createdAt: new Date("2026-01-28T08:45:00Z"),
    updatedAt: new Date("2026-01-28T08:45:00Z"),
  },
  {
    id: "noticia_agbc_7",
    titulo: "Inauguración de Nuevos Puntos de Atención y Renovación de Casillas Postales",
    descripcion: "En el marco del plan de expansión comunitaria, se habilitaron ventanillas de atención extendida y modernas casillas postales inteligentes para profesionales y empresas en Chuquisaca, Oruro, Potosí, Tarija, Beni y Pando.",
    imagen: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "7",
    createdAt: new Date("2026-01-20T15:00:00Z"),
    updatedAt: new Date("2026-01-20T15:00:00Z"),
  },
  {
    id: "noticia_agbc_8",
    titulo: "Exposición Filatélica Nacional 'Historia y Memoria Postal de Bolivia'",
    descripcion: "Más de 5.000 piezas históricas, cartas de la época republicana y estampillas únicas fueron exhibidas con gran acogida en el Palacio de Comunicaciones de La Paz en conmemoración de la tradición epistolar del país.",
    imagen: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1582560475093-ba66accbc424?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo/filatelia",
    activo: true,
    orden: "8",
    createdAt: new Date("2026-01-14T10:30:00Z"),
    updatedAt: new Date("2026-01-14T10:30:00Z"),
  },
  {
    id: "noticia_agbc_9",
    titulo: "Capacitación Nacional a Funcionarios en Logística, Trazabilidad y Seguridad Postal",
    descripcion: "Más de 200 servidores públicos de la AGBC completaron el ciclo intensivo de actualización en normativa aduanera internacional, protocolos de ciberseguridad y atención con calidez al usuario.",
    imagen: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "9",
    createdAt: new Date("2026-01-08T12:00:00Z"),
    updatedAt: new Date("2026-01-08T12:00:00Z"),
  },
  {
    id: "noticia_agbc_10",
    titulo: "Alianza Estratégica con Microempresarios y PYMEs con el Programa 'Correo Emprendedor'",
    descripcion: "La AGBC habilitó tarifas preferenciales, recolección a domicilio y asesoría aduanera para impulsar la exportación de artesanías, textiles y productos bolivianos al mercado internacional.",
    imagen: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "10",
    createdAt: new Date("2025-12-22T09:30:00Z"),
    updatedAt: new Date("2025-12-22T09:30:00Z"),
  },
  {
    id: "noticia_agbc_11",
    titulo: "Iniciativa 'Correos Verde': Implementación de Embalajes Biodegradables y Rutas Eco-Eficientes",
    descripcion: "Comprometidos con el medio ambiente, la Agencia inició la transición hacia sobres 100% reciclables y optimización de flotas de transporte terrestre para reducir la huella de carbono en la distribución nacional.",
    imagen: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "11",
    createdAt: new Date("2025-12-15T14:00:00Z"),
    updatedAt: new Date("2025-12-15T14:00:00Z"),
  },
  {
    id: "noticia_agbc_12",
    titulo: "Rendición Pública de Cuentas Final: Eficiencia, Cobertura y Transformación Digital AGBC",
    descripcion: "En acto público transmitido a nivel nacional, la Máxima Autoridad Ejecutiva presentó los logros alcanzados en modernización tecnológica, sostenibilidad financiera y universalización del servicio postal en Bolivia.",
    imagen: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
    imagenes: JSON.stringify([
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop"
    ]),
    enlace: "https://correos.gob.bo",
    activo: true,
    orden: "12",
    createdAt: new Date("2025-12-05T11:00:00Z"),
    updatedAt: new Date("2025-12-05T11:00:00Z"),
  },
  // ── 12 NOTICIAS DE REDES SOCIALES (FACEBOOK OFICIAL AGBC - ID: 61592782342439) ──
  {
    id: "noticia_fb_1",
    titulo: "¡Tu aliado logístico ideal ya está aquí! 📦✨ Delivery Express para hacer crecer tu negocio",
    descripcion: "¡Tu aliado logístico ideal ya está aquí! 📦✨ Enfócate en lo más importante: ¡hacer crecer tu negocio y vender más! 🚀 De la logística y los envíos nos encargamos nosotros con total seguridad y cobertura en las 9 capitales. ¡Contáctanos hoy mismo!",
    imagen: "/image/facebook/fb_exact_1.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_1.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/19ywEfjBZx/",
    activo: true,
    orden: "13",
    createdAt: new Date("2026-03-08T18:00:00Z"),
    updatedAt: new Date("2026-03-08T18:00:00Z"),
  },
  {
    id: "noticia_fb_2",
    titulo: "🎥 Reel Oficial: Proceso de recepción, clasificación y despacho de correspondencia y paquetería",
    descripcion: "🎥 ¡Descubre cómo cuidamos y trasladamos tu correspondencia y paquetes! Nuestro equipo logístico te muestra todo el recorrido desde que llega a nuestro Centro de Tratamiento Postal hasta que sale en ruta.",
    imagen: "/image/facebook/fb_exact_2.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_2.jpg"
    ]),
    enlace: "https://www.facebook.com/share/r/19SHiCD6sx/",
    activo: true,
    orden: "14",
    createdAt: new Date("2026-03-07T16:30:00Z"),
    updatedAt: new Date("2026-03-07T16:30:00Z"),
  },
  {
    id: "noticia_fb_3",
    titulo: "Correos de Bolivia estrena nueva imagen y entra de lleno a la era digital: Delivery Express & Postal Shopper",
    descripcion: "Correos de Bolivia estrena una nueva imagen y entra de lleno a la era digital. Delivery Express para impulsar el comercio electrónico interno. Postal Shopper para conectar a Bolivia con las tiendas internacionales.",
    imagen: "/image/facebook/fb_exact_3.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_3.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1CGBgVQnNy/",
    activo: true,
    orden: "15",
    createdAt: new Date("2026-03-06T14:00:00Z"),
    updatedAt: new Date("2026-03-06T14:00:00Z"),
  },
  {
    id: "noticia_fb_4",
    titulo: "Comunicado Oficial: Modificación en el Horario de Atención en la Oficina Central de La Paz",
    descripcion: "A nuestra clientela de la oficina central en La Paz, por favor tomen nota que, este fin de semana tendremos cambios en nuestro horario de atención en ventanillas. Tomen sus previsiones y compartan esta información.",
    imagen: "/image/facebook/fb_exact_4.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_4.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1BpKrpg1G5/",
    activo: true,
    orden: "16",
    createdAt: new Date("2026-03-05T12:00:00Z"),
    updatedAt: new Date("2026-03-05T12:00:00Z"),
  },
  {
    id: "noticia_fb_5",
    titulo: "🕊️ Nota de Duelo Institucional: Sentidas condolencias a la familia Lazarte Bernal",
    descripcion: "🕊️ #CorreosDeBolivia expresa sus más sentidas condolencias por el sensible fallecimiento de la Sra. Laura Adelaida Bernal Murguía de Lazarte, tía de nuestro Director General Ejecutivo. Enviamos un abrazo fraterno a la familia doliente.",
    imagen: "/image/facebook/fb_exact_5.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_5.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1Mn6iXVRAZ/",
    activo: true,
    orden: "17",
    createdAt: new Date("2026-03-04T10:15:00Z"),
    updatedAt: new Date("2026-03-04T10:15:00Z"),
  },
  {
    id: "noticia_fb_6",
    titulo: "🎥 Reel Expectativa: Proyecto Gigante Postal Shopper (Bolivia - Miami)",
    descripcion: "Hemos estado preparando un proyecto gigante que cambiará las reglas del juego. La distancia está a punto de desaparecer y una nueva forma de conectarte con el mundo viene en camino. 🌎🇧🇴 Miami - Bolivia. ¡Activa las notificaciones!",
    imagen: "/image/facebook/fb_exact_6.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_6.jpg"
    ]),
    enlace: "https://www.facebook.com/share/r/1CXAzSLJFN/",
    activo: true,
    orden: "18",
    createdAt: new Date("2026-03-03T19:00:00Z"),
    updatedAt: new Date("2026-03-03T19:00:00Z"),
  },
  {
    id: "noticia_fb_7",
    titulo: "Detrás de cada pedido hay un emprendedor boliviano con ganas de salir adelante",
    descripcion: "Detrás de cada pedido hay un emprendedor. 💛 Y detrás de cada emprendedor, hay muchas ganas de salir adelante. Por eso, cuando haces una venta, nosotros te ayudamos a llevarla hasta la puerta de tu cliente. 📦🚚",
    imagen: "/image/facebook/fb_exact_7.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_7.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1GWv38q8XR/",
    activo: true,
    orden: "19",
    createdAt: new Date("2026-03-02T15:30:00Z"),
    updatedAt: new Date("2026-03-02T15:30:00Z"),
  },
  {
    id: "noticia_fb_8",
    titulo: "🎥 Reel Oficial: ¡Ey, tenemos una sorpresa para ti! Algo nuevo está llegando con Correos de Bolivia",
    descripcion: "👀 ¡Ey, ey… tenemos una sorpresa para ti! 🤫 Algo nuevo está llegando con Correos de Bolivia. 💛💙 Todavía no podemos contarte todo, pero te dejamos una pista... 🚀 ¡Prepárate, porque se viene algo increíble! #PostalShopper",
    imagen: "/image/facebook/fb_exact_8.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_8.jpg"
    ]),
    enlace: "https://www.facebook.com/share/r/1BiGr7LQYY/",
    activo: true,
    orden: "20",
    createdAt: new Date("2026-03-01T17:45:00Z"),
    updatedAt: new Date("2026-03-01T17:45:00Z"),
  },
  {
    id: "noticia_fb_9",
    titulo: "Comunicado Oficial: Cronograma de Atención por la Festividad de Ch'utillos en Potosí",
    descripcion: "💛💙 ¡Correos de Bolivia informa! 📢 Queremos comunicar a nuestros queridos usuarios y clientes que, con motivo de la festividad de San Bartolomé y San Ignacio de Loyola (Ch’utillos), la atención en nuestras sucursales tendrá cronograma especial.",
    imagen: "/image/facebook/fb_exact_9.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_9.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1MNWL8W8dr/",
    activo: true,
    orden: "21",
    createdAt: new Date("2026-02-27T11:00:00Z"),
    updatedAt: new Date("2026-02-27T11:00:00Z"),
  },
  {
    id: "noticia_fb_10",
    titulo: "🎉 ¡Pum! ¡Te cayó una venta! ¿Y cómo se lo hago llegar? Fácil con Delivery Express",
    descripcion: "🎉 ¡Pum! ¡Te cayó una venta! 📦😍 Ahora viene la pregunta de siempre: “¿Y cómo se lo hago llegar?” 👀 Fácil. Para eso está Delivery Express. 🚚💙 Te registras en correos.gob.bo, eliges tu modalidad y ¡listo!",
    imagen: "/image/facebook/fb_exact_10.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_10.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/1DqHUMa7gX/",
    activo: true,
    orden: "22",
    createdAt: new Date("2026-02-25T16:00:00Z"),
    updatedAt: new Date("2026-02-25T16:00:00Z"),
  },
  {
    id: "noticia_fb_11",
    titulo: "🎥 Reel: ¡Regístrate, elige tu modalidad y pon tu venta en camino con Delivery Express!",
    descripcion: "👉 ¡Regístrate, elige tu modalidad y pon tu venta en camino! Envíos rápidos, seguros y económicos para todas tus ventas online en las 9 capitales. Visita correos.gob.bo",
    imagen: "/image/facebook/fb_exact_11.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_11.jpg"
    ]),
    enlace: "https://www.facebook.com/share/r/1Dk54LrC3b/",
    activo: true,
    orden: "23",
    createdAt: new Date("2026-02-22T14:30:00Z"),
    updatedAt: new Date("2026-02-22T14:30:00Z"),
  },
  {
    id: "noticia_fb_12",
    titulo: "¿Vendes online? ¡Nosotros llevamos tu venta por ti con Delivery Express de Correos de Bolivia!",
    descripcion: "📦✨ ¿Vendes online? ¡Nosotros llevamos tu venta por ti! 💛💙 Con Delivery Express de Correos de Bolivia, enviar tus productos es fácil, rápido y seguro. 🚚📦 👉 Regístrate, elige tu modalidad y ¡pon tu venta en camino!",
    imagen: "/image/facebook/fb_exact_12.jpg",
    imagenes: JSON.stringify([
      "/image/facebook/fb_exact_12.jpg"
    ]),
    enlace: "https://www.facebook.com/share/p/19MxE3AbEp/",
    activo: true,
    orden: "24",
    createdAt: new Date("2026-02-18T10:00:00Z"),
    updatedAt: new Date("2026-02-18T10:00:00Z"),
  }
];

const accesos = [
  {
    clave: "acceso_sigec",
    titulo: "SIGEC - Correspondencia",
    descripcion: "Sistema oficial de gestión, seguimiento y archivo de correspondencia institucional.",
    url: "https://sigec.correos.gob.bo/login?url=",
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_tracking",
    titulo: "TrackingBO - Rastreo Postal",
    descripcion: "Consulta y trazabilidad en tiempo real de encomiendas y paquetes postales.",
    url: "https://trackingbo.correos.gob.bo",
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_portal",
    titulo: "Portal Web Correos Bolivia",
    descripcion: "Sitio web institucional con servicios, sucursales y tarifas oficiales.",
    url: "https://correos.gob.bo/",
    imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_filatelia",
    titulo: "Filatelia Bolivia",
    descripcion: "Catálogo virtual de sellos postales, historia epistolar y colecciones de sellos.",
    url: "https://correos.gob.bo/filatelia",
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_sigep",
    titulo: "SIGEP - Gestión Pública",
    descripcion: "Sistema Integrado de Gestión Pública del Ministerio de Economía y Finanzas.",
    url: "https://sigep.gob.bo",
    imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_sicoes",
    titulo: "SICOES - Contrataciones",
    descripcion: "Sistema de Contrataciones Estatales para licitaciones y compras públicas.",
    url: "https://www.sicoes.gob.bo",
    imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_aduana",
    titulo: "Aduana Nacional de Bolivia",
    descripcion: "Plataforma SIDUNEA para control aduanero y nacionalización de paquetería.",
    url: "https://www.aduana.gob.bo",
    imagen: "https://images.unsplash.com/photo-1586528116493-a029325540fa?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_upu",
    titulo: "Unión Postal Universal (UPU)",
    descripcion: "Red internacional de intercambio de datos postales y trazabilidad global.",
    url: "https://www.upu.int",
    imagen: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_att",
    titulo: "ATT - Regulación Postal",
    descripcion: "Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes.",
    url: "https://www.att.gob.bo",
    imagen: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_siat",
    titulo: "SIAT en Línea - Impuestos",
    descripcion: "Servicio de Impuestos Nacionales para facturación electrónica y declaraciones.",
    url: "https://siat.impuestos.gob.bo",
    imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_gaceta",
    titulo: "Gaceta Oficial de Bolivia",
    descripcion: "Publicación oficial de leyes, decretos supremos y resoluciones normativas.",
    url: "http://www.gacetaoficialdebolivia.gob.bo",
    imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
  {
    clave: "acceso_mopp",
    titulo: "Ministerio de Obras Públicas",
    descripcion: "Órgano matriz para proyectos de infraestructura, comunicaciones y vivienda.",
    url: "https://www.oopp.gob.bo",
    imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
    activo: true,
  },
];

async function seed() {
  console.log("Iniciando inserción de 12 noticias oficiales...");
  await db.delete(banners);
  await db.insert(banners).values(noticias);
  console.log("¡12 noticias de la Agencia Boliviana de Correos insertadas con éxito!");

  console.log("Iniciando inserción de 12 accesos rápidos a sistemas...");
  const { configuracion } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  await db.delete(configuracion).where(eq(configuracion.grupo, "accesos_directos"));

  for (const a of accesos) {
    await db.insert(configuracion).values({
      clave: a.clave,
      grupo: "accesos_directos",
      descripcion: a.descripcion,
      valor: JSON.stringify({
        titulo: a.titulo,
        descripcion: a.descripcion,
        url: a.url,
        activo: a.activo,
        imagen: a.imagen,
      }),
    });
  }
  console.log("¡12 accesos rápidos insertados con éxito!");

  process.exit(0);
}

seed().catch(err => {
  console.error("Error al poblar datos:", err);
  process.exit(1);
});
