import React from 'react';
import './Documentation.css';

/*
 * Longer, more detailed documentation.
 * Also fixes the React style error by using style={{ color: "blue" }} (object) instead of style="color: blue".
 */

const Documentation: React.FC = () => {
  return (
    <div className="doc-container">
      <h1 className="doc-title">Regionalization to ADM2</h1>

      {/* 1. INTRODUCTION & CONTEXT */}
      <section className="doc-section">
        <h2>1. Introduction & Context</h2>
        <p>
          This documentation provides an <strong>exploratory guide</strong> on how to re-aggregate Impact Region (<em>IR</em>)-level data to a standard <em>ADM2</em> boundary system. The impetus comes from internal discussion threads on reorganizing climate impact and damage data, originally shaped by <strong>GADM 2.0</strong>. Since GADM 2.0 is no longer publicly available, we rely on <a href="https://gadm.org/old_versions.html#google_vignette" target="_blank" rel="noreferrer">GADM 3.6</a> to preserve many older identifiers.
        </p>
        <p>
        The primary aim is to present climate-related damage data at the ADM2 level, with future expansions to ADM1. In some countries—like the <strong>United States</strong>—ADM2 aligns closely with IR boundaries, while in others (such as <strong>China</strong>, <strong>Estonia</strong>, or <strong>India</strong>) administrative differences and reforms can create partial overlaps or mismatches.
        </p>
        <p>
          This site is meant for <em>exploration</em>, so is not optimized. Complex countries (e.g., <strong>Brazil</strong>, <strong>India</strong>) may have slower rendering times. Countries without ADM2 definitions (only ADM1) are excluded in this iteration.
        </p>
      </section>

      {/* 2. METHODOLOGY OVERVIEW */}
      <section className="doc-section">
        <h2>2. Methodology Overview</h2>
        <p>
          The IR-to-ADM2 reaggregation process can be broken down into the following conceptual steps:
        </p>
        <ol>
          <li>
            <strong>Classification of IR/ADM2 Relationships:</strong> We first identify whether an IR aligns exactly with an ADM2, covers multiple ADM2 units, or is nested within a single ADM2. This classification is central to the logic we apply later.
          </li>
          <li>
            <strong>Case Handling:</strong> Once we know how IR and ADM2 polygons overlap or match, we either <em>disaggregate</em> (if an IR is bigger than ADM2) or <em>aggregate</em> (if multiple IRs fall within one ADM2) the impact values. The scripts accomplish this by checking ID matches and, if those fail, by computing geometric overlaps.
          </li>
        </ol>
        <p>
          The impetus for this approach is an internal suggestion that <strong>ADM2 is not always above IR</strong>, meaning some IRs span multiple ADM2 units (especially post-boundary reforms). Meanwhile, certain IRs remain smaller than or aligned with ADM2. The following sections outline the logic for each scenario.
        </p>
      </section>

      {/* 3. DISAGGREGATION LOGIC (IR -> MULTIPLE ADM2) */}
      <section className="doc-section">
        <h2>3. Disaggregation Logic (IR → Multiple ADM2)</h2>
        <p>
          <strong>Disaggregation</strong> refers to splitting an IR’s total impact across several ADM2 units. This is frequently needed when IR boundaries exceed those of ADM2. We adapt a method suggested in our internal Slack channel:
        </p>
        <ol>
          <li>
            <strong>Aggregated Files Check:</strong> If an ADM2-level dataset ("aggregated file") already provides values, use those directly.
          </li>
          <li>
            <strong>Otherwise, use IR-level data:</strong> Identify the IR that encloses or mostly overlaps the ADM2. Then:
            <ul>
              <li>
                <strong>Absolute values (e.g., total damages):</strong> Let the IR hold a total <em>V<sub>IR</sub></em> and have population <em>P<sub>IR</sub></em>. We convert that to a rate <code>V<sub>IR</sub> / P<sub>IR</sub></code>, then multiply by <em>P<sub>adm</sub></em> (the ADM2’s population):
                <br/>
                <code>Value<sub>ADM2</sub> = (V<sub>IR</sub> / P<sub>IR</sub>) &times; P<sub>adm</sub></code>
              </li>
              <li>
                <strong>Rate values (e.g., mortality rate):</strong> If the IR metric is already a rate (like deaths per 1,000 people), we simply apply <code>Rate<sub>IR</sub> &times; P<sub>adm</sub></code> to compute the ADM2 total.
              </li>
            </ul>
          </li>
        </ol>
        <p>
          This ensures that an IR’s total gets subdivided among all the smaller ADM2 polygons it overlaps, typically weighting by population. We rely on either the IR’s own population values or <a href="https://landscan.ornl.gov/" target="_blank" rel="noreferrer">LandScan</a> if no IR population is available.
        </p>
        <p>
          For example, <strong>Estonia</strong> has encountered boundary reforms that make certain older IR polygons bigger than the newly defined ADM2. The scripts thus disaggregate by dividing IR totals into multiple ADM2 entries.
        </p>
      </section>

      {/* 4. AGGREGATION LOGIC (MULTIPLE IR -> SINGLE ADM2) */}
      <section className="doc-section">
        <h2>4. Aggregation Logic (Multiple IR → Single ADM2)</h2>
        <p>
          <strong>Aggregation</strong> applies when an ADM2 boundary encompasses multiple IR polygons. For instance, <strong>China</strong> often has large ADM2 districts that are subdivided into smaller IRs. In that scenario, we sum or average the IR values:
        </p>
        <ul>
          <li>
            <strong>Additive metrics:</strong> If IR data is a total count, we just add them. If IR1 has V1, IR2 has V2, and IR3 has V3, the ADM2’s total is <code>V1 + V2 + V3</code>.
          </li>
          <li>
            <strong>Rate metrics:</strong> If IR data is a rate (e.g., mortality per capita), let IR<sub>k</sub> have a population <em>P<sub>k</sub></em> and rate <em>r<sub>k</sub></em>. Then the ADM2’s overall rate <em>r<sub>ADM2</sub></em> is a population-weighted average:
            <br/>
            <code>r<sub>ADM2</sub> = [ Σ(r<sub>k</sub> &times; P<sub>k</sub>) ] / [ Σ P<sub>k</sub> ]</code>
          </li>
        </ul>
        <p>
          Because some IRs come bundled with their own population (from GADM 2.0), we use that first. Otherwise, we fallback to <a href="https://landscan.ornl.gov/" target="_blank" rel="noreferrer">LandScan</a> or a similar dataset.
        </p>
        <p>
          This logic is especially relevant for countries with large administrative units. <strong>China</strong>, for instance, sees multiple IR polygons combining into a single ADM2 region.
        </p>
      </section>

      {/* 5. CASE TYPES & LEGEND */}
      <section className="doc-section">
        <h2>5. Case Types & Legend</h2>
        <p>
          For mapping clarity, we classify each ADM2 boundary according to how it relates to IR polygons. Below is the legend used in our map interface:
        </p>
        <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
          <strong>Colors representing each case:</strong>
        </p>
        <ul>
          <li><span style={{ color: "blue" }}>Blue</span>: <strong>Case 1</strong> – IR = ADM2</li>
          <li><span style={{ color: "green" }}>Green</span>: <strong>Case 2a</strong> – IR ⊃ ADM2 (1 ADM1)</li>
          <li><span style={{ color: "#98fb98" }}>Light Green</span>: <strong>Case 2b</strong> – IR ⊃ ADM2 (multi ADM1)</li>
          <li><span style={{ color: "yellow" }}>Yellow</span>: <strong>Case 3a</strong> – ADM2 ⊃ IR (1 ADM1)</li>
          <li><span style={{ color: "red" }}>Red</span>: <strong>Case 3b</strong> – ADM2 ⊃ IR (multi ADM1)</li>
          <li><span style={{ color: "grey" }}>Grey</span>: <strong>Case 4</strong> – ADM2 with no IR assigned</li>
        </ul>
        <p>
          <strong>Impact Regions (IR)</strong> are shown in <span style={{ color: "lime" }}>lime green</span>.
        </p>
        <p>
          While this documentation focuses on typical <strong>Case 1, 2a, and 3a</strong>, other edge cases (2b, 3b, 4) arise less often and may need deeper review (pending).
        </p>

        {/* CASE 1: IR = ADM2 */}
        <div className="doc-case">
          <div className="doc-text">
            <h3>Case 1: IR = ADM2</h3>
            <p>
              This is the simplest case: the IR polygon exactly matches an ADM2 boundary, both in geometry and (optionally) ID. No disaggregation or aggregation is required:
            </p>
            <p className="formula">Value<sub>ADM2</sub> = Value<sub>IR</sub></p>
            <p>
              <strong>USA</strong> is a classic example, where counties (ADM2) often map 1:1 with IR definitions.
            </p>
          </div>
          <img src="/images/case1.png" alt="Case 1" className="doc-img right" />
        </div>

        {/* CASE 2a: IR bigger than multiple ADM2, same ADM1 */}
        <div className="doc-case">
          <img src="/images/case2a.png" alt="Case 2a" className="doc-img left" />
          <div className="doc-text">
            <h3>Case 2a: IR ⊃ Multiple ADM2 (1 ADM1)</h3>
            <p>
              A single IR covers several ADM2 polygons, but all under the same ADM1. We disaggregate the IR’s total value across these ADM2 units, typically using population-based weights. For an absolute measure, we might do:
            </p>
            <p className="formula">Value<sub>ADM2<sub>i</sub></sub> = (P<sub>i</sub> / P<sub>IR</sub>) &times; Value<sub>IR</sub></p>
            <p>
              <strong>Estonia</strong> often exhibits this scenario post-reform, with IR shapes spanning multiple new ADM2 lines.
            </p>
          </div>
        </div>

        {/* CASE 3a: multiple IR within single ADM2 */}
        <div className="doc-case">
          <div className="doc-text">
            <h3>Case 3a: ADM2 ⊃ Multiple IRs (1 ADM1)</h3>
            <p>
              Here, an ADM2 boundary encloses multiple IR polygons. We aggregate IR values upward:
            </p>
            <ul>
              <li><strong>Additive metrics:</strong> Sum the IR totals.</li>
              <li><strong>Rate metrics:</strong> Weighted average by IR population. If IR<sub>k</sub> has r<sub>k</sub> and P<sub>k</sub>, then
                <p className="formula">r<sub>ADM2</sub> = Σ(r<sub>k</sub> &times; P<sub>k</sub>) / Σ P<sub>k</sub></p>
              </li>
            </ul>
            <p>
              <strong>China</strong> frequently shows this pattern, as some ADM2 districts include multiple smaller IR polygons.
            </p>
          </div>
          <img src="/images/case3a.png" alt="Case 3a" className="doc-img right" />
        </div>
      </section>

      {/* 6. POPULATION VS AREA WEIGHTS */}
      <section className="doc-section">
        <h2>6. Population vs. Area Weights</h2>
        <p>
          <strong>Population weighting</strong> is preferred for disaggregation/aggregation in human-focused impacts (e.g., mortality, economic losses). We can use IR-level population (if known) or <a href="https://landscan.ornl.gov/" target="_blank" rel="noreferrer">LandScan</a> to fill gaps.
        </p>
        <p>
          If neither IR nor LandScan data is available, an <strong>area-based approach</strong> partitions the IR based on the fraction of polygon overlap with each ADM2. This is less precise for metrics tied strongly to human distribution, but still offers a fallback.
        </p>
      </section>

      {/* 7. RENDERING & CAVEATS */}
      <section className="doc-section">
        <h2>7. Rendering & Caveats</h2>
        <ul>
          <li>This site remains <em>exploratory</em> and not performance-optimized. Large or complex countries can be slow to render.</li>
          <li>Countries lacking ADM2 definitions remain excluded. Only standard ADM2 polygons are handled in this version.</li>
          <li>IR polygons appear in lime green, while ADM2 polygons are color-coded by case type (see legend above).</li>
          <li>Cases involving multi-ADM1 overlaps (2b, 3b) or an ADM2 with no assigned IR (Case 4) may be partially implemented.</li>
        </ul>
        <p>
          For code references—ID parsing, geometric intersection, weighting—visit:
        </p>
        <p>
          <a href="https://github.com/ClimateImpactLab/it-to-adm" target="_blank" rel="noreferrer">https://github.com/ClimateImpactLab/it-to-adm</a>
        </p>
      </section>
    </div>
  );
};

export default Documentation;
