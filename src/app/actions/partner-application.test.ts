import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  rateLimit: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  upsert: vi.fn(),
  adminEmail: vi.fn(),
  confirmationEmail: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/rate-limit', () => ({ checkKeyedRateLimitDistributed: mocks.rateLimit }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    partnerApplication: {
      count: mocks.count,
      create: mocks.create,
      update: mocks.update,
      updateMany: mocks.updateMany,
      delete: mocks.delete,
      deleteMany: mocks.deleteMany,
      upsert: mocks.upsert,
    },
  },
}));
vi.mock('@/lib/email', () => ({
  sendPilotPartnerApplicationEmail: mocks.adminEmail,
  sendPilotPartnerConfirmationEmail: mocks.confirmationEmail,
}));

import { submitPartnerApplication, type PartnerApplyState } from './partner-application';
import {
  FOUNDING_APPLICATIONS_CLOSED_CODE,
  FOUNDING_APPLICATIONS_CLOSED_MESSAGE,
} from '@/lib/founding-program';

function application(): FormData {
  const data = new FormData();
  data.set('pilot_partner_application', '1');
  data.set('companyName', 'Fixture Agency');
  data.set('email', 'fixture@example.test');
  data.set('agencyWebsite', 'https://example.test');
  data.set('clientSites', '6-20');
  return data;
}

const closedState = {
  ok: false,
  errorKey: 'programClosed',
  programClosed: true,
  code: FOUNDING_APPLICATIONS_CLOSED_CODE,
  message: FOUNDING_APPLICATIONS_CLOSED_MESSAGE,
};

beforeEach(() => {
  vi.resetAllMocks();
  // These boundaries must remain untouched even if every dependency is down.
  for (const mock of Object.values(mocks)) {
    mock.mockImplementation(() => { throw new Error('Unexpected external side effect'); });
  }
});
afterEach(() => { vi.unstubAllEnvs(); });

function expectNoSideEffects() {
  for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
}

describe('closed founding application intake', () => {
  it('rejects a valid application with an explicit closed code and no database or email calls', async () => {
    expect(await submitPartnerApplication({ ok: false }, application())).toEqual(closedState);
    expectNoSideEffects();
  });

  it.each<PartnerApplyState>([
    { ok: true },
    { ok: false, errorKey: 'saveFailed' },
    { ok: false, errorKey: 'programFull', programFull: true },
  ])('cannot bypass closure with stale client state %j', async (previousState) => {
    expect(await submitPartnerApplication(previousState, application())).toEqual(closedState);
    expectNoSideEffects();
  });

  it.each(['empty', 'honeypot', 'forged-open'])('does not write or acknowledge a %s submission', async (kind) => {
    const data = kind === 'empty' ? new FormData() : application();
    if (kind === 'honeypot') data.set('hp_website', 'bot-filled');
    if (kind === 'forged-open') data.set('FOUNDING_APPLICATIONS_OPEN', 'true');
    expect(await submitPartnerApplication({ ok: false }, data)).toEqual(closedState);
    expectNoSideEffects();
  });

  it('returns the closed state without reading submitted personal information', async () => {
    const data = application();
    const get = vi.spyOn(data, 'get').mockImplementation(() => { throw new Error('Do not read closed submissions'); });
    expect(await submitPartnerApplication({ ok: false }, data)).toEqual(closedState);
    expect(get).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it('does not reopen intake when environment flags or remaining capacity suggest availability', async () => {
    vi.stubEnv('FOUNDING_APPLICATIONS_OPEN', 'true');
    vi.stubEnv('MAX_PILOT_SPOTS', '999');
    vi.stubEnv('NEXT_PUBLIC_MAX_PILOT_SPOTS', '999');
    mocks.count.mockResolvedValue(0);
    expect(await submitPartnerApplication({ ok: false }, application())).toEqual(closedState);
    expectNoSideEffects();
  });
});
