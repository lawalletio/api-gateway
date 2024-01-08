import handler, { MAX_LIMIT } from '@rest/nostr/fetch/post';
import { ExtendedRequest } from '@type/request';
import EventEmitter from 'events';

const mockRes: any = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
const mockRec: any = {
  context: {
    readNDK: {
      fetchEvents: jest.fn(),
      pool: new EventEmitter(),
    },
  },
};

describe('POST /nostr/fetch', () => {
  it.each([
    { cond: 'null body', body: null, expectedStatusCode: 415 },
    { cond: 'invalid filter', body: { kind: [1112] }, expectedStatusCode: 422 },
  ])(
    'should return $expectedStatusCode on $cond',
    ({
      body,
      expectedStatusCode,
    }: {
      body: object | null;
      expectedStatusCode: number;
    }) => {
      handler({ body } as ExtendedRequest, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(expectedStatusCode);
    },
  );

  it.each([
    { body: {}, expectedLimit: MAX_LIMIT },
    { body: { limit: MAX_LIMIT + 1 }, expectedLimit: MAX_LIMIT },
    { body: { limit: 1 }, expectedLimit: 1 },
  ])(
    'should respect max limit',
    async ({
      body,
      expectedLimit,
    }: {
      body: object;
      expectedLimit: number;
    }) => {
      const events = [
        {
          rawEvent: () => {
            return {
              id: 'ea5c853c4ff9101963423240f8a54d98aeb1bf9318da08a75f564b02ea6771fe',
            };
          },
        },
        {
          rawEvent: () => {
            return {
              id: '41051df22e8e287d272b0759539878e8652aa984ff50f2cf710b669147104ca1',
            };
          },
        },
      ];
      mockRec.context.readNDK.fetchEvents.mockResolvedValue(new Set(events));

      await handler({ body, ...mockRec }, mockRes);

      expect(mockRec.context.readNDK.fetchEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: expectedLimit }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        events.map((e) => e.rawEvent()),
      );
    },
  );

  it('should handle notices from the relay', async () => {
    const expectedError = 'Oops';
    mockRec.context.readNDK.fetchEvents.mockImplementation(
      () => new Promise(() => {}),
    );

    const reqHandler = handler({ body: {}, ...mockRec }, mockRes);
    mockRec.context.readNDK.pool.emit('notice', null, expectedError);
    await reqHandler;

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ERROR',
      reason: expectedError,
    });
  });

  it('should return error if fetching failed', async () => {
    mockRec.context.readNDK.fetchEvents.mockRejectedValue();

    await handler({ body: {}, ...mockRec }, mockRes);

    expect(mockRec.context.readNDK.fetchEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_LIMIT }),
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
