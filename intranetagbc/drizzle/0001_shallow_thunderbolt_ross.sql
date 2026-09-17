CREATE TABLE IF NOT EXISTS "inventario" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"item" varchar(200) NOT NULL,
	"categoria" varchar(100) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	"unidad" varchar(50) DEFAULT 'Unidad' NOT NULL,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventario_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"rubro" varchar(150) NOT NULL,
	"nit" varchar(30) NOT NULL,
	"telefono" varchar(50),
	"contacto" varchar(150),
	"email" varchar(150),
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solicitudes_material" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"numero" varchar(30) NOT NULL,
	"solicitante" varchar(150) NOT NULL,
	"items" text NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"observaciones" text,
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solicitudes_material_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"destinatario_nombre" varchar(200) NOT NULL,
	"destinatario_email" varchar(200) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"asunto" varchar(300) NOT NULL,
	"estado" varchar(20) DEFAULT 'enviado' NOT NULL,
	"error_mensaje" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_national_id_unique";
--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "id" SET DATA TYPE varchar(64);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitudes_material_creado_por_users_id_fk') THEN
    ALTER TABLE "solicitudes_material" ADD CONSTRAINT "solicitudes_material_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventario_categoria_idx" ON "inventario" USING btree ("categoria");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "solicitudes_material_estado_idx" ON "solicitudes_material" USING btree ("estado");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_destinatario_email_idx" ON "email_logs" USING btree ("destinatario_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_tipo_idx" ON "email_logs" USING btree ("tipo");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_estado_idx" ON "email_logs" USING btree ("estado");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "national_id";
--> statement-breakpoint
ALTER TABLE "personal" DROP COLUMN IF EXISTS "ci";