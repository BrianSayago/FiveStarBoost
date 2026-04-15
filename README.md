# Hotel Reputation Management SaaS - FiveStar Boost

## 🏨 Sobre el Proyecto

Este proyecto es una plataforma B2B (Software as a Service) diseñada para ayudar a los hoteles a gestionar de manera proactiva su reputación online. Su función principal es enviar encuestas de satisfacción a los huéspedes. Si un huésped tiene una experiencia negativa (1,2 o 3 estrellas), el sistema bloquea la publicación en sitios públicos y alerta en tiempo real a la gerencia del hotel para resolver el problema internamente. Si la experiencia es positiva (4 o 5 estrellas), se redirige automáticamente al huésped a plataformas como Google Reviews o TripAdvisor para potenciar la calificación pública del hotel.

> **Nota:** Este repositorio es **privado** puesto que constituye el core de un negocio SaaS en fase de producción. Este documento sirve como portafolio técnico y registro arquitectónico detallado.

---

## 🚀 Arquitectura y Tecnologías Utilizadas

Esta aplicación se construyó pensando en la escalabilidad, la seguridad (multi-tenant) y la experiencia de usuario (UX/UI premium).

### 💻 Frontend (Client & UI)
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router).
- **Librería de UI:** [React 18](https://react.dev/).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) con enfoque en 'Glassmorphism' (efectos translúcidos), animaciones sutiles (micro-interactions) y diseño UX premium. Se ha garantizado el soporte Dark/Light mode nativo con `next-themes`.
- **Gráficos y Analíticas:** [Recharts](https://recharts.org/) para visualizar datos de encuestas en el Dashboard.
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Manejo de Fechas:** `date-fns` y `date-fns-tz` para el parseo y manejo de zonas horarias en la programación de correos (ej. para que el huésped lo reciba de día y no de madrugada).

### ⚙️ Backend, Base de Datos & Autenticación
- **Backend as a Service (BaaS):** [Supabase](https://supabase.com/).
- **Base de Datos:** PostgreSQL.
- **Autenticación (Auth):** Supabase Auth (manejo seguro basado en sesiones).
- **Seguridad (Multi-tenant):** Row Level Security (RLS) policies de Supabase estrictamente aplicadas. Cada hotel (tenant) solo tiene acceso a sus propios datos, previniendo vulnerabilidades de Insecure Direct Object Reference (IDOR).
- **Tiempo Real:** Supabase Realtime empleado para enviar notificaciones Push/Sonoras críticas al Dashboard en milisegundos cuando un huésped deja un feedback de 1 o 2 estrellas.

### 🔄 Automatización y Flujos Asíncronos
- **Workflow Engine:** [n8n](https://n8n.io/) (Self-hosted/Local via túnel para conexiones webhook en producción).
- **Integraciones:** Supabase Webhooks notifican a n8n cuando se insertan reviews críticas. 
- **Email Service:** [Brevo](https://www.brevo.com/) (anteriormente Sendinblue) orquestado por n8n para enviar correos de alerta automáticos e inmediatos al personal del hotel.

---

## 🔥 Funcionalidades Clave (Features)

### 1. Ingesta Multi-Canal de Huéspedes
- Carga masiva de huéspedes a través de archivos **CSV**. El sistema procesa los datos, asigna y normaliza zonas horarias para un futuro correcto envío de campañas.
- Formularios de entrada manual robustos dentro del Dashboard para recepcionistas.

### 2. Motor de Encuestas Inteligente e Interceptación
- Páginas de encuesta dinámicas tematizadas con los logos y nombres de los respectivos hoteles.
- **Flujo de Rescate (1 - 3 Estrellas):** Si la calificación es baja, el usuario es llevado a un formulario privado para capturar sus quejas constructivamente, deteniendo las reseñas negativas públicas.
- **Flujo de Potenciación (4 - 5 Estrellas):** Los usuarios son invitados y redirigidos mediante un CTA a las plataformas donde el hotel quiere acumular más visibilidad (ej. Google, Booking).

### 3. Alertas Críticas de Tiempo Real
- Cuando se registra una queja grave, *Supabase Realtime* hace saltar una alerta visual y auditiva de forma instántanea en la pantalla del supervisor del hotel o Super Admin.
- Simultáneamente, Supabase dispara un webhook a n8n, el cual moldea la alerta mediante llamadas API de enriquecimiento de datos y luego ejecuta la orden en Brevo para que el director reciba un correo "URGENTE".

### 4. B2B Multi-Tenant Dashboard
- **Diseño Premium:** Una interfaz limpia, orientada a agilizar métricas, donde "Active Guests" sobresale usando jerarquía visual.
- **Ajustes y Personalización:** Sección donde cada hotel es capaz de modificar sus datos identitarios, URLs de redirección de reviews, permitiendo operabilidad white-label.
- **Super-Admin Interface:** Posibilidad de gestionar y supervisar todas las organizaciones y cadenas hoteleras clientes desde una vista master centralizada.

---

## 🛡️ Seguridad y Buenas Prácticas Aplicadas

- **Protección IDOR:** Eliminación de dependencias por "Hotel ID" en las URL para prevenir accesos no autorizados, moviendo toda la autorización al server side o a los headers de sesión de las bases de datos de PostgREST.
- **Data Integrity:** Manejo transaccional en PostgreSQL, con triggers y constraints. Validaciones rigurosas tanto para URLs en la subida de Settings del usuario como para el formato de los correos en la ingesta por CSV.

---

## 💼 Cómo mostrar este proyecto en tu Currículum si es PRIVADO

Dado que el código es propietario y la base de tu propio negocio SaaS, la mejor forma de "vender" la experiencia adquirida es:

1. **Crear un Repositorio Público (Portfolio):** Puedes publicar un repositorio que solo contenga este archivo `README.md`, junto a una carpeta con capturas de pantalla de la interfaz o GIFs demostrando cómo llega la alerta en tiempo real. 
2. **Destacar Soluciones Arquitectónicas:** A los reclutadores no les importa ver el código de un botón, les interesa saber cómo diseñaste el puente asíncrono entre la base de datos (Supabase Webhooks) y tu motor de mailing a través de un Middleware como N8N.
3. **Resaltar en tu CV las skills duras que dominaste:** "Next.js App Router, Supabase RLS (Multi-tenant Architecture), Automatización por Webhooks con n8n, PostgreSQL."
4. **Menciona el valor real del producto:** En lugar de decir "Hice un CRUD de huéspedes", pon *"Construí una solución end-to-end B2B diseñada para interceptar quejas y automatizar el Customer Success, orquestando bases de datos en tiempo real y servicios de e-mail automatizado."*
