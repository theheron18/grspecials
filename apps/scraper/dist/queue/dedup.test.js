import { describe, it, expect } from 'vitest';
// Inline the similarity function for unit testing without DB
function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function similarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb)
        return 1;
    if (na.includes(nb) || nb.includes(na))
        return 0.8;
    const bigrams = (s) => Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2));
    const setA = new Set(bigrams(na));
    const setB = new Set(bigrams(nb));
    const intersection = [...setA].filter((b) => setB.has(b)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}
describe('similarity', () => {
    it('returns 1 for identical strings', () => {
        expect(similarity('Happy Hour at Founders', 'Happy Hour at Founders')).toBe(1);
    });
    it('detects high similarity for near-duplicates', () => {
        const score = similarity('$1 Off All Drafts Happy Hour', '$1 Off Drafts Happy Hour');
        expect(score).toBeGreaterThan(0.7);
    });
    it('returns low similarity for unrelated strings', () => {
        const score = similarity('Happy Hour — $1 Off Drafts', 'Taco Tuesday — 50% Off Tacos');
        expect(score).toBeLessThan(0.5);
    });
    it('handles substring containment', () => {
        const score = similarity('Happy Hour', 'Founders Happy Hour Special');
        expect(score).toBe(0.8);
    });
});
