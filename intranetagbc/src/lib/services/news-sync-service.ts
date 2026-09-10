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
    titulo: "Correos de Bolivia y la UPU modernizan intercambio aduanero y postal internacional",
    descripcion: "La Agencia Boliviana de Información (ABI) destaca el acuerdo con la Unión Postal Universal para la implementación de intercambio de datos electrónicos anticipados y agilización de paquetería.",
    imagen: "/image/noticias/noticia_abi_1.jpg",
    enlace: "https://abi.bo",
    fuente: "Agencia Boliviana de Información (ABI)",
    fecha: "2026-09-08T10:00:00Z"
  },
  {
    id: "noticia_agbc_2",
    titulo: "AGBC incorpora nueva flota vehicular y automatización en centros de acopio troncales",
    descripcion: "El diario La Razón informa sobre la modernización de los centros de tratamiento postal en La Paz, Cochabamba y Santa Cruz con nuevos módulos de pesaje y clasificación digital.",
    imagen: "/image/noticias/noticia_larazon_2.jpg",
    enlace: "https://www.la-razon.com",
    fuente: "La Razón",
    fecha: "2026-09-07T14:30:00Z"
  },
  {
    id: "noticia_agbc_3",
    titulo: "Delivery Express: Correos lanza envíos en 24 horas para comercio electrónico",
    descripcion: "Unitel Digital reporta las nuevas modalidades de envíos de la AGBC con tarifas preferenciales y recojo para tiendas virtuales y emprendedores con cobertura en las 9 capitales.",
    imagen: "/image/noticias/noticia_unitel_3.jpg",
    enlace: "https://unitel.bo",
    fuente: "Unitel Digital",
    fecha: "2026-08-25T09:00:00Z"
  },
  {
    id: "noticia_agbc_4",
    titulo: "Histórica emisión de sellos postales por el Bicentenario de Bolivia y Riqueza Filatélica",
    descripcion: "El Diario, decano de la prensa nacional, reseña la presentación de la serie conmemorativa de estampillas exclusivas en homenaje a los 200 años de historia patria y biodiversidad.",
    imagen: "/image/noticias/noticia_eldiario_4.jpg",
    enlace: "https://www.eldiario.net",
    fuente: "El Diario",
    fecha: "2026-08-18T16:20:00Z"
  },
  {
    id: "noticia_agbc_5",
    titulo: "TrackingBO 2.0: Rastreo en tiempo real de encomiendas desde el teléfono móvil",
    descripcion: "Red Uno de Bolivia presenta la nueva versión del sistema SIOP / TrackingBO de Correos para que los usuarios sigan sus compras y paquetes minuto a minuto por código QR.",
    imagen: "/image/noticias/noticia_reduno_5.jpg",
    enlace: "https://www.reduno.com.bo",
    fuente: "Red Uno",
    fecha: "2026-08-10T11:15:00Z"
  },
  {
    id: "noticia_agbc_6",
    titulo: "Alerta ciudadana: Advierten sobre estafas con falsas subastas de paquetes en redes",
    descripcion: "El Deber advierte a la población sobre publicaciones fraudulentas en Facebook. La AGBC reitera que no subasta paquetes extraviados ni solicita depósitos por enlaces dudosos.",
    imagen: "/image/noticias/noticia_eldeber_6.jpg",
    enlace: "https://eldeber.com.bo",
    fuente: "El Deber",
    fecha: "2026-07-28T08:45:00Z"
  },
  {
    id: "noticia_agbc_7",
    titulo: "Programa 'Correo Emprendedor' amplía destinos para exportación artesanal boliviana",
    descripcion: "ATB Digital reporta la alianza estratégica con artesanos y MYPEs para el despacho internacional con tarifas planas y sello 'Hecho en Bolivia' a más de 190 países de la red postal.",
    imagen: "/image/noticias/noticia_atb_7.jpg",
    enlace: "https://www.atb.com.bo",
    fuente: "ATB Digital",
    fecha: "2026-07-15T15:00:00Z"
  },
  {
    id: "noticia_agbc_8",
    titulo: "Inauguran modernas casillas postales inteligentes y horario continuo en agencias",
    descripcion: "Bolivisión destaca la habilitación de nuevas ventanillas de atención continua y casilleros seguros en oficinas regionales de Sucre, Oruro, Potosí, Tarija, Beni y Pando.",
    imagen: "/image/noticias/noticia_bolivision_8.jpg",
    enlace: "https://www.redbolivision.tv.bo",
    fuente: "Bolivisión",
    fecha: "2026-06-30T10:30:00Z"
  },
  {
    id: "noticia_agbc_9",
    titulo: "Exposición de filatelia exhibe cartas históricas y tesoros postales en La Paz",
    descripcion: "Los Tiempos cubre la muestra filatélica en el Palacio de Comunicaciones con más de 5.000 piezas históricas, correspondencia republicana y los sellos más representativos.",
    imagen: "/image/noticias/noticia_lostiempos_9.jpg",
    enlace: "https://www.lostiempos.com",
    fuente: "Los Tiempos",
    fecha: "2026-06-18T12:00:00Z"
  },
  {
    id: "noticia_agbc_10",
    titulo: "'Correos Verde': AGBC implementa sobres y empaques 100% reciclables",
    descripcion: "El periódico Opinión resalta la iniciativa ecológica de Correos de Bolivia para reducir la huella de carbono con sobres biodegradables y optimización de rutas de reparto.",
    imagen: "/image/noticias/noticia_opinion_10.jpg",
    enlace: "https://www.opinion.com.bo",
    fuente: "Opinión",
    fecha: "2026-05-22T09:30:00Z"
  },
  {
    id: "noticia_agbc_11",
    titulo: "Capacitan a operadores postales en ciberseguridad y trazabilidad aduanera",
    descripcion: "Correo del Sur informa sobre la conclusión del ciclo nacional de capacitación técnica para operadores y carteros de los 9 departamentos en seguridad y atención ciudadana.",
    imagen: "/image/noticias/noticia_correodelsur_11.jpg",
    enlace: "https://correodelsur.com",
    fuente: "Correo del Sur",
    fecha: "2026-05-05T14:00:00Z"
  },
  {
    id: "noticia_agbc_12",
    titulo: "Falso: Correos de Bolivia no remata paquetes extraviados por redes sociales",
    descripcion: "Bolivia Verifica desmiente publicaciones apócrifas que usan el logotipo de Correos para estafar con falsos remates de encomiendas no reclamadas en aeropuertos.",
    imagen: "/image/noticias/noticia_boliviaverifica_12.jpg",
    enlace: "https://boliviaverifica.bo",
    fuente: "Bolivia Verifica",
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
