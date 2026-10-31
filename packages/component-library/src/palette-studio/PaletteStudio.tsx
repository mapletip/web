import {
  Badge,
  Button,
  Checkbox,
  Group,
  MantineProvider,
  Paper,
  Text,
  TextInput,
} from '@mantine/core';
import {
  ArrowSquareOut,
  MagnifyingGlass,
  Moon,
  PaintBrush,
  Sun,
} from '@phosphor-icons/react';
import React, { useMemo, useState } from 'react';

import { PALETTES } from './palettes.data';
import classes from './PaletteStudio.module.css';
import { getPalette, resolvePaletteTheme } from './themeAdapter';
import type { PaletteCategory, ReviewStatus } from './types';

interface PaletteStudioProps {
  initialPaletteId?: string | undefined;
  initialColorScheme?: 'light' | 'dark' | undefined;
}

type FilterCategory = 'all' | 'shortlist' | 'new-10' | PaletteCategory;

export const PaletteStudio: React.FC<PaletteStudioProps> = ({
  initialPaletteId = 'approved-v7',
  initialColorScheme = 'dark',
}) => {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(initialPaletteId);
  const [specimenScheme, setSpecimenScheme] = useState<'light' | 'dark'>(initialColorScheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<'weighted' | 'identity' | 'legibility' | 'name'>('weighted');

  // Specimen theme resolution
  const activePalette = useMemo(() => getPalette(selectedPaletteId), [selectedPaletteId]);
  const activeThemeConfig = useMemo(() => resolvePaletteTheme(selectedPaletteId), [selectedPaletteId]);

  // Filtering and sorting
  const filteredPalettes = useMemo(() => {
    return PALETTES.filter((p) => {
      // Category filter
      if (activeCategory === 'shortlist' && p.reviewStatus !== 'Shortlist') return false;
      if (activeCategory === 'new-10' && p.category !== 'new-direction') return false;
      if (
        activeCategory !== 'all' &&
        activeCategory !== 'shortlist' &&
        activeCategory !== 'new-10' &&
        p.category !== activeCategory
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchThesis = p.thesis.toLowerCase().includes(query);
        const matchFeature = p.distinctiveFeature.toLowerCase().includes(query);
        const matchTag = p.tag.toLowerCase().includes(query);
        return matchName || matchThesis || matchFeature || matchTag;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'weighted') return b.scores.weighted - a.scores.weighted;
      if (sortBy === 'identity') return b.scores.identity - a.scores.identity;
      if (sortBy === 'legibility') return b.scores.legibility - a.scores.legibility;
      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, searchQuery, sortBy]);

  const getStatusClass = (status: ReviewStatus) => {
    switch (status) {
      case 'Approved':
        return classes['statusApproved'];
      case 'Shortlist':
        return classes['statusShortlist'];
      case 'Conditional':
        return classes['statusConditional'];
      case 'Challenge':
        return classes['statusChallenge'];
      case 'Archived':
        return classes['statusArchived'];
      case 'Rejected':
        return classes['statusRejected'];
      default:
        return '';
    }
  };

  return (
    <div className={classes['studioRoot']}>
      {/* Header */}
      <header className={classes['studioHeader']}>
        <div className={classes['titleRow']}>
          <h1 className={classes['studioTitle']}>
            <span className={classes['brandAnchor']} aria-hidden="true" />
            MapleTip Palette Exploration Studio
          </h1>
          <Group gap="xs">
            <Badge size="lg" variant="light" color="walnut">
              Active: {activePalette.name}
            </Badge>
            <Badge size="lg" variant="outline" color="gray">
              {specimenScheme.toUpperCase()} MODE
            </Badge>
          </Group>
        </div>
        <p className={classes['studioSubtitle']}>
          Contracted Design Studio review matrix. Explore 45 brand palettes (1 approved baseline, 10
          new strategic directions, 3 regional kits, and 31 historical studies) across light and dark
          modes with live component specimens.
        </p>

        {/* Rubric Weights Bar */}
        <div className={classes['rubricBar']}>
          <span className={classes['rubricLabel']}>Evaluation Rubric:</span>
          <span className={classes['rubricPill']}>
            Brand Identity: <span className={classes['rubricWeight']}>30%</span>
          </span>
          <span className={classes['rubricPill']}>
            Data Legibility: <span className={classes['rubricWeight']}>25%</span>
          </span>
          <span className={classes['rubricPill']}>
            Visual Coherence: <span className={classes['rubricWeight']}>20%</span>
          </span>
          <span className={classes['rubricPill']}>
            State Visibility: <span className={classes['rubricWeight']}>15%</span>
          </span>
          <span className={classes['rubricPill']}>
            WCAG AA Compliance: <span className={classes['rubricWeight']}>10%</span>
          </span>
        </div>
      </header>

      {/* Active Palette Live Specimen Sandbox */}
      <section className={classes['specimenSection']} aria-label="Interactive Specimen Sandbox">
        <div className={classes['specimenHeader']}>
          <h2 className={classes['specimenTitle']}>
            <PaintBrush size={20} weight="bold" />
            Live Specimen Sandbox: {activePalette.name}
          </h2>
          <div className={classes['specimenControls']}>
            <Button
              size="xs"
              variant={specimenScheme === 'dark' ? 'filled' : 'subtle'}
              color="walnut"
              leftSection={<Moon size={14} />}
              onClick={() => setSpecimenScheme('dark')}
            >
              Dark Mode
            </Button>
            <Button
              size="xs"
              variant={specimenScheme === 'light' ? 'filled' : 'subtle'}
              color="walnut"
              leftSection={<Sun size={14} />}
              onClick={() => setSpecimenScheme('light')}
            >
              Light Mode
            </Button>
            <Button
              component="a"
              href={`?path=/story/components-facetedbrowser--default&globals=brandPalette:${activePalette.id}&globals=colorScheme:${specimenScheme}`}
              size="xs"
              variant="outline"
              color="walnut"
              rightSection={<ArrowSquareOut size={14} />}
            >
              Launch in FacetedBrowser
            </Button>
          </div>
        </div>

        {/* Dynamic theme wrapper for the specimen */}
        <MantineProvider
          key={`${activePalette.id}-${specimenScheme}`}
          theme={activeThemeConfig.theme}
          cssVariablesResolver={activeThemeConfig.cssVariablesResolver}
          forceColorScheme={specimenScheme}
        >
          <div className={classes['specimenGrid']}>
            {/* Left Column: UI Controls & Actions */}
            <Paper className={classes['specimenCard']} withBorder>
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
                Interactive Controls & Semantic Badges
              </Text>
              <div className={classes['specimenControlsRow']}>
                <TextInput
                  placeholder="Filter MapleTip items..."
                  size="sm"
                  style={{ flex: 1, minWidth: 200 }}
                  leftSection={<MagnifyingGlass size={16} />}
                />
                <Button size="sm" color="walnut" variant="filled">
                  Apply Filter
                </Button>
                <Button size="sm" color="walnut" variant="subtle">
                  Reset
                </Button>
              </div>

              {/* Badges & Chips */}
              <Text size="xs" fw={600} c="dimmed" mb={6}>
                Filter Chips & Status Indicators
              </Text>
              <Group gap="xs" mb="md" wrap="wrap">
                <Badge color="maple" variant="filled" size="md">
                  Active: Level 70+
                </Badge>
                <Badge color="gray" variant="light" size="md">
                  Job: Warrior
                </Badge>
                <Badge color="gray" variant="light" size="md">
                  Weapon: 1H Sword
                </Badge>
                <Badge
                  style={{
                    backgroundColor: 'var(--mapletip-color-status-success-bg)',
                    color: 'var(--mapletip-color-status-success)',
                    border: '1px solid var(--mapletip-color-status-success)',
                  }}
                  size="sm"
                >
                  Verified
                </Badge>
                <Badge
                  style={{
                    backgroundColor: 'var(--mapletip-color-status-warning-bg)',
                    color: 'var(--mapletip-color-status-warning)',
                    border: '1px solid var(--mapletip-color-status-warning)',
                  }}
                  size="sm"
                >
                  Rare Drop
                </Badge>
                <Badge
                  style={{
                    backgroundColor: 'var(--mapletip-color-status-danger-bg)',
                    color: 'var(--mapletip-color-status-danger)',
                    border: '1px solid var(--mapletip-color-status-danger)',
                  }}
                  size="sm"
                >
                  Deprecated
                </Badge>
              </Group>

              {/* Form Checkboxes & Links */}
              <Group gap="lg">
                <Checkbox label="Selected for compare" defaultChecked />
                <Checkbox label="Show hidden stats" />
                <a
                  href="#specimen"
                  style={{
                    color: 'var(--mapletip-color-link)',
                    fontSize: '0.875rem',
                    fontWeight: 'var(--mapletip-link-weight, inherit)',
                    textDecoration: 'underline',
                    textDecorationThickness:
                      'var(--mapletip-link-decoration-thickness, auto)',
                  }}
                >
                  View full drop tables →
                </a>
              </Group>
            </Paper>

            {/* Right Column: Mini Reference Table */}
            <Paper className={classes['specimenCard']} withBorder>
              <Text size="xs" fw={600} c="dimmed" mb="xs" tt="uppercase">
                Reference Table & Row Hierarchy
              </Text>
              <table className={classes['specimenMiniTable']}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Req. Lv</th>
                    <th>ATK</th>
                    <th>Speed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={classes['specimenRowSelected']}>
                    <td>
                      <a
                        href="#item1"
                        style={{
                          color: 'var(--mapletip-color-link)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Gladius
                      </a>
                    </td>
                    <td>25</td>
                    <td>42</td>
                    <td>Fast (5)</td>
                    <td>
                      <span
                        style={{
                          color: 'var(--mapletip-color-status-success)',
                          fontWeight: 600,
                        }}
                      >
                        Available
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a
                        href="#item2"
                        style={{
                          color: 'var(--mapletip-color-link)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Red Whip
                      </a>
                    </td>
                    <td>40</td>
                    <td>58</td>
                    <td>Faster (4)</td>
                    <td>
                      <span
                        style={{
                          color: 'var(--mapletip-color-status-warning)',
                          fontWeight: 600,
                        }}
                      >
                        Quest Drop
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a
                        href="#item3"
                        style={{
                          color: 'var(--mapletip-color-link)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Zard
                      </a>
                    </td>
                    <td>50</td>
                    <td>67</td>
                    <td>Normal (6)</td>
                    <td>
                      <span
                        style={{
                          color: 'var(--mapletip-color-status-success)',
                          fontWeight: 600,
                        }}
                      >
                        Available
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Paper>
          </div>
        </MantineProvider>
      </section>

      {/* Filter and Search Controls */}
      <div className={classes['filterBar']}>
        <div className={classes['filterControlsRow']}>
          <input
            type="text"
            className={classes['searchInput']}
            placeholder="Search palettes by name, thesis, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Group gap="xs">
            <Text size="xs" fw={600} c="dimmed">
              Sort by:
            </Text>
            <Button
              size="xs"
              variant={sortBy === 'weighted' ? 'filled' : 'subtle'}
              color="walnut"
              onClick={() => setSortBy('weighted')}
            >
              Rubric Score
            </Button>
            <Button
              size="xs"
              variant={sortBy === 'identity' ? 'filled' : 'subtle'}
              color="walnut"
              onClick={() => setSortBy('identity')}
            >
              Identity (30%)
            </Button>
            <Button
              size="xs"
              variant={sortBy === 'legibility' ? 'filled' : 'subtle'}
              color="walnut"
              onClick={() => setSortBy('legibility')}
            >
              Legibility (25%)
            </Button>
            <Button
              size="xs"
              variant={sortBy === 'name' ? 'filled' : 'subtle'}
              color="walnut"
              onClick={() => setSortBy('name')}
            >
              Name
            </Button>
          </Group>
        </div>

        {/* Category Pills */}
        <div className={classes['categoryPills']}>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'all' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Palettes ({PALETTES.length})
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'shortlist' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('shortlist')}
          >
            ✦ Shortlist (5)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'new-10' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('new-10')}
          >
            New Directions (10)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'historical-regional' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('historical-regional')}
          >
            Regional Themes (3)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'historical-brand' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('historical-brand')}
          >
            Historical Brand Kits (5)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'historical-orange-brand' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('historical-orange-brand')}
          >
            Historical Orange Kits (5)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'historical-complete' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('historical-complete')}
          >
            Complete Strategies (10)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'historical-orange' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('historical-orange')}
          >
            Orange Strategies (10)
          </button>
          <button
            type="button"
            className={`${classes['pillButton']} ${activeCategory === 'approved' ? classes['pillButtonActive'] : ''}`}
            onClick={() => setActiveCategory('approved')}
          >
            ★ Approved Baseline (1)
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className={classes['catalogGrid']}>
        {filteredPalettes.map((palette) => {
          const isSelected = palette.id === selectedPaletteId;

          return (
            <article
              key={palette.id}
              className={`${classes['paletteCard']} ${isSelected ? classes['paletteCardActive'] : ''}`}
            >
              {/* Card Header */}
              <div className={classes['cardHeader']}>
                <div>
                  <h3 className={classes['cardTitle']}>
                    {palette.id === 'approved-v7' ? '★ ' : ''}
                    {palette.name}
                  </h3>
                  <div className={classes['cardTag']}>{palette.tag}</div>
                </div>
                <span className={`${classes['statusBadge']} ${getStatusClass(palette.reviewStatus)}`}>
                  {palette.reviewStatus}
                </span>
              </div>

              {/* Swatches Section */}
              <div className={classes['cardSwatchesSection']}>
                {/* Light Mode Swatches */}
                <div className={classes['swatchRow']}>
                  <span className={classes['swatchModeLabel']}>Light</span>
                  <div className={classes['swatchStrip']}>
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.canvas }}
                      data-title={`Canvas: ${palette.light.canvas}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.panel }}
                      data-title={`Panel: ${palette.light.panel}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.raised }}
                      data-title={`Raised: ${palette.light.raised}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.brand }}
                      data-title={`Brand: ${palette.light.brand}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.link }}
                      data-title={`Link: ${palette.light.link}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.cta.background }}
                      data-title={`CTA: ${palette.light.cta.background}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.light.selection }}
                      data-title={`Selection: ${palette.light.selection}`}
                    />
                  </div>
                </div>

                {/* Dark Mode Swatches */}
                <div className={classes['swatchRow']}>
                  <span className={classes['swatchModeLabel']}>Dark</span>
                  <div className={classes['swatchStrip']}>
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.canvas }}
                      data-title={`Canvas: ${palette.dark.canvas}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.panel }}
                      data-title={`Panel: ${palette.dark.panel}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.raised }}
                      data-title={`Raised: ${palette.dark.raised}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.brand }}
                      data-title={`Brand: ${palette.dark.brand}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.link }}
                      data-title={`Link: ${palette.dark.link}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.cta.background }}
                      data-title={`CTA: ${palette.dark.cta.background}`}
                    />
                    <div
                      className={classes['swatchBlock']}
                      style={{ backgroundColor: palette.dark.selection }}
                      data-title={`Selection: ${palette.dark.selection}`}
                    />
                  </div>
                </div>
              </div>

              {/* Rubric Scores Row */}
              <div className={classes['cardScoreRow']}>
                <div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--mapletip-color-muted)' }}>
                    WEIGHTED SCORE
                  </span>
                  <div className={classes['scoreTotal']}>{palette.scores.weighted.toFixed(2)} / 5.0</div>
                </div>
                <div className={classes['scoresBreakdown']}>
                  <div className={classes['scoreItem']}>
                    <span>ID</span>
                    <span className={classes['scoreItemVal']}>{palette.scores.identity.toFixed(1)}</span>
                  </div>
                  <div className={classes['scoreItem']}>
                    <span>LEG</span>
                    <span className={classes['scoreItemVal']}>{palette.scores.legibility.toFixed(1)}</span>
                  </div>
                  <div className={classes['scoreItem']}>
                    <span>COH</span>
                    <span className={classes['scoreItemVal']}>{palette.scores.coherence.toFixed(1)}</span>
                  </div>
                  <div className={classes['scoreItem']}>
                    <span>STA</span>
                    <span className={classes['scoreItemVal']}>{palette.scores.states.toFixed(1)}</span>
                  </div>
                  <div className={classes['scoreItem']}>
                    <span>A11Y</span>
                    <span className={classes['scoreItemVal']}>{palette.scores.accessibility.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Design Details */}
              <p className={classes['cardThesis']}>«{palette.thesis}»</p>
              <p className={classes['cardFeature']}>{palette.distinctiveFeature}</p>

              <div className={classes['cardDetails']}>
                <div className={classes['detailRow']}>
                  <span className={classes['detailLabel']}>Best Case:</span>
                  <span className={classes['detailValBest']}>{palette.bestCase}</span>
                </div>
                <div className={classes['detailRow']}>
                  <span className={classes['detailLabel']}>Adversarial Risk:</span>
                  <span className={classes['detailValRisk']}>{palette.adversarialRisk}</span>
                </div>
                {palette.rejectionReason && (
                  <div className={classes['detailRow']}>
                    <span className={classes['detailLabel']}>Historical / Archive Note:</span>
                    <span>{palette.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={classes['cardActions']}>
                <button
                  type="button"
                  className={`${classes['actionButton']} ${isSelected ? classes['actionPrimary'] : classes['actionSecondary']}`}
                  onClick={() => setSelectedPaletteId(palette.id)}
                >
                  {isSelected ? 'Active in Sandbox ✓' : 'Preview in Studio'}
                </button>
                <a
                  className={`${classes['actionButton']} ${classes['actionSecondary']}`}
                  href={`?path=/story/components-facetedbrowser--default&globals=brandPalette:${palette.id}&globals=colorScheme:${specimenScheme}`}
                >
                  Browse →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
