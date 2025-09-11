const safeRationale = (r) => ({
  values: (r?.values || []).slice(0, 2),
  interests: (r?.interests || []).slice(0, 2),
  complementary: r?.complementary ? [r.complementary] : [],
});

const requireCohort = (cohortId) => {
  const c = String(cohortId || "").trim();
  if (!c) throw new Error("cohortId is required");
  return c;
};

module.exports = { safeRationale, requireCohort };
