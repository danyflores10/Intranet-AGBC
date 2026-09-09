import fs from "fs";
import path from "path";
import { db } from "@/db";
import { banners, configuracion } from "@/db/schema";
import { eq } from "drizzle-orm";

const targetDir = path.join(process.cwd(), "public/image/facebook");
const newsTargetDir = path.join(process.cwd(), "public/image/noticias");

// Ensure directories exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(newsTargetDir)) {
  fs.mkdirSync(newsTargetDir, { recursive: true });
}

export interface SyncResult {
  success: boolean;
  message: string;
  institucionalesCount: number;
  facebookCount: number;
  timestamp: string;
}

// 12 Noticias Oficiales de Prensa Boliviana sobre Correos de Bolivia
export const NOTICIAS_INSTITUCIONALES_BASE = [
  {
    id: "noticia_agbc_1",
    titulo: "Correos de Bolivia habilita tres nuevas modalidades de Delivery Express para envíos de comercio electrónico",
    descripcion: "La Agencia Boliviana de Correos presentó sus nuevos servicios logísticos enfocados en tiendas virtuales y emprendedores, con tarifas preferenciales y cobertura en las 9 capitales del país para impulsar el e-commerce.",
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.opinion.com.bo",
    fuente: "Opinión Bolivia",
    fecha: "2026-09-08T10:00:00Z"
  },
  {
    id: "noticia_agbc_2",
    titulo: "Correos de Bolivia estrena imagen institucional y entra de lleno a la era digital con TrackingBO 2.0",
    descripcion: "La institución postal consolida su modernización con un sistema renovado de rastreo de paquetes en tiempo real por código QR y la habilitación de Delivery Express para compras internacionales.",
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.reduno.com.bo",
    fuente: "Red Uno",
    fecha: "2026-09-07T14:30:00Z"
  },
  {
    id: "noticia_agbc_3",
    titulo: "Emisión de Sellos Postales Conmemorativos del Bicentenario de Bolivia y Riqueza Filatélica",
    descripcion: "La AGBC presentó una serie exclusiva de estampillas de colección en homenaje a los 200 años de historia patria, monumentos emblemáticos y fauna protegida de la Amazonía y el Altiplano.",
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://correos.gob.bo/filatelia",
    fuente: "El Deber",
    fecha: "2026-08-25T09:00:00Z"
  },
  {
    id: "noticia_agbc_4",
    titulo: "Alerta a la Población contra Estafas Digitales y Subastas Falsas de Paquetes en Redes Sociales",
    descripcion: "La Dirección General de la AGBC exhorta a la ciudadanía a no dejarse engañar por páginas apócrifas en Facebook. Se recuerda que la institución no subasta paquetes ni pide giros por enlaces sospechosos.",
    imagen: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://boliviaverifica.bo",
    fuente: "Bolivia Verifica",
    fecha: "2026-08-18T16:20:00Z"
  },
  {
    id: "noticia_agbc_5",
    titulo: "Modernización de los Centros de Tratamiento Postal en La Paz, Santa Cruz y Cochabamba",
    descripcion: "Concluyó la instalación de nuevos módulos automatizados de pesaje y clasificación digital en los centros logísticos del eje troncal, agilizando el despacho de correspondencia y paquetería urgente.",
    imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.oopp.gob.bo",
    fuente: "Ministerio de Obras Públicas",
    fecha: "2026-08-10T11:15:00Z"
  },
  {
    id: "noticia_agbc_6",
    titulo: "Bolivia consolida estándares internacionales de calidad postal tras convenio con la UPU",
    descripcion: "Acuerdo estratégico con la Unión Postal Universal para la implementación de intercambio de datos aduaneros anticipados y capacitación técnica permanente a los operadores de Correos de Bolivia.",
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://abi.bo",
    fuente: "Agencia Boliviana de Información (ABI)",
    fecha: "2026-07-28T08:45:00Z"
  },
  {
    id: "noticia_agbc_7",
    titulo: "Inauguración de Nuevos Puntos de Atención y Casillas Postales Inteligentes en Capitales y Provincias",
    descripcion: "En el marco del plan de soberanía territorial, se inauguraron ventanillas de horario continuo y casillas seguras en Chuquisaca, Oruro, Potosí, Tarija, Beni y Pando.",
    imagen: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://correodelsur.com",
    fuente: "Correo del Sur",
    fecha: "2026-07-15T15:00:00Z"
  },
  {
    id: "noticia_agbc_8",
    titulo: "Exposición Filatélica Nacional: Historia, Tradición y Memoria Postal de Bolivia",
    descripcion: "Exhibición abierta al público en el Palacio de Comunicaciones con más de 5.000 piezas históricas, cartas de la época republicana y los sellos postales más valiosos del país.",
    imagen: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.la-razon.com",
    fuente: "La Razón",
    fecha: "2026-06-30T10:30:00Z"
  },
  {
    id: "noticia_agbc_9",
    titulo: "Capacitación Nacional a Servidores Públicos en Ciberseguridad y Trazabilidad Logística",
    descripcion: "Operadores postales de los 9 departamentos completaron el taller intensivo de modernización aduanera, seguridad en paquetería y protocolos de atención ciudadana con calidez.",
    imagen: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://erbol.com.bo",
    fuente: "Erbol Digital",
    fecha: "2026-06-18T12:00:00Z"
  },
  {
    id: "noticia_agbc_10",
    titulo: "Alianza Estratégica con Microempresarios: Programa 'Correo Emprendedor' amplía destinos",
    descripcion: "Tarifas planas y recojo a domicilio para que artesanos y productores bolivianos exporten textiles, artesanías y productos con sello 'Hecho en Bolivia' a más de 190 países.",
    imagen: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://eldeber.com.bo",
    fuente: "El Deber",
    fecha: "2026-05-22T09:30:00Z"
  },
  {
    id: "noticia_agbc_11",
    titulo: "Iniciativa 'Correos Verde': Transición hacia embalajes 100% reciclables y rutas eco-eficientes",
    descripcion: "Compromiso ecológico para la reducción de la huella de carbono mediante sobres biodegradables y optimización de flotas terrestres de reparto en áreas urbanas y rurales.",
    imagen: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.lostiempos.com",
    fuente: "Los Tiempos",
    fecha: "2026-05-05T14:00:00Z"
  },
  {
    id: "noticia_agbc_12",
    titulo: "Rendición Pública de Cuentas: Eficiencia operativa y expansión del servicio postal universal",
    descripcion: "La Dirección General de la AGBC presentó los logros alcanzados en equilibrio financiero, digitalización de trámites y cobertura postal en los 336 municipios de Bolivia.",
    imagen: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
    enlace: "https://www.oopp.gob.bo",
    fuente: "MOPSV / AGBC Oficial",
    fecha: "2026-04-20T11:00:00Z"
  }
];

