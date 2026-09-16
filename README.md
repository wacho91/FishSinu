<img width="1200" height="787" alt="image" src="https://github.com/user-attachments/assets/0834a0a4-760f-480b-8830-e777a97992d5" />🐟 FishSinu - ERP Marítimo para Gestión de Pescaderías
FishSinu es un SaaS ERP (Software as a Service - Enterprise Resource Planning) de nivel corporativo, diseñado específicamente para digitalizar y optimizar la operación de pescaderías y comercializadoras de mariscos.

Construido con una arquitectura moderna desacoplada (Headless), maneja inventario en unidades de peso (kilos/libras), punto de venta (POS), sistema de créditos con abonos, facturación detallada y métricas contables en tiempo real.

🚀 Características Principales
Inventario Fraccionario (Kardex): Control exacto de stock en kilogramos. Entradas (compras a proveedores), salidas (ventas), ajustes y mermas con cálculo automático de stock_after.
Punto de Venta (POS) Rápido: Interfiz optimizada para cajeros, con buscador en tiempo real, cálculo de subtotales según kilos y descuento automático de inventario.
Sistema de Créditos y Cartera: Gestión de cuentas de crédito para restaurantes y clientes fijos. Registro de abonos con descuento automático del saldo deudor.
Facturación Electrónica Detallada: Generación de documentos fiscales con desglose exacto (kilos comprados, precio por kilo, total línea, estado de crédito/contado).
Dashboard Financiero (Contabilidad de Caja): Diferenciación clara entre "Ingresos en Caja" (Ventas de contado + Abonos de crédito) y "Crédito por cobrar".
Cierre de Caja (Z-Report): Reporte de cierre diario que desglosa los ingresos por método de pago (Efectivo, Transferencia, Tarjeta, Crédito) y el movimiento total de mercancía.
Ciberseguridad y Autenticación: Login seguro gestionado nativamente con Supabase Auth.

🛠️ Stack Tecnológico
Backend: Python, FastAPI (Arquitectura Asíncrona), SQLAlchemy, JWT, Pydantic.
Frontend: React, Vite, Tailwind CSS, Zustand (State Management), Recharts, SweetAlert2.
Base de Datos: PostgreSQL (Gestionado en la nube con Supabase).
Arquitectura: REST API desacoplada (Headless), lista para consumirse desde cualquier cliente web o móvil futuro.

⚙️ Variables de Entorno
Para ejecutar este proyecto, necesitarás configurar las siguientes variables de entorno.

Backend (backend/.env)

DATABASE_URL=postgresql+asyncpg://postgres.[TU_PROJECT_ID]:[TU_CONTRASEÑA]@aws-0-[TU_REGION].pooler.supabase.com:6543/postgresJWT_SECRET=tu_secreto_super_seguro_aquiFISHSINU_AUTO_CREATE_TABLES=true
Frontend (frontend/src/services/supabaseClient.js)

const supabaseUrl = 'https://[TU_PROJECT_ID].supabase.co'
const supabaseAnonKey = '[TU_ANON_KEY]'

🏁 Instalación Local y Ejecución
Sigue estos pasos para replicar el proyecto en tu entorno local:

1. Clonar el repositorio

git clone https://github.com/TU_USUARIO/FishSinu.git
cd FishSinu

2. Configurar y Levantar el Backend
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
pip install asyncpg psycopg2-binary python-dotenv

# Configurar variables de entorno
# Crea un archivo .env en la carpeta backend/ y pega las variables de entorno mencionadas arriba

# Iniciar el servidor
uvicorn src.main:app --reload --port 8000

3. Configurar y Levantar el Frontend

Abre una nueva terminal (sin cerrar la del backend):

cd frontend
npm install
npm run dev

El frontend estará corriendo en http://localhost:5173.

Despliegue en Producción
Este proyecto está preparado para ser desplegado en la nube de forma gratuita o económica utilizando las siguientes plataformas:

Base de Datos: Supabase (PostgreSQL gestionado). Asegúrate de usar el "Connection Pooler" (puerto 6543) y agregar el parámetro connect_args={"statement_cache_size": 0} en SQLAlchemy para evitar errores con PgBouncer.
Backend: Render. Crear un Web Service de Python, apuntando el "Root Directory" a la carpeta backend.
Frontend: Vercel. Importar el repositorio, apuntando el "Root Directory" a la carpeta frontend y configurando el Framework Preset a "Vite".

📄 Licencia
Este proyecto es de uso interno / demostración. Todos los derechos reservados.

Desarrollado con ❤️ por Cristian (Wacho91) y Z (AI Architect).
