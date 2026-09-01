import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

# ================================================
# CONFIGURACIÓN SMTP (.env)
# ================================================
SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "FutbolZone Oficial")
SMTP_FROM      = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@futbolzone.com")
SMTP_TLS       = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
SMTP_SSL       = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")
FRONTEND_URL   = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _generar_plantilla_html_bienvenida(nombre: str, to_email: str) -> str:
    """Genera la plantilla HTML con diseño visual responsivo y corporativo de FutbolZone."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a FutbolZone!</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
    }}
    .email-wrapper {{
      max-width: 600px;
      margin: 30px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }}
    .email-header {{
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%);
      padding: 35px 25px;
      text-align: center;
    }}
    .email-header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }}
    .email-header p {{
      margin: 8px 0 0;
      color: #d1fae5;
      font-size: 15px;
      font-weight: 500;
    }}
    .email-body {{
      padding: 32px 28px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }}
    .welcome-text {{
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }}
    .account-card {{
      background-color: #1e293b;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 28px;
    }}
    .account-card-title {{
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #10b981;
      font-weight: 700;
      margin-bottom: 10px;
    }}
    .detail-row {{
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }}
    .detail-row:last-child {{
      margin-bottom: 0;
    }}
    .detail-label {{
      color: #64748b;
    }}
    .detail-val {{
      color: #f1f5f9;
      font-weight: 600;
    }}
    .benefits-title {{
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }}
    .benefits-list {{
      list-style: none;
      padding: 0;
      margin: 0 0 28px 0;
    }}
    .benefits-list li {{
      padding: 6px 0;
      font-size: 14px;
      color: #cbd5e1;
    }}
    .benefits-list li span {{
      color: #10b981;
      margin-right: 8px;
    }}
    .btn-container {{
      text-align: center;
      margin: 30px 0 20px;
    }}
    .btn-action {{
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 36px;
      border-radius: 9999px;
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
    }}
    .email-footer {{
      background-color: #090d16;
      border-top: 1px solid #1e293b;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }}
    .email-footer a {{
      color: #10b981;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>⚽ FutbolZone</h1>
      <p>Gestión y Reserva de Canchas Sintéticas</p>
    </div>
    
    <div class="email-body">
      <h2 class="greeting">¡Hola, {nombre}! 👋</h2>
      <p class="welcome-text">
        Tu cuenta en <strong>FutbolZone</strong> ha sido creada exitosamente. Ya tienes acceso total a nuestra plataforma para organizar tus partidos con amigos y reservar canchas sintéticas en tiempo real.
      </p>

      <div class="account-card">
        <div class="account-card-title">Resumen de tu Cuenta</div>
        <div class="detail-row">
          <span class="detail-label">👤 Titular:</span>
          <span class="detail-val">{nombre}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📧 Correo Registrado:</span>
          <span class="detail-val">{to_email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⚡ Estado:</span>
          <span class="detail-val" style="color: #10b981;">Cuenta Activa & Verificada</span>
        </div>
      </div>

      <div class="benefits-title">¿Qué puedes hacer ahora?</div>
      <ul class="benefits-list">
        <li><span>✓</span> Explorar canchas de Fútbol 5, 7 y 11 con iluminación LED y césped profesional.</li>
        <li><span>✓</span> Reservar turnos en tiempo real con confirmación inmediata.</li>
        <li><span>✓</span> Gestionar y consultar tu historial de partidos desde "Mis Reservas".</li>
      </ul>

      <div class="btn-container">
        <a href="{FRONTEND_URL}" class="btn-action" target="_blank">
          Ir a FutbolZone y Reservar
        </a>
      </div>
    </div>

    <div class="email-footer">
      <p>Este es un correo automático de confirmación generado por el sistema <strong>FutbolZone (SENA ADSO III)</strong>.</p>
      <p>Si no realizaste este registro, por favor ignora este mensaje o contáctanos a <a href="mailto:soporte@futbolzone.com">soporte@futbolzone.com</a>.</p>
      <p>© 2026 FutbolZone. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>"""


def send_welcome_email(to_email: str, nombre: str, apellido: str = "") -> bool:
    """
    Envía un correo de bienvenida real vía SMTP.
    Si no hay credenciales SMTP configuradas en .env, registra un log informativo
    sin interrumpir la ejecución del servidor.
    """
    nombre_completo = f"{nombre} {apellido}".strip() if apellido else nombre

    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL SERVICE WARNING] SMTP_USER o SMTP_PASSWORD no configurados en .env.")
        print(f"[EMAIL SERVICE SIMULATED] Destinatario: '{to_email}' | Nombre: '{nombre_completo}'")
        print(f"[EMAIL SERVICE INFO] Para habilitar el envío real, agrega tus credenciales en 'backend/.env'.")
        return False

    try:
        # 1. Crear el mensaje MIME multipart
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚽ ¡Bienvenido a FutbolZone, {nombre}! Tu cuenta está lista"
        msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
        msg["To"]      = to_email

        # 2. Contenido texto plano (fallback)
        texto_plano = (
            f"¡Hola {nombre_completo}!\n\n"
            f"Tu cuenta en FutbolZone ha sido creada exitosamente.\n"
            f"Correo registrado: {to_email}\n\n"
            f"Ingresa a {FRONTEND_URL} para reservar tus canchas favoritas.\n\n"
            f"FutbolZone (SENA ADSO III)"
        )
        msg.attach(MIMEText(texto_plano, "plain", "utf-8"))

        # 3. Contenido HTML estilizado
        html_content = _generar_plantilla_html_bienvenida(nombre_completo, to_email)
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # 4. Enviar mediante SMTP (SSL o STARTTLS)
        if SMTP_SSL or SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                if SMTP_TLS:
                    server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, [to_email], msg.as_string())

        print(f"[EMAIL SERVICE SUCCESS] Correo de bienvenida enviado exitosamente a '{to_email}'.")
        return True

    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] No se pudo enviar el correo a '{to_email}': {e}")
        return False


