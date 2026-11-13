#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado y Seguro - Intranet AGBC (Producción)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "🚀 ========================================================"
echo "   Iniciando Despliegue Completo en Producción (Intranet AGBC)"
echo "========================================================"
echo ""

# 1. Actualizar repositorio
echo "📥 [1/4] Descargando últimos cambios desde Git (origin/main)..."
git pull origin main

# 2. Navegar a intranetagbc
if [ -d "$SCRIPT_DIR/intranetagbc" ]; then
    cd "$SCRIPT_DIR/intranetagbc"
fi

# 3. Base de datos: migraciones, categorías jerárquicas y limpieza de documentos
echo "🗄️ [2/4] Aplicando migraciones y sincronizando jerarquía documental..."
npm run db:migrate:auto

# 4. Compilación para producción
echo "🏗️ [3/4] Compilando Next.js para producción (npm run build)..."
npm run build

# 5. Recarga en PM2
echo "🔄 [4/4] Recargando servicio en PM2..."
if command -v pm2 &> /dev/null; then
    pm2 reload intranetagbc || pm2 restart intranetagbc || pm2 start npm --name "intranetagbc" -- run start
else
    echo "⚠️ PM2 no encontrado. Inicie el proceso con: npm run start"
fi

echo ""
echo "✅ ========================================================"
echo "   ¡Todo actualizado y desplegado en Producción exitosamente!"
echo "========================================================"
echo ""

