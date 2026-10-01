#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado y Seguro - Intranet AGBC (Producción)
# ==============================================================================
set -e

echo ""
echo "🚀 ========================================================"
echo "   Iniciando Despliegue de Intranet AGBC en Producción"
echo "========================================================"
echo ""

# 1. Asegurar rama main y descargar cambios
echo "📥 [1/5] Actualizando repositorio desde Git..."
git pull origin main

# 2. Instalar dependencias si hay cambios
echo "📦 [2/5] Verificando e instalando dependencias (npm install)..."
npm install --prefer-offline --no-audit

# 3. Aplicar migraciones seguras y no destructivas a la base de datos
echo "🗄️ [3/5] Aplicando migraciones de base de datos seguras..."
npm run db:migrate:auto

# 4. Compilar la aplicación para producción
echo "🏗️ [4/5] Compilando Next.js para producción (npm run build)..."
npm run build

# 5. Reiniciar el servicio
echo "🔄 [5/5] Reiniciando servicio de la intranet..."
if command -v pm2 &> /dev/null; then
    pm2 reload intranetagbc || pm2 restart intranetagbc || pm2 start npm --name "intranetagbc" -- run start
elif command -v systemctl &> /dev/null; then
    sudo systemctl restart intranetagbc || true
else
    echo "⚠️ No se detectó PM2 ni systemctl. Reinicia el proceso con: npm run start"
fi

echo ""
echo "✅ ========================================================"
echo "   ¡Despliegue completado con éxito y sistema actualizado!"
echo "========================================================"
echo ""