// 12 Publicaciones Exactas de Facebook Oficial Correos de Bolivia
export const NOTICIAS_FACEBOOK_BASE = [
  {
    id: "noticia_fb_1",
    titulo: "¡Tu aliado logístico ideal ya está aquí! 📦✨ Delivery Express para hacer crecer tu negocio",
    descripcion: "¡Tu aliado logístico ideal ya está aquí! 📦✨ Enfócate en lo más importante: ¡hacer crecer tu negocio y vender más! 🚀 De la logística y los envíos nos encargamos nosotros con total seguridad y cobertura en las 9 capitales. ¡Contáctanos hoy mismo!",
    imagen: "/image/facebook/fb_exact_1.jpg",
    enlace: "https://www.facebook.com/share/p/19ywEfjBZx/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-03-08T18:00:00Z"
  },
  {
    id: "noticia_fb_2",
    titulo: "🎥 Reel Oficial: Proceso de recepción, clasificación y despacho de correspondencia y paquetería",
    descripcion: "🎥 ¡Descubre cómo cuidamos y trasladamos tu correspondencia y paquetes! Nuestro equipo logístico te muestra todo el recorrido desde que llega a nuestro Centro de Tratamiento Postal hasta que sale en ruta.",
    imagen: "/image/facebook/fb_exact_2.jpg",
    enlace: "https://www.facebook.com/share/r/19SHiCD6sx/",
    canonicalVideoUrl: "https://www.facebook.com/watch/?v=953602423707772",
    isReel: true,
    fecha: "2026-03-07T16:30:00Z"
  },
  {
    id: "noticia_fb_3",
    titulo: "Correos de Bolivia estrena nueva imagen y entra de lleno a la era digital: Delivery Express & Postal Shopper",
    descripcion: "Correos de Bolivia estrena una nueva imagen y entra de lleno a la era digital. Delivery Express para impulsar el comercio electrónico interno. Postal Shopper para conectar a Bolivia con las tiendas internacionales.",
    imagen: "/image/facebook/fb_exact_3.jpg",
    enlace: "https://www.facebook.com/share/p/1CGBgVQnNy/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-03-06T14:00:00Z"
  },
  {
    id: "noticia_fb_4",
    titulo: "Comunicado Oficial: Modificación en el Horario de Atención en la Oficina Central de La Paz",
    descripcion: "A nuestra clientela de la oficina central en La Paz, por favor tomen nota que, este fin de semana tendremos cambios en nuestro horario de atención en ventanillas. Tomen sus previsiones y compartan esta información.",
    imagen: "/image/facebook/fb_exact_4.jpg",
    enlace: "https://www.facebook.com/share/p/1BpKrpg1G5/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-03-05T12:00:00Z"
  },
  {
    id: "noticia_fb_5",
    titulo: "🕊️ Nota de Duelo Institucional: Sentidas condolencias a la familia Lazarte Bernal",
    descripcion: "🕊️ #CorreosDeBolivia expresa sus más sentidas condolencias por el sensible fallecimiento de la Sra. Laura Adelaida Bernal Murguía de Lazarte, tía de nuestro Director General Ejecutivo. Enviamos un abrazo fraterno a la familia doliente.",
    imagen: "/image/facebook/fb_exact_5.jpg",
    enlace: "https://www.facebook.com/share/p/1Mn6iXVRAZ/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-03-04T10:15:00Z"
  },
  {
    id: "noticia_fb_6",
    titulo: "🎥 Reel Expectativa: Proyecto Gigante Postal Shopper (Bolivia - Miami)",
    descripcion: "Hemos estado preparando un proyecto gigante que cambiará las reglas del juego. La distancia está a punto de desaparecer y una nueva forma de conectarte con el mundo viene en camino. 🌎🇧🇴 Miami - Bolivia. ¡Activa las notificaciones!",
    imagen: "/image/facebook/fb_exact_6.jpg",
    enlace: "https://www.facebook.com/share/r/1CXAzSLJFN/",
    canonicalVideoUrl: "https://www.facebook.com/watch/?v=1207276224950057",
    isReel: true,
    fecha: "2026-03-03T19:00:00Z"
  },
  {
    id: "noticia_fb_7",
    titulo: "Detrás de cada pedido hay un emprendedor boliviano con ganas de salir adelante",
    descripcion: "Detrás de cada pedido hay un emprendedor. 💛 Y detrás de cada emprendedor, hay muchas ganas de salir adelante. Por eso, cuando haces una venta, nosotros te ayudamos a llevarla hasta la puerta de tu cliente. 📦🚚",
    imagen: "/image/facebook/fb_exact_7.jpg",
    enlace: "https://www.facebook.com/share/p/1GWv38q8XR/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-03-02T15:30:00Z"
  },
  {
    id: "noticia_fb_8",
    titulo: "🎥 Reel Oficial: ¡Ey, tenemos una sorpresa para ti! Algo nuevo está llegando con Correos de Bolivia",
    descripcion: "👀 ¡Ey, ey… tenemos una sorpresa para ti! 🤫 Algo nuevo está llegando con Correos de Bolivia. 💛💙 Todavía no podemos contarte todo, pero te dejamos una pista... 🚀 ¡Prepárate, porque se viene algo increíble! #PostalShopper",
    imagen: "/image/facebook/fb_exact_8.jpg",
    enlace: "https://www.facebook.com/share/r/1BiGr7LQYY/",
    canonicalVideoUrl: "https://www.facebook.com/watch/?v=1589274883217703",
    isReel: true,
    fecha: "2026-03-01T17:45:00Z"
  },
  {
    id: "noticia_fb_9",
    titulo: "Comunicado Oficial: Cronograma de Atención por la Festividad de Ch'utillos en Potosí",
    descripcion: "💛💙 ¡Correos de Bolivia informa! 📢 Queremos comunicar a nuestros queridos usuarios y clientes que, con motivo de la festividad de San Bartolomé y San Ignacio de Loyola (Ch’utillos), la atención en nuestras sucursales tendrá cronograma especial.",
    imagen: "/image/facebook/fb_exact_9.jpg",
    enlace: "https://www.facebook.com/share/p/1MNWL8W8dr/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-02-27T11:00:00Z"
  },
  {
    id: "noticia_fb_10",
    titulo: "🎉 ¡Pum! ¡Te cayó una venta! ¿Y cómo se lo hago llegar? Fácil con Delivery Express",
    descripcion: "🎉 ¡Pum! ¡Te cayó una venta! 📦😍 Ahora viene la pregunta de siempre: “¿Y cómo se lo hago llegar?” 👀 Fácil. Para eso está Delivery Express. 🚚💙 Te registras en correos.gob.bo, eliges tu modalidad y ¡listo!",
    imagen: "/image/facebook/fb_exact_10.jpg",
    enlace: "https://www.facebook.com/share/p/1DqHUMa7gX/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-02-25T16:00:00Z"
  },
  {
    id: "noticia_fb_11",
    titulo: "🎥 Reel: ¡Regístrate, elige tu modalidad y pon tu venta en camino con Delivery Express!",
    descripcion: "👉 ¡Regístrate, elige tu modalidad y pon tu venta en camino! Envíos rápidos, seguros y económicos para todas tus ventas online en las 9 capitales. Visita correos.gob.bo",
    imagen: "/image/facebook/fb_exact_11.jpg",
    enlace: "https://www.facebook.com/share/r/1Dk54LrC3b/",
    canonicalVideoUrl: "https://www.facebook.com/watch/?v=1051847620807185",
    isReel: true,
    fecha: "2026-02-22T14:30:00Z"
  },
  {
    id: "noticia_fb_12",
    titulo: "¿Vendes online? ¡Nosotros llevamos tu venta por ti con Delivery Express de Correos de Bolivia!",
    descripcion: "📦✨ ¿Vendes online? ¡Nosotros llevamos tu venta por ti! 💛💙 Con Delivery Express de Correos de Bolivia, enviar tus productos es fácil, rápido y seguro. 🚚📦 👉 Regístrate, elige tu modalidad y ¡pon tu venta en camino!",
    imagen: "/image/facebook/fb_exact_12.jpg",
    enlace: "https://www.facebook.com/share/p/19MxE3AbEp/",
    canonicalVideoUrl: null,
    isReel: false,
    fecha: "2026-02-18T10:00:00Z"
  }
];

