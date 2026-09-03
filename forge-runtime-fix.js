(() => {
  'use strict';
  const SUPABASE_URL = 'https://aezyaoyghkvvdciatnct.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_sFBO4x6k0KhDdHUVPNdeAw_aUj6rhod';
  const RUNNER_URL = `${SUPABASE_URL}/functions/v1/forge-runner`;

  async function getSession() {
    if (window.s23Client?.auth?.getSession) {
      const { data, error } = await window.s23Client.auth.getSession();
      if (error) throw error;
      return data?.session || null;
    }
    const raw = localStorage.getItem('sb-aezyaoyghkvvdciatnct-auth-token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token ? parsed : null;
  }

  async function runner(payload) {
    const session = await getSession();
    if (!session?.access_token) throw new Error('FORGE owner session required');
    const r = await fetch(RUNNER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${r.status}`);
    return data;
  }

  const originalRefreshAutonomy = typeof window.refreshAutonomy === 'function'
    ? window.refreshAutonomy.bind(window)
    : null;

  let lastRunAt = 0;
  let lastDelay = 120000;
  let lastStatus = null;
  let inFlight = false;

  function computeDelay(data) {
    if (document.hidden) return Infinity;
    const missions = Array.isArray(data?.missions) ? data.missions : [];
    const active = missions.some(m => ['queued','running','awaiting_approval'].includes(m?.status));
    return active ? 30000 : 120000;
  }

  async function refreshStatus(force = false) {
    if (document.hidden || inFlight) return lastStatus;
    const now = Date.now();
    if (!force && now - lastRunAt < lastDelay) return lastStatus;
    inFlight = true;
    try {
      const data = await runner({ action: 'status' });
      lastStatus = data;
      lastDelay = computeDelay(data);
      lastRunAt = Date.now();
      if (originalRefreshAutonomy) {
        const previousRunner = window.forgeRunner;
        window.forgeRunner = async payload => payload?.action === 'status' ? data : runner(payload);
        try { await originalRefreshAutonomy(); }
        finally { window.forgeRunner = runner; }
      }
      window.dispatchEvent(new CustomEvent('forge:runner-status', { detail: data }));
      return data;
    } finally {
      inFlight = false;
    }
  }

  window.refreshAutonomy = () => refreshStatus(false);
  window.forgeRunner = runner;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshStatus(true).catch(() => {});
  });
  window.FORGERuntimeFix = {
    getSession,
    runner,
    refreshStatus,
    forceRefresh: () => refreshStatus(true),
    getPollingDelay: () => document.hidden ? null : lastDelay,
    getLastStatus: () => lastStatus,
    version: '1.1.0'
  };
})();
