import { paginate } from './pagination.dto';

describe('paginate', () => {
  it('computes totalPages from total and limit', () => {
    const result = paginate([{ id: 1 }], 45, 2, 20);
    expect(result.meta).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
    expect(result.data).toHaveLength(1);
  });

  it('returns 0 totalPages when total is 0', () => {
    const result = paginate([], 0, 1, 20);
    expect(result.meta.totalPages).toBe(0);
  });
});