def _generar_plantilla_html_pin_reset(nombre: str, pin: str) -> str:
    """Genera la plantilla HTML profesional con el código PIN de verificación."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Seguridad - FutbolZone</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #06150e;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
    }}
    .email-wrapper {{
      max-width: 540px;
      margin: 30px auto;
      background-color: #0c2b1e;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }}
    .email-header {{
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%);
      padding: 32px 20px;
      text-align: center;
    }}
    .email-header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }}
    .email-body {{
      padding: 34px 28px;
      text-align: center;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 0;
    }}
    .info-text {{
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 24px;
    }}
    .pin-container {{
      background: #021a11;
      border: 2px dashed #10b981;
      border-radius: 14px;
      padding: 20px;
      margin: 24px auto;
      display: inline-block;
    }}
    .pin-code {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #34d399;
      margin: 0;
    }}
    .expiry-badge {{
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 999px;
      margin-top: 14px;
    }}
    .security-note {{
      font-size: 12.5px;
      color: #94a3b8;
      margin-top: 24px;
      line-height: 1.5;
    }}
    .email-footer {{
      background-color: #040f0a;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 22px;
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>⚽ FutbolZone</h1>
      <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13.5px; font-weight: 600;">
        Complejo Deportivo & Canchas Sintéticas
      </p>
    </div>
    
    <div class="email-body">
      <h2 class="greeting">¡Hola, {nombre}! 👋</h2>
      <p class="info-text">
        <strong>Somos FutbolZone.</strong> Recibimos una solicitud para restablecer la contraseña de tu cuenta. Este es tu código PIN de seguridad:
      </p>

      <div class="pin-container">
        <p class="pin-code">{pin}</p>
      </div>

      <div>
        <span class="expiry-badge">⏳ Válido por 15 minutos · Código de un solo uso</span>
      </div>

      <p class="security-note">
        Ingresa estos 6 dígitos en la aplicación para crear tu nueva clave.<br>
        Si no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña actual continuará protegida.
      </p>
    </div>

    <div class="email-footer">
      <p>Este es un correo oficial generado automáticamente por <strong>FutbolZone (SENA ADSO III)</strong>.</p>
      <p>© 2026 FutbolZone. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>"""


def send_password_reset_pin_email(to_email: str, nombre: str, pin: str) -> bool:
    """Envía el correo real vía SMTP."""
    smtp_user_active = os.getenv("SMTP_USER", "")
    smtp_pass_active = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user_active or not smtp_pass_active:
        print(f"\n=======================================================")
        print(f"📧 [AVISO SMTP] Correo generado para '{to_email}' ({nombre}):")
        print(f"   Mensaje: 'Somos FutbolZone, este es tu PIN: >>> {pin} <<<'")
        print(f"   Para que llegue a tu bandeja de Gmail real, configura")
        print(f"   SMTP_USER y SMTP_PASSWORD en el archivo 'backend/.env'.")
        print(f"=======================================================\n")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 [FutbolZone] Tu código de seguridad es: {pin}"
        msg["From"]    = f"{SMTP_FROM_NAME} <{smtp_user_active}>"
        msg["To"]      = to_email

        texto_plano = (
            f"¡Hola {nombre}!\n\n"
            f"Somos FutbolZone. Este es tu código PIN de seguridad para restablecer tu contraseña:\n\n"
            f">>> {pin} <<<\n\n"
            f"Este código es válido por 15 minutos.\n\n"
            f"FutbolZone SENA ADSO III"
        )
        msg.attach(MIMEText(texto_plano, "plain", "utf-8"))
        msg.attach(MIMEText(_generar_plantilla_html_pin_reset(nombre, pin), "html", "utf-8"))

        if SMTP_SSL or SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.login(smtp_user_active, smtp_pass_active)
                server.sendmail(smtp_user_active, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                if SMTP_TLS:
                    server.starttls()
                server.login(smtp_user_active, smtp_pass_active)
                server.sendmail(smtp_user_active, [to_email], msg.as_string())

        print(f"[EMAIL SERVICE SUCCESS] ¡Correo con PIN enviado exitosamente a la bandeja de '{to_email}'!")
        return True
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] No se pudo enviar el correo real a '{to_email}': {e}")
        return False

