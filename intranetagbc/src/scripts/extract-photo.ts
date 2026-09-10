import path from "path"
import sharp from "sharp"

async function extractPhoto() {
  const inputPath = "C:\\Users\\senol\\.gemini\\antigravity-ide\\brain\\450e29d9-cd57-465f-b75c-30449ce49e62\\.user_uploaded\\media_1789069816990.png"
  const outPath = path.join(process.cwd(), "public/image/noticias/noticia_larazon_droga_asia.jpg")
  const outDelivery = path.join(process.cwd(), "public/image/noticias/noticia_larazon_delivery_express.jpg")

  const metadata = await sharp(inputPath).metadata()
  console.log("Screenshot dimensions:", metadata.width, "x", metadata.height)

  // Dimensions of 1366x768 screenshot:
  // The photo of the police officers is on the left side:
  // x: approx 66px to 865px
  // y: approx 275px to 725px
  
  const width = metadata.width || 1366
  const height = metadata.height || 768

  // Calculate relative crop coordinates
  const left = Math.round(width * 0.048)
  const top = Math.round(height * 0.355)
  const cropWidth = Math.round(width * 0.585)
  const cropHeight = Math.round(height * 0.59)

  console.log("Cropping box:", { left, top, width: cropWidth, height: cropHeight })

  await sharp(inputPath)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(800, 480, { fit: "cover" })
    .jpeg({ quality: 95 })
    .toFile(outPath)

  console.log("✓ Real photo from La Razon saved to:", outPath)

  // Also create/copy the second photo for Delivery Express news
  const fbDeliveryPath = path.join(process.cwd(), "public/image/facebook/fb_exact_1.jpg")
  await sharp(fbDeliveryPath)
    .resize(800, 480, { fit: "cover" })
    .jpeg({ quality: 95 })
    .toFile(outDelivery)

  console.log("✓ Delivery Express photo saved to:", outDelivery)
}

extractPhoto().catch(console.error)
