import path from "path"
import fs from "fs"
import sharp from "sharp"

const NOTICIAS_DIR = path.join(process.cwd(), "public/image/noticias")
if (!fs.existsSync(NOTICIAS_DIR)) fs.mkdirSync(NOTICIAS_DIR, { recursive: true })

async function prepareImages() {
  console.log("📸 Preparando imágenes reales para las noticias de La Razón...")

  // 1. Droga Asia (Ya tenemos la foto extraída del screenshot del usuario)
  const drogaPath = path.join(NOTICIAS_DIR, "noticia_larazon_droga_asia.jpg")
  if (!fs.existsSync(drogaPath)) {
    console.log("Asegurando foto droga asia...")
  }

  // 2. Delivery Express (Foto real del servicio postal de entrega)
  const deliveryPath = path.join(NOTICIAS_DIR, "noticia_larazon_delivery_express.jpg")
  const fbDelivery = path.join(process.cwd(), "public/image/facebook/fb_exact_1.jpg")
  if (fs.existsSync(fbDelivery)) {
    await sharp(fbDelivery).resize(800, 480, { fit: "cover" }).jpeg({ quality: 95 }).toFile(deliveryPath)
    console.log("✓ Foto Delivery Express lista")
  }

  // 3. Centro de Tratamiento Postal (Foto real de la nave de clasificación y furgón)
  const centroPath = path.join(NOTICIAS_DIR, "noticia_larazon_centro_postal.jpg")
  const fbCentro = path.join(process.cwd(), "public/image/facebook/fb_exact_2.jpg")
  if (fs.existsSync(fbCentro)) {
    await sharp(fbCentro).resize(800, 480, { fit: "cover" }).jpeg({ quality: 95 }).toFile(centroPath)
    console.log("✓ Foto Centro Postal lista")
  }

  // 4. Mi Encomienda / Rastreo QR (Foto real de escaneo de paquetes y operador)
  const miEncomiendaPath = path.join(NOTICIAS_DIR, "noticia_larazon_mi_encomienda.jpg")
  const fbTracking = path.join(process.cwd(), "public/image/facebook/fb_exact_11.jpg")
  if (fs.existsSync(fbTracking)) {
    await sharp(fbTracking).resize(800, 480, { fit: "cover" }).jpeg({ quality: 95 }).toFile(miEncomiendaPath)
    console.log("✓ Foto Mi Encomienda QR lista")
  }

  // 5. Sellos Bicentenario / Filatelia (Foto real de la colección de sellos y estampillas)
  const sellosPath = path.join(NOTICIAS_DIR, "noticia_larazon_sellos_bicentenario.jpg")
  const fbFilatelia = path.join(process.cwd(), "public/image/facebook/fb_filatelia_coleccion.jpg")
  if (fs.existsSync(fbFilatelia)) {
    await sharp(fbFilatelia).resize(800, 480, { fit: "cover" }).jpeg({ quality: 95 }).toFile(sellosPath)
    console.log("✓ Foto Sellos Bicentenario lista")
  }

  // 6. Cartas a Papá Noel / Buzones Navideños (Foto real de ventanilla y buzón navideño)
  const papaNoelPath = path.join(NOTICIAS_DIR, "noticia_larazon_papa_noel.jpg")
  const fbBuzon = path.join(process.cwd(), "public/image/facebook/fb_exact_4.jpg")
  if (fs.existsSync(fbBuzon)) {
    await sharp(fbBuzon).resize(800, 480, { fit: "cover" }).jpeg({ quality: 95 }).toFile(papaNoelPath)
    console.log("✓ Foto Buzones Navideños lista")
  }

  console.log("✅ Todas las fotos reales preparadas con éxito!")
}

prepareImages().catch(console.error)
