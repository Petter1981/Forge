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

  let timer = null;
  let lastDelay = null;
  let running = false;

  function stopTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function computeDelay(data) {
    if (document.hidden) return null;
    const missions = Array.isArray(data?.missions) ? data.missions : [];
    const active = missions.some(m => ['queued','running','awaiting_approval'].includes(m?.status));
    return active ? 30000 : 120000;
  }

  async function refreshOnce() {
    if (running || document.hidden) return;
    running = true;
    try {
      const data = await runner({ action: 'status' });
      if (typeof window.refreshAutonomyFromData === 'function') {
        window.refreshAutonomyFromData(data);
      }
      const delay = computeDelay(data);
      lastDelay = delay;
      stopTimer();
      if (delay) timer = setTimeout(refreshOnce, delay);
      window.dispatchEvent(new CustomEvent('forge:runner-status', { detail: data }));
      return data;
    } finally {
      running = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else {
      refreshOnce().catch(() => {});
    }
  });

  window.forgeRunner = runner;
  window.FORGERuntimeFix = {
    getSession,
    runner,
    refreshOnce,
    stop: stopTimer,
    getPollingDelay: () => lastDelay,
    version: '1.0.0'
  };
})();
