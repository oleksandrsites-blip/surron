// Cloudflare Pages Function: POST /api/lead → повідомлення в Telegram.
// Копіювати в functions/api/lead.js проєкту. Заміни SITE_NAME і поля під свою форму.
// Змінні в Cloudflare Pages (Settings → Variables and secrets → Production):
//   TELEGRAM_BOT_TOKEN — токен бота від @BotFather (Secret)
//   TELEGRAM_CHAT_ID   — chat id, куди слати заявки (можна кілька через кому)

const SITE_NAME = 'Sur-Ron Ukraine';

const clean = (v, max) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  // honeypot: боти заповнюють приховане поле
  if (data.company) return json({ ok: true });

  const name = clean(data.name, 60);
  const phone = clean(data.phone, 20);
  const type = clean(data.type, 20);
  const model = clean(data.model, 60);
  const payment = clean(data.payment, 80);
  const via = ['Telegram', 'Viber', 'WhatsApp', 'Дзвінок'].includes(data.via) ? data.via : '';
  if (!/\p{L}{2}/u.test(name) || phone.replace(/\D/g, '').length < 10) return json({ ok: false }, 422);

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatIds = String(env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chatIds.length) return json({ ok: false, error: 'not configured' }, 500);

  const lines = [
    `🔔 Нова заявка — ${SITE_NAME}`, '',
    `Ім'я: ${name}`,
    `Телефон: ${phone}`,
    via && `Зв'язок: ${via}`,
    type && `Тип: ${type}`,
    model && `Модель: ${model}`,
    payment && `Оплата: ${payment}`,
  ].filter(Boolean);

  const results = await Promise.all(chatIds.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: lines.join('\n') }),
    })
  ));
  const ok = results.some((r) => r.ok);
  return json({ ok }, ok ? 200 : 502);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
