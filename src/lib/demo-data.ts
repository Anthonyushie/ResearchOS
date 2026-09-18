import type { ResearchRecord } from './mock-data';

/**
 * Demo library — clearly synthetic sample records for exploring ResearchOS
 * without a working Gemini key.
 *
 * Ids are scoped per owner (`demo-<ownerHash>-<slug>`) because `id` is the
 * table-wide primary key: fixed global ids would collide across users and
 * the upsert (which never reassigns owner_id) would leave the second user
 * with an empty library. The `demo-` prefix keeps the set removable via
 * DELETE /api/seed.
 */
function ownerHash(ownerId: string): string {
  let h = 5381;
  for (let i = 0; i < ownerId.length; i++) {
    h = ((h << 5) + h + ownerId.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function demoRecords(ownerId: string): ResearchRecord[] {
  const tag = ownerHash(ownerId);
  const id = (slug: string) => `demo-${tag}-${slug}`;
  const base: Array<Omit<ResearchRecord, 'ownerId'>> = [
    {
      id: id('nitrogen-maize'),
      title: 'Nitrogen Response in Rainfed Maize Across Two Seasons',
      type: 'paper',
      authors: ['A. Twan', 'M. Okafor'],
      date: '2024-11-02',
      topics: ['Soil Science', 'Crop Nutrition', 'Maize'],
      keywords: ['nitrogen', 'yield response', 'rainfed', 'fertilizer'],
      variables: ['N rate (kg/ha)', 'grain yield (t/ha)', 'soil organic carbon (%)'],
      experimentName: 'DEMO-N-MAIZE-24',
      description:
        'Two-season field trial testing nitrogen rates of 0, 60 and 120 kg/ha on rainfed maize, measuring grain yield and soil nitrogen carryover.',
      extractedText:
        'Nitrogen trials in maize over two seasons at Ibadan. Objective: test N rates 0, 60, 120 kg/ha. Method: randomized complete block design with four replicates per treatment. Results: 120 kg/ha raised grain yield 12% over the control in season one and 9% in season two. Soil nitrate carryover was negligible eight weeks after harvest. Limitation: single location; rainfall differed 22% between seasons.',
      summary: {
        objective: 'Quantify maize grain-yield response to three nitrogen rates under rainfed conditions.',
        method: 'Randomized complete block design, four replicates, two consecutive seasons.',
        keyFindings: [
          '120 kg N/ha raised grain yield 12% over control in season one.',
          'Response weakened to 9% in the drier second season.',
          'No meaningful soil nitrate carryover eight weeks post-harvest.',
        ],
        limitations: ['Single location; results may not transfer to other soils.', 'Rainfall varied 22% between seasons.'],
      },
      findings: [
        'Yield responded positively up to 120 kg N/ha.',
        'Economic optimum sat near 90 kg N/ha at local fertilizer prices.',
      ],
      limitations: ['Single location.', 'Two seasons only.'],
      fileName: 'demo-nitrogen-maize.pdf',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 480,
      extractionPages: 8,
    },
    {
      id: id('drip-tomato'),
      title: 'Drip Irrigation Scheduling Effects on Tomato Water-Use Efficiency',
      type: 'experiment',
      authors: ['L. Haddad'],
      date: '2025-02-14',
      topics: ['Irrigation', 'Water-Use Efficiency', 'Tomato'],
      keywords: ['drip', 'scheduling', 'evapotranspiration', 'fruit quality'],
      variables: ['irrigation level (% ETc)', 'marketable yield (kg/plot)', 'brix (°Bx)'],
      experimentName: 'DEMO-DRIP-TOM-25',
      description:
        'Greenhouse experiment comparing three drip scheduling levels (60, 80 and 100% of crop evapotranspiration) on tomato yield and fruit quality.',
      extractedText:
        'Tomato grown under greenhouse drip irrigation at 60, 80 and 100% ETc. The 80% treatment matched full-irrigation marketable yield while saving 21% water. Fruit brix peaked at 60% ETc but blossom-end rot incidence tripled. Recommendation: schedule at 80% ETc for the tested cultivar.',
      summary: {
        objective: 'Find the deficit-irrigation level that preserves tomato yield while saving water.',
        method: 'Greenhouse trial, three ETc-based scheduling levels, six replicates.',
        keyFindings: [
          '80% ETc matched full-irrigation marketable yield with 21% less water.',
          '60% ETc raised brix but tripled blossom-end rot.',
          'Water-use efficiency peaked at 80% ETc.',
        ],
        limitations: ['Single cultivar tested.', 'Greenhouse conditions differ from open field.'],
      },
      findings: [
        'Mild deficit irrigation (80% ETc) is the practical optimum.',
        'Severe deficit trades yield quality against disorder risk.',
      ],
      limitations: ['Single cultivar.', 'One growing season.'],
      fileName: 'demo-drip-tomato.pdf',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 420,
      extractionPages: 6,
    },
    {
      id: id('soil-carbon-survey'),
      title: 'Soil Organic Carbon Survey: 240 Smallholder Plots, 2023–2024',
      type: 'dataset',
      authors: ['ResearchOS Demo Team'],
      date: '2024-08-30',
      topics: ['Soil Science', 'Survey Data', 'Carbon'],
      keywords: ['soil organic carbon', 'smallholder', 'survey', 'georeferenced'],
      variables: ['SOC (%)', 'pH', 'plot size (ha)', 'cropping system'],
      experimentName: 'DEMO-SOC-SURVEY',
      description:
        'Tabular survey of 240 georeferenced smallholder plots with SOC, pH, plot size and cropping-system columns, collected across two seasons.',
      extractedText:
        'CSV with 240 data rows. Columns: plot_id, latitude, longitude, soc_pct, ph, plot_ha, cropping_system, season. Median SOC 1.4%; continuous-maize plots averaged 0.9% versus 1.8% under maize-legume rotation.',
      summary: {
        objective: 'Baseline soil carbon and acidity across smallholder plots to target rotation advice.',
        method: 'Stratified field sampling, lab SOC and pH analysis, two seasons.',
        keyFindings: [
          'Median SOC of 1.4% across all plots.',
          'Maize-legume rotations averaged double the SOC of continuous maize.',
        ],
        limitations: ['Sampling depth fixed at 0–15 cm.', 'No bulk-density measurements.'],
      },
      findings: [
        'Rotation history is the strongest SOC predictor in the set.',
        '38% of plots fall below the 1.0% SOC concern threshold.',
      ],
      limitations: ['Topsoil only.', 'Self-reported cropping histories.'],
      fileName: 'demo-soil-carbon.csv',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 260,
    },
    {
      id: id('biochar-yams'),
      title: 'Biochar Amendment and Yam Tuber Bulking on Sandy Loam',
      type: 'paper',
      authors: ['C. Eze', 'A. Twan', 'R. Mensah'],
      date: '2023-06-19',
      topics: ['Soil Amendments', 'Biochar', 'Yam'],
      keywords: ['biochar', 'tuber bulking', 'sandy loam', 'water retention'],
      variables: ['biochar rate (t/ha)', 'tuber weight (kg)', 'soil moisture (%)'],
      experimentName: 'DEMO-BIOCHAR-YAM-23',
      description:
        'Single-season trial of rice-husk biochar at 0, 5 and 10 t/ha on yam tuber bulking in sandy loam soils.',
      extractedText:
        'Rice-husk biochar applied at 0, 5 and 10 t/ha before yam planting. The 5 t/ha rate increased mean tuber weight 18% and mid-season soil moisture 9 points. The 10 t/ha rate showed no further gain and depressed early emergence slightly. Authors attribute gains to moisture retention rather than nutrients.',
      summary: {
        objective: 'Test whether rice-husk biochar improves yam tuber bulking on sandy loam.',
        method: 'Single-season randomized trial, three biochar rates, five replicates.',
        keyFindings: [
          '5 t/ha biochar raised mean tuber weight 18%.',
          '10 t/ha gave no additional gain and slowed emergence.',
          'Effect attributed to moisture retention, not nutrients.',
        ],
        limitations: ['One season and one soil type.', 'Biochar feedstock single-sourced.'],
      },
      findings: [
        'Moderate biochar rates beat high rates economically and agronomically.',
      ],
      limitations: ['Single season.', 'No multi-year carryover data.'],
      fileName: 'demo-biochar-yams.pdf',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 440,
      extractionPages: 7,
    },
    {
      id: id('fall-armyworm'),
      title: 'Fall Armyworm Scouting Thresholds in Early-Whorl Maize',
      type: 'experiment',
      authors: ['J. Banda', 'L. Haddad'],
      date: '2025-04-03',
      topics: ['Pest Management', 'Maize', 'IPM'],
      keywords: ['fall armyworm', 'scouting', 'threshold', 'whorl stage'],
      variables: ['infestation (%)', 'spray threshold (%)', 'yield loss (%)'],
      experimentName: 'DEMO-FAW-SCOUT-25',
      description:
        'Field cages and open plots relating early-whorl infestation levels to final yield loss, to set a spray threshold.',
      extractedText:
        'Fall armyworm infestation scored weekly from emergence to tasseling. Plots crossing 20% infested whorls at V4–V6 and left unsprayed lost 14–19% yield; spraying at that threshold held losses under 4%. Later infestations (V8+) caused under 5% loss even unsprayed.',
      summary: {
        objective: 'Set an evidence-based spray threshold for fall armyworm in early-whorl maize.',
        method: 'Paired sprayed/unsprayed plots across an infestation gradient, weekly scouting.',
        keyFindings: [
          '20% infested whorls at V4–V6 is the actionable threshold.',
          'Unsprayed early infestations lost 14–19% yield.',
          'Post-V8 infestations caused under 5% loss.',
        ],
        limitations: ['One agroecology.', 'Natural-enemy pressure not quantified.'],
      },
      findings: [
        'Early scouting pays; late sprays add little.',
      ],
      limitations: ['Single season.', 'Threshold untested on late-planted maize.'],
      fileName: 'demo-fall-armyworm.pdf',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 430,
      extractionPages: 5,
    },
    {
      id: id('market-prices'),
      title: 'Weekly Grain Market Prices, Three Districts (2024)',
      type: 'dataset',
      authors: ['ResearchOS Demo Team'],
      date: '2025-01-10',
      topics: ['Agricultural Economics', 'Market Data'],
      keywords: ['grain prices', 'maize', 'seasonality', 'districts'],
      variables: ['week', 'district', 'maize price (per 100kg)', 'beans price (per 100kg)'],
      experimentName: 'DEMO-MARKET-24',
      description:
        'Fifty-two weeks of retail grain prices from three district markets, suitable for seasonality and price-spread analysis.',
      extractedText:
        'CSV with 156 data rows (52 weeks × 3 districts). Columns: week, district, maize_100kg, beans_100kg. Maize prices trough in September–October and peak in April; inter-district spreads reach 18% at harvest.',
      summary: {
        objective: 'Document seasonal grain-price patterns to inform storage and sale timing.',
        method: 'Weekly enumerator price collection in three district markets.',
        keyFindings: [
          'Maize troughs at harvest (Sep–Oct), peaks in April.',
          'Inter-district spreads reach 18% at harvest.',
        ],
        limitations: ['Retail only; no farmgate series.', 'Three districts.'],
      },
      findings: [
        'Two-to-three-month storage captures most of the seasonal gain.',
      ],
      limitations: ['Single year.', 'No transport-cost breakdown.'],
      fileName: 'demo-market-prices.csv',
      aiProcessed: true,
      aiStatus: 'demo',
      aiModel: 'demo',
      extractionChars: 240,
    },
  ];
  return base.map((r) => ({ ...r, ownerId }));
}