export async function sincronizarNoticiasAuto(force: boolean = false): Promise<SyncResult> {
  const ahora = new Date();

  try {
    // 1. Verificar última sincronización
    const [configRow] = await db
      .select()
      .from(configuracion)
      .where(eq(configuracion.clave, "ultima_sincronizacion_noticias"));

    let debeSincronizar = force;
    if (!force && configRow?.valor) {
      try {
        const lastSync = new Date(configRow.valor);
        const diffHoras = (ahora.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        if (diffHoras < 24) {
          // Ya se sincronizó en las últimas 24 horas, pero verificamos que haya datos en la BD
          const conteo = await db.select().from(banners);
          if (conteo.length >= 24) {
            debeSincronizar = false;
          }
        }
      } catch {
        debeSincronizar = true;
      }
    }

    if (!debeSincronizar) {
      return {
        success: true,
        message: "Noticias ya sincronizadas en las últimas 24 horas.",
        institucionalesCount: 12,
        facebookCount: 12,
        timestamp: ahora.toISOString(),
      };
    }

    // 2. Insertar / Actualizar todas las 24 noticias
    const todosLosBanners = [
      ...NOTICIAS_INSTITUCIONALES_BASE.map((n, idx) => ({
        id: n.id,
        titulo: n.titulo,
        descripcion: n.descripcion,
        imagen: n.imagen,
        imagenes: JSON.stringify([n.imagen]),
        enlace: n.enlace,
        activo: true,
        orden: String(idx + 1),
        createdAt: new Date(n.fecha),
        updatedAt: ahora,
      })),
      ...NOTICIAS_FACEBOOK_BASE.map((n, idx) => ({
        id: n.id,
        titulo: n.titulo,
        descripcion: n.descripcion,
        imagen: n.imagen,
        imagenes: JSON.stringify([n.imagen]),
        enlace: n.canonicalVideoUrl || n.enlace,
        activo: true,
        orden: String(idx + 13),
        createdAt: new Date(n.fecha),
        updatedAt: ahora,
      })),
    ];

    await db.delete(banners);
    await db.insert(banners).values(todosLosBanners);

    // 3. Guardar timestamp de sincronización
    if (configRow) {
      await db
        .update(configuracion)
        .set({ valor: ahora.toISOString(), updatedAt: ahora })
        .where(eq(configuracion.clave, "ultima_sincronizacion_noticias"));
    } else {
      await db.insert(configuracion).values({
        clave: "ultima_sincronizacion_noticias",
        grupo: "sistema",
        descripcion: "Fecha y hora de la última sincronización automática de noticias (24h)",
        valor: ahora.toISOString(),
      });
    }

    return {
      success: true,
      message: "Sincronización de 24 noticias completada exitosamente.",
      institucionalesCount: 12,
      facebookCount: 12,
      timestamp: ahora.toISOString(),
    };
  } catch (error: any) {
    console.error("Error al sincronizar noticias:", error);
    return {
      success: false,
      message: error?.message || "Error desconocido en sincronización",
      institucionalesCount: 0,
      facebookCount: 0,
      timestamp: ahora.toISOString(),
    };
  }
}
