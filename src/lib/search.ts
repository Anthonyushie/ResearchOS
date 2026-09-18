import type { ResearchRecord } from './mock-data';

export interface SearchResult {
  record: ResearchRecord;
  relevance: number;
  matchReason: string;
  matchingTopics: string[];
  excerpt: string;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function computeRelevance(record: ResearchRecord, queryTokens: string[]): { score: number; matchReason: string; matchingTopics: string[]; excerpt: string } {
  let score = 0;
  const matchReasons: string[] = [];
  const matchingTopics: string[] = [];

  const titleTokens = tokenize(record.title);
  const descTokens = tokenize(record.description);
  const extractedTokens = tokenize(record.extractedText);
  const allKeywords = record.keywords.map(k => k.toLowerCase());
  const allTopics = record.topics.map(t => t.toLowerCase());
  const allVariables = record.variables.map(v => v.toLowerCase());

  for (const qt of queryTokens) {
    // Title match — highest weight
    if (titleTokens.some(t => t.includes(qt) || qt.includes(t))) {
      score += 25;
      matchReasons.push(`Title contains "${qt}"`);
    }
    // Topic match
    for (const topic of allTopics) {
      if (topic.includes(qt) || qt.includes(topic.split(' ')[0])) {
        score += 20;
        const original = record.topics.find(t => t.toLowerCase() === topic);
        if (original && !matchingTopics.includes(original)) matchingTopics.push(original);
      }
    }
    // Keyword match
    if (allKeywords.some(k => k.includes(qt) || qt.includes(k))) {
      score += 15;
    }
    // Variable match
    if (allVariables.some(v => v.includes(qt))) {
      score += 10;
    }
    // Description match
    if (descTokens.some(t => t.includes(qt) || qt.includes(t))) {
      score += 8;
    }
    // Extracted text match
    if (extractedTokens.some(t => t === qt)) {
      score += 5;
    }
  }

  // Type match bonus
  const queryStr = queryTokens.join(' ');
  if (queryStr.includes('experiment') && record.type === 'experiment') score += 15;
  if (queryStr.includes('dataset') && record.type === 'dataset') score += 15;
  if (queryStr.includes('paper') && record.type === 'paper') score += 15;

  // Normalize to 0-100
  const maxPossible = queryTokens.length * (25 + 20 + 15 + 10 + 8 + 5) + 15;
  const normalizedScore = Math.min(Math.round((score / maxPossible) * 100), 99);

  // Generate match reason
  let matchReason = '';
  if (matchReasons.length > 0) {
    matchReason = `This ${record.type} matches because: ${matchReasons.slice(0, 3).join(', ')}.`;
  } else if (matchingTopics.length > 0) {
    matchReason = `This ${record.type} covers related topics: ${matchingTopics.join(', ')}.`;
  } else {
    matchReason = `This ${record.type} contains keywords related to the search query.`;
  }

  // Get relevant excerpt
  let excerpt = record.description;
  for (const qt of queryTokens) {
    const idx = record.extractedText.toLowerCase().indexOf(qt);
    if (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(record.extractedText.length, idx + 100);
      excerpt = (start > 0 ? '...' : '') + record.extractedText.slice(start, end) + (end < record.extractedText.length ? '...' : '');
      break;
    }
  }

  return { score: normalizedScore, matchReason, matchingTopics, excerpt };
}

export function searchResearch(query: string, records: ResearchRecord[]): SearchResult[] {
  if (!query.trim()) return [];

  const queryTokens = tokenize(query)
    .filter(t => !['show', 'me', 'find', 'search', 'for', 'the', 'a', 'an', 'in', 'on', 'and', 'or', 'to', 'of', 'with', 'which', 'what', 'how', 'that', 'related', 'about', 'my', 'all', 'any', 'are', 'is', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had', 'been', 'being', 'be', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'across'].filter(Boolean));

  if (queryTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const record of records) {
    const { score, matchReason, matchingTopics, excerpt } = computeRelevance(record, queryTokens);
    if (score > 5) {
      results.push({
        record,
        relevance: score,
        matchReason,
        matchingTopics,
        excerpt
      });
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results;
}

export function findRelated(recordId: string, records: ResearchRecord[]): SearchResult[] {
  const record = records.find(r => r.id === recordId);
  if (!record) return [];

  const otherRecords = records.filter(r => r.id !== recordId);
  const results: SearchResult[] = [];

  for (const other of otherRecords) {
    const sharedTopics = record.topics.filter(t => other.topics.some(ot => ot.toLowerCase() === t.toLowerCase()));
    const sharedKeywords = record.keywords.filter(k => other.keywords.some(ok => ok.toLowerCase() === k.toLowerCase()));
    const sharedVariables = record.variables.filter(v => other.variables.some(ov => ov.toLowerCase() === v.toLowerCase()));
    const sharedAuthors = record.authors.filter(a => other.authors.includes(a));

    const score = sharedTopics.length * 20 + sharedKeywords.length * 10 + sharedVariables.length * 15 + sharedAuthors.length * 5;
    const normalizedScore = Math.min(Math.round(score / 2), 99);

    if (normalizedScore > 10) {
      const reasons: string[] = [];
      if (sharedTopics.length > 0) reasons.push(`both cover ${sharedTopics.slice(0, 3).join(', ')}`);
      if (sharedKeywords.length > 0) reasons.push(`share keywords: ${sharedKeywords.slice(0, 3).join(', ')}`);
      if (sharedVariables.length > 0) reasons.push(`measure similar variables`);
      if (sharedAuthors.length > 0) reasons.push(`share author(s): ${sharedAuthors.join(', ')}`);

      results.push({
        record: other,
        relevance: normalizedScore,
        matchReason: `Related because ${reasons.join('; ')}.`,
        matchingTopics: sharedTopics,
        excerpt: other.description
      });
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, 4);
}
