import type { ResearchRecord } from './mock-data';

export interface ExtractedMetadata {
  title: string;
  topics: string[];
  keywords: string[];
  authors: string[];
  date: string;
  experimentName: string;
  variables: string[];
}

export function mockExtractMetadata(fileName: string): ExtractedMetadata {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');

  return {
    title: baseName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    topics: ['Soil Science', 'Agriculture', 'Plant Biology'],
    keywords: ['soil', 'nutrients', 'crops', 'growth', 'analysis'],
    authors: ['Unknown Author'],
    date: new Date().toISOString().split('T')[0],
    experimentName: `EXP-${Date.now().toString(36).toUpperCase()}`,
    variables: ['Independent variable', 'Dependent variable'],
  };
}

export function mockGenerateComparison(
  a: ResearchRecord,
  b: ResearchRecord
): { similarities: string[]; differences: string[] } {
  const sharedTopics = a.topics.filter(t =>
    b.topics.some(bt => bt.toLowerCase() === t.toLowerCase())
  );

  const similarities = [
    `Both studies investigate aspects of ${sharedTopics.length > 0 ? sharedTopics.slice(0, 2).join(' and ').toLowerCase() : 'agricultural science'}`,
    `Both are ${a.type === b.type ? `classified as ${a.type}s` : 'research contributions in the same domain'}`,
  ];

  const differences = [
    `"${a.title}" focuses on ${a.topics.slice(0, 2).join(', ').toLowerCase()}, while "${b.title}" focuses on ${b.topics.slice(0, 2).join(', ').toLowerCase()}`,
    `They measure different primary variables: ${a.variables[0]} vs ${b.variables[0]}`,
  ];

  if (a.authors.some(au => b.authors.includes(au))) {
    similarities.push('They share one or more authors');
  } else {
    differences.push('They were conducted by different research teams');
  }

  return { similarities, differences };
}
