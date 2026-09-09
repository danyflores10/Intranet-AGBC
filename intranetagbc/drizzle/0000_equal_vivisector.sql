CREATE TABLE "users" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name_paternal" varchar(100) NOT NULL,
	"last_name_maternal" varchar(100),
	"email" varchar(150),
	"institutional_email" varchar(150) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"national_id" varchar(20) NOT NULL,
	"date_of_birth" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_institutional_email_unique" UNIQUE("institutional_email"),
	CONSTRAINT "users_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar(512) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(100),
	"user_agent" varchar(255),
	"user_id" varchar(24) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(100) NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"access_token" varchar(512),
	"refresh_token" varchar(512),
	"id_token" varchar(512),
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" varchar(255),
	"password" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" varchar(24) NOT NULL,
	"permission_id" varchar(24) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" varchar(24) NOT NULL,
	"role_id" varchar(24) NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "correspondencia" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"hoja_ruta" varchar(30) NOT NULL,
	"tipo_documento_id" varchar(24),
	"origen" varchar(20) DEFAULT 'interno' NOT NULL,
	"tipo" varchar(20) DEFAULT 'entrada' NOT NULL,
	"prioridad" varchar(20) DEFAULT 'normal' NOT NULL,
	"estado" varchar(30) DEFAULT 'registrado' NOT NULL,
	"remitente" varchar(200) NOT NULL,
	"remitente_user_id" varchar(24),
	"destinatario" varchar(200),
	"destinatario_user_id" varchar(24),
	"destino_area" varchar(150),
	"destino_sucursal_id" varchar(24),
	"asunto" varchar(300) NOT NULL,
	"descripcion" text,
	"observaciones" text,
	"fecha_recepcion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_envio" timestamp with time zone,
	"plazo_atencion" timestamp with time zone,
	"archivado_en" timestamp with time zone,
	"leido" boolean DEFAULT false NOT NULL,
	"creado_por" varchar(24),
	"actualizado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "correspondencia_hoja_ruta_unique" UNIQUE("hoja_ruta")
);
--> statement-breakpoint
CREATE TABLE "correspondencia_adjuntos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"correspondencia_id" varchar(24) NOT NULL,
	"movimiento_id" varchar(24),
	"archivo_nombre" varchar(255) NOT NULL,
	"archivo_url" varchar(500) NOT NULL,
	"archivo_tipo" varchar(20) NOT NULL,
	"archivo_tamano" integer DEFAULT 0 NOT NULL,
	"subido_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "correspondencia_movimientos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"correspondencia_id" varchar(24) NOT NULL,
	"from_user_id" varchar(24),
	"from_area" varchar(150),
	"from_sucursal_id" varchar(24),
	"to_user_id" varchar(24),
	"to_area" varchar(150),
	"to_sucursal_id" varchar(24),
	"estado_anterior" varchar(30),
	"estado_nuevo" varchar(30) NOT NULL,
	"accion" varchar(30) DEFAULT 'derivacion' NOT NULL,
	"instrucciones" text,
	"comentario" text,
	"prioridad" varchar(20),
	"plazo_atencion" timestamp with time zone,
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "correspondencia_tipos_documento" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(80) NOT NULL,
	"descripcion" varchar(200),
	"plazo_default_dias" integer DEFAULT 5 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "correspondencia_tipos_documento_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "documento_categorias" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documento_categorias_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"categoria_id" varchar(24),
	"autor" varchar(150) NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"archivo" varchar(500),
	"nombre_archivo" varchar(255),
	"tipo_archivo" varchar(50),
	"tamano" varchar(20),
	"descripcion" text,
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"descripcion" text,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"prioridad" varchar(20) DEFAULT 'media' NOT NULL,
	"observaciones" text,
	"respuesta" text,
	"solicitante_id" varchar(24) NOT NULL,
	"destinatario_id" varchar(24),
	"archivo_url" varchar(500),
	"archivo_nombre" varchar(255),
	"archivo_tipo" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solicitudes_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "contactos_emergencia" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"personal_id" varchar(24) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"parentesco" varchar(50) NOT NULL,
	"telefono" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directivos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"cargo" varchar(150) NOT NULL,
	"unidad" varchar(150) DEFAULT 'Dirección General' NOT NULL,
	"email" varchar(150),
	"telefono" varchar(50),
	"foto" varchar(500),
	"orden" integer DEFAULT 0 NOT NULL,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"ci" varchar(20) NOT NULL,
	"cargo" varchar(150) NOT NULL,
	"unidad" varchar(150) DEFAULT 'General' NOT NULL,
	"email" varchar(150),
	"telefono" varchar(50),
	"foto" varchar(500),
	"fecha_ingreso" date NOT NULL,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"imagen" varchar(500),
	"imagenes" text,
	"enlace" varchar(500),
	"activo" boolean DEFAULT true NOT NULL,
	"orden" varchar(10) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comunicados" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"contenido" text NOT NULL,
	"tipo" varchar(20) DEFAULT 'comunicado' NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"fecha_publicacion" date,
	"fecha_expiracion" date,
	"destacado" boolean DEFAULT false NOT NULL,
	"imagen" varchar(500),
	"archivo_url" text,
	"archivo_nombre" varchar(300),
	"archivo_tipo" varchar(20),
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archivos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre" varchar(300) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"categoria" varchar(100) NOT NULL,
	"ubicacion" varchar(300),
	"descripcion" text,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"usuario" varchar(200) NOT NULL,
	"accion" varchar(200) NOT NULL,
	"modulo" varchar(100) NOT NULL,
	"ip" varchar(100),
	"ubicacion_ciudad" varchar(120),
	"ubicacion_pais" varchar(120),
	"ubicacion_codigo_pais" varchar(10),
	"resultado" varchar(20) DEFAULT 'Exitoso' NOT NULL,
	"detalles" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracion" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"clave" varchar(100) NOT NULL,
	"valor" text NOT NULL,
	"descripcion" varchar(300),
	"grupo" varchar(50) DEFAULT 'general' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "configuracion_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "eventos_calendario" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"descripcion" text,
	"tipo" varchar(30) DEFAULT 'feriado' NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date,
	"color" varchar(20) DEFAULT '#FFB300',
	"notificar" boolean DEFAULT true NOT NULL,
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificaciones" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"mensaje" text NOT NULL,
	"tipo" varchar(30) DEFAULT 'info' NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"usuario_id" varchar(24) NOT NULL,
	"enlace" varchar(500),
	"creado_por" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sucursales" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"departamento" varchar(50) NOT NULL,
	"capital" varchar(100) NOT NULL,
	"nombre" varchar(300) NOT NULL,
	"direccion" text NOT NULL,
	"telefono" varchar(50),
	"horario" varchar(200),
	"foto" varchar(500),
	"google_maps" varchar(500),
	"color" varchar(20) DEFAULT '#FFB300',
	"svg_id" varchar(10),
	"pin_x" varchar(10),
	"pin_y" varchar(10),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensajes_soporte" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"ticket_id" varchar(24) NOT NULL,
	"emisor_id" varchar(24) NOT NULL,
	"contenido" text,
	"tipo_mensaje" varchar(20) DEFAULT 'texto' NOT NULL,
	"archivo_url" varchar(500),
	"archivo_nombre" varchar(300),
	"archivo_tipo" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets_soporte" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"asunto" varchar(300) NOT NULL,
	"estado" varchar(20) DEFAULT 'abierto' NOT NULL,
	"prioridad" varchar(20) DEFAULT 'media' NOT NULL,
	"solicitante_id" varchar(24) NOT NULL,
	"agente_id" varchar(24),
	"cerrado_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_soporte_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "reconocimiento_empleado_mes" (
	"reconocimiento_id" varchar(24) PRIMARY KEY NOT NULL,
	"empleado_id" varchar(24),
	"nombre_completo" varchar(200) NOT NULL,
	"cargo" varchar(150) NOT NULL,
	"area" varchar(150) NOT NULL,
	"sucursal_id" varchar(24),
	"mes" integer NOT NULL,
	"gestion" integer NOT NULL,
	"logros_destacados" text
);
--> statement-breakpoint
CREATE TABLE "reconocimiento_equipo" (
	"reconocimiento_id" varchar(24) PRIMARY KEY NOT NULL,
	"nombre_equipo" varchar(200) NOT NULL,
	"area" varchar(150) NOT NULL,
	"responsable_id" varchar(24),
	"responsable_nombre" varchar(200) NOT NULL,
	"resultados_alcanzados" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconocimiento_equipo_integrantes" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"reconocimiento_id" varchar(24) NOT NULL,
	"usuario_id" varchar(24),
	"nombre" varchar(200) NOT NULL,
	"rol_equipo" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconocimiento_logro_sucursal" (
	"reconocimiento_id" varchar(24) PRIMARY KEY NOT NULL,
	"sucursal_id" varchar(24) NOT NULL,
	"ciudad" varchar(100) NOT NULL,
	"departamento" varchar(100) NOT NULL,
	"responsable_nombre" varchar(200) NOT NULL,
	"tipo_logro" varchar(50) NOT NULL,
	"indicadores" jsonb
);
--> statement-breakpoint
CREATE TABLE "reconocimientos" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion_corta" varchar(280) NOT NULL,
	"descripcion_completa" text NOT NULL,
	"imagen" varchar(500),
	"motivo" text NOT NULL,
	"periodo_desde" date,
	"periodo_hasta" date,
	"fecha_reconocimiento" date NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"motivo_rechazo" text,
	"destacado" boolean DEFAULT false NOT NULL,
	"mostrar_en_landing" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_por" varchar(24),
	"aprobado_por" varchar(24),
	"publicado_en" timestamp with time zone,
	"archivado_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_config" (
	"clave" varchar(30) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"mostrar_a" varchar(20) DEFAULT 'nuevos' NOT NULL,
	"rol_objetivo" varchar(50),
	"version" varchar(20) DEFAULT '1' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_progreso" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"usuario_id" varchar(24) NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"paso" varchar(50),
	"version" varchar(20) DEFAULT '1' NOT NULL,
	"visto_en" timestamp with time zone,
	"completado_en" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_tipo_documento_id_correspondencia_tipos_documento_id_fk" FOREIGN KEY ("tipo_documento_id") REFERENCES "public"."correspondencia_tipos_documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_remitente_user_id_users_id_fk" FOREIGN KEY ("remitente_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_destinatario_user_id_users_id_fk" FOREIGN KEY ("destinatario_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_destino_sucursal_id_sucursales_id_fk" FOREIGN KEY ("destino_sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia" ADD CONSTRAINT "correspondencia_actualizado_por_users_id_fk" FOREIGN KEY ("actualizado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_adjuntos" ADD CONSTRAINT "correspondencia_adjuntos_correspondencia_id_correspondencia_id_fk" FOREIGN KEY ("correspondencia_id") REFERENCES "public"."correspondencia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_adjuntos" ADD CONSTRAINT "correspondencia_adjuntos_movimiento_id_correspondencia_movimientos_id_fk" FOREIGN KEY ("movimiento_id") REFERENCES "public"."correspondencia_movimientos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_adjuntos" ADD CONSTRAINT "correspondencia_adjuntos_subido_por_users_id_fk" FOREIGN KEY ("subido_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_correspondencia_id_correspondencia_id_fk" FOREIGN KEY ("correspondencia_id") REFERENCES "public"."correspondencia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_from_sucursal_id_sucursales_id_fk" FOREIGN KEY ("from_sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_to_sucursal_id_sucursales_id_fk" FOREIGN KEY ("to_sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "correspondencia_movimientos" ADD CONSTRAINT "correspondencia_movimientos_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_categoria_id_documento_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."documento_categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_solicitante_id_users_id_fk" FOREIGN KEY ("solicitante_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_destinatario_id_users_id_fk" FOREIGN KEY ("destinatario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos_emergencia" ADD CONSTRAINT "contactos_emergencia_personal_id_personal_id_fk" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_calendario" ADD CONSTRAINT "eventos_calendario_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes_soporte" ADD CONSTRAINT "mensajes_soporte_ticket_id_tickets_soporte_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets_soporte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes_soporte" ADD CONSTRAINT "mensajes_soporte_emisor_id_users_id_fk" FOREIGN KEY ("emisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_solicitante_id_users_id_fk" FOREIGN KEY ("solicitante_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_soporte" ADD CONSTRAINT "tickets_soporte_agente_id_users_id_fk" FOREIGN KEY ("agente_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_empleado_mes" ADD CONSTRAINT "reconocimiento_empleado_mes_reconocimiento_id_reconocimientos_id_fk" FOREIGN KEY ("reconocimiento_id") REFERENCES "public"."reconocimientos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_empleado_mes" ADD CONSTRAINT "reconocimiento_empleado_mes_empleado_id_users_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_empleado_mes" ADD CONSTRAINT "reconocimiento_empleado_mes_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_equipo" ADD CONSTRAINT "reconocimiento_equipo_reconocimiento_id_reconocimientos_id_fk" FOREIGN KEY ("reconocimiento_id") REFERENCES "public"."reconocimientos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_equipo" ADD CONSTRAINT "reconocimiento_equipo_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_equipo_integrantes" ADD CONSTRAINT "reconocimiento_equipo_integrantes_reconocimiento_id_reconocimiento_equipo_reconocimiento_id_fk" FOREIGN KEY ("reconocimiento_id") REFERENCES "public"."reconocimiento_equipo"("reconocimiento_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_equipo_integrantes" ADD CONSTRAINT "reconocimiento_equipo_integrantes_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_logro_sucursal" ADD CONSTRAINT "reconocimiento_logro_sucursal_reconocimiento_id_reconocimientos_id_fk" FOREIGN KEY ("reconocimiento_id") REFERENCES "public"."reconocimientos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimiento_logro_sucursal" ADD CONSTRAINT "reconocimiento_logro_sucursal_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimientos" ADD CONSTRAINT "reconocimientos_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconocimientos" ADD CONSTRAINT "reconocimientos_aprobado_por_users_id_fk" FOREIGN KEY ("aprobado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progreso" ADD CONSTRAINT "onboarding_progreso_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "correspondencia_tipo_idx" ON "correspondencia" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "correspondencia_estado_idx" ON "correspondencia" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "correspondencia_prioridad_idx" ON "correspondencia" USING btree ("prioridad");--> statement-breakpoint
CREATE INDEX "correspondencia_destino_area_idx" ON "correspondencia" USING btree ("destino_area");--> statement-breakpoint
CREATE INDEX "correspondencia_destinatario_user_idx" ON "correspondencia" USING btree ("destinatario_user_id");--> statement-breakpoint
CREATE INDEX "correspondencia_destino_sucursal_idx" ON "correspondencia" USING btree ("destino_sucursal_id");--> statement-breakpoint
CREATE INDEX "correspondencia_plazo_idx" ON "correspondencia" USING btree ("plazo_atencion");--> statement-breakpoint
CREATE INDEX "correspondencia_adj_correspondencia_idx" ON "correspondencia_adjuntos" USING btree ("correspondencia_id");--> statement-breakpoint
CREATE INDEX "correspondencia_adj_movimiento_idx" ON "correspondencia_adjuntos" USING btree ("movimiento_id");--> statement-breakpoint
CREATE INDEX "correspondencia_mov_correspondencia_idx" ON "correspondencia_movimientos" USING btree ("correspondencia_id");--> statement-breakpoint
CREATE INDEX "correspondencia_mov_to_user_idx" ON "correspondencia_movimientos" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "correspondencia_mov_estado_idx" ON "correspondencia_movimientos" USING btree ("estado_nuevo");--> statement-breakpoint
CREATE INDEX "correspondencia_tipos_doc_activo_idx" ON "correspondencia_tipos_documento" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "documentos_categoria_idx" ON "documentos" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "documentos_estado_idx" ON "documentos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "solicitudes_tipo_idx" ON "solicitudes" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "solicitudes_solicitante_idx" ON "solicitudes" USING btree ("solicitante_id");--> statement-breakpoint
CREATE INDEX "solicitudes_destinatario_idx" ON "solicitudes" USING btree ("destinatario_id");--> statement-breakpoint
CREATE INDEX "audit_logs_usuario_idx" ON "audit_logs" USING btree ("usuario");--> statement-breakpoint
CREATE INDEX "audit_logs_modulo_idx" ON "audit_logs" USING btree ("modulo");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_resultado_idx" ON "audit_logs" USING btree ("resultado");--> statement-breakpoint
CREATE INDEX "eventos_fecha_inicio_idx" ON "eventos_calendario" USING btree ("fecha_inicio");--> statement-breakpoint
CREATE INDEX "eventos_tipo_idx" ON "eventos_calendario" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "notificaciones_usuario_idx" ON "notificaciones" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones" USING btree ("leida");--> statement-breakpoint
CREATE INDEX "sucursales_departamento_idx" ON "sucursales" USING btree ("departamento");--> statement-breakpoint
CREATE INDEX "sucursales_activo_idx" ON "sucursales" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "idx_mensajes_soporte_ticket" ON "mensajes_soporte" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_mensajes_soporte_emisor" ON "mensajes_soporte" USING btree ("emisor_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_soporte_estado" ON "tickets_soporte" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_tickets_soporte_solicitante" ON "tickets_soporte" USING btree ("solicitante_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_soporte_agente" ON "tickets_soporte" USING btree ("agente_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_empleado_mes_empleado_idx" ON "reconocimiento_empleado_mes" USING btree ("empleado_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_empleado_mes_periodo_idx" ON "reconocimiento_empleado_mes" USING btree ("gestion","mes");--> statement-breakpoint
CREATE UNIQUE INDEX "reconocimiento_empleado_mes_unico_idx" ON "reconocimiento_empleado_mes" USING btree ("reconocimiento_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_equipo_responsable_idx" ON "reconocimiento_equipo" USING btree ("responsable_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_equipo_integrantes_reco_idx" ON "reconocimiento_equipo_integrantes" USING btree ("reconocimiento_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_logro_sucursal_sucursal_idx" ON "reconocimiento_logro_sucursal" USING btree ("sucursal_id");--> statement-breakpoint
CREATE INDEX "reconocimiento_logro_sucursal_tipo_idx" ON "reconocimiento_logro_sucursal" USING btree ("tipo_logro");--> statement-breakpoint
CREATE INDEX "reconocimientos_tipo_idx" ON "reconocimientos" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "reconocimientos_estado_idx" ON "reconocimientos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "reconocimientos_tipo_estado_idx" ON "reconocimientos" USING btree ("tipo","estado");--> statement-breakpoint
CREATE INDEX "reconocimientos_landing_idx" ON "reconocimientos" USING btree ("mostrar_en_landing","destacado","publicado_en");--> statement-breakpoint
CREATE INDEX "reconocimientos_creado_por_idx" ON "reconocimientos" USING btree ("creado_por");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_progreso_usuario_idx" ON "onboarding_progreso" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "onboarding_progreso_estado_idx" ON "onboarding_progreso" USING btree ("estado");