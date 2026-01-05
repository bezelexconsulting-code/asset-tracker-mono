export type EmailPayload = Record<string, any>;

const baseStyles = 'font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5';
const card = (title: string, body: string) => `<!doctype html><html><body style="${baseStyles};margin:0;padding:0;background:#f9fafb"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px"><tr><td style="padding:24px"><div style="font-size:18px;font-weight:700">${title}</div><div style="margin-top:12px;font-size:14px">${body}</div></td></tr></table></td></tr></table></body></html>`;
const btn = (href: string, text: string) => `<a href="${href}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:14px">${text}</a>`;
const p = (t: string) => `<p style="margin:0 0 8px">${t}</p>`;
const small = (t: string) => `<div style="color:#6b7280;font-size:12px;margin-top:8px">${t}</div>`;

export const EmailTemplates = {
  technicianInvite(payload: EmailPayload) {
    const title = `Welcome to ${payload.org_name}`;
    const body = [
      p(`Hi ${payload.tech_name || 'Technician'},`),
      p(`You have been invited to work on jobs for ${payload.org_name}.`),
      p(`Use your personal link to access the technician app:`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'Open Technician App')}</div>`,
      small(`If the button does not work, paste this link: ${payload.link}`),
    ].join('');
    return card(title, body);
  },
  jobAssigned(payload: EmailPayload) {
    const title = `New Job Assigned: ${payload.title}`;
    const body = [
      p(`Hi ${payload.tech_name || 'Technician'},`),
      p(`A job has been assigned to you by ${payload.org_name}.`),
      p(`Client: ${payload.client_name}`),
      p(`Site: ${payload.site_name}${payload.address ? ' • ' + payload.address : ''}`),
      p(`Assets: ${Array.isArray(payload.assets) ? payload.assets.join(', ') : payload.assets || '—'}`),
      p(`Notes: ${payload.notes || '—'}`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'View Job')}</div>`,
      small(`Job ID: ${payload.job_id}`),
    ].join('');
    return card(title, body);
  },
  jobReminder(payload: EmailPayload) {
    const title = `Reminder: ${payload.title}`;
    const body = [
      p(`This is a reminder for your job.`),
      p(`Due: ${payload.due_at || '—'}`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'Open Job')}</div>`,
    ].join('');
    return card(title, body);
  },
  jobCompletedSignoff(payload: EmailPayload) {
    const title = `Job Completed: ${payload.title}`;
    const body = [
      p(`Client: ${payload.client_name}`),
      p(`Site: ${payload.site_name}`),
      p(`Completed by: ${payload.tech_name}`),
      p(`Attachments and signature are included in the report.`),
      `<div style="margin:12px 0">${btn(payload.pdf_url || '#', 'Download Sign-off PDF')}</div>`,
      small(`Job ID: ${payload.job_id}`),
    ].join('');
    return card(title, body);
  },
  assetQualityAlert(payload: EmailPayload) {
    const title = `Asset Quality Alert: ${payload.asset_name}`;
    const body = [
      p(`Asset Tag: ${payload.asset_tag}`),
      p(`Condition marked as ${payload.condition}`),
      p(`Client: ${payload.client_name}`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'View Asset')}</div>`,
    ].join('');
    return card(title, body);
  },
  dailyDigest(payload: EmailPayload) {
    const title = `${payload.org_name} Daily Digest`;
    const lines = [
      `Assets: ${payload.assets_count}`,
      `Jobs Created Today: ${payload.jobs_today}`,
      `Completed Today: ${payload.jobs_completed}`,
      `Technicians Active: ${payload.techs_active}`,
    ];
    const body = [
      p(lines.join(' • ')),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'Open Dashboard')}</div>`,
    ].join('');
    return card(title, body);
  },
  monthlyOrgSummary(payload: EmailPayload) {
    const title = `${payload.org_name} Monthly Summary`;
    const body = [
      p(`Period: ${payload.period}`),
      p(`Assets: ${payload.assets_count}`),
      p(`Jobs: ${payload.jobs_count}`),
      p(`Sign-offs: ${payload.signoffs_count}`),
      `<div style="margin:12px 0">${btn(payload.pdf_url || '#', 'Download Summary PDF')}</div>`,
    ].join('');
    return card(title, body);
  },
  technicianCredentialsSet(payload: EmailPayload) {
    const title = `Credentials Set`;
    const body = [
      p(`Username: ${payload.username}`),
      p(`If you forget your password, contact your admin.`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'Open Technician App')}</div>`,
    ].join('');
    return card(title, body);
  },
  requestTechnicianReceived(payload: EmailPayload) {
    const title = `Technician Request Received`;
    const body = [
      p(`Org: ${payload.org_name}`),
      p(`Requester: ${payload.requester_email}`),
      p(`Note: ${payload.note || '—'}`),
      `<div style="margin:12px 0">${btn(payload.link || '#', 'Review Requests')}</div>`,
    ].join('');
    return card(title, body);
  },
};

