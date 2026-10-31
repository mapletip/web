import { DEFAULT_THEME } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import { PALETTES } from '../palettes.data';
import { getPalette, resolvePaletteTheme } from '../themeAdapter';

describe('MapleTip Palette Exploration Studio & Theme Adapter', () => {
  it('includes 47 complete palettes covering approved, new, regional, and historical directions', () => {
    expect(PALETTES.length).toBe(47);

    const approved = PALETTES.filter((p) => p.category === 'approved');
    const newDirections = PALETTES.filter((p) => p.category === 'new-direction');
    const regional = PALETTES.filter((p) => p.category === 'historical-regional');
    const brandKits = PALETTES.filter((p) => p.category === 'historical-brand');
    const orangeBrand5 = PALETTES.filter((p) => p.category === 'historical-orange-brand');
    const complete10 = PALETTES.filter((p) => p.category === 'historical-complete');
    const orange10 = PALETTES.filter((p) => p.category === 'historical-orange');

    expect(approved.length).toBe(1);
    expect(newDirections.length).toBe(12);
    expect(regional.length).toBe(3);
    expect(brandKits.length).toBe(6); // 5 early brand directions + 1 PR #7 original
    expect(orangeBrand5.length).toBe(5);
    expect(complete10.length).toBe(10);
    expect(orange10.length).toBe(10);
  });

  it('classifies new directions including Approved v7 (Twilight Links) and MapleTip 2005 Classic into their designated review statuses', () => {
    const newDirections = PALETTES.filter((p) => p.category === 'new-direction');
    const shortlist = newDirections.filter((p) => p.reviewStatus === 'Shortlist');
    const conditional = newDirections.filter((p) => p.reviewStatus === 'Conditional');
    const challenges = newDirections.filter((p) => p.reviewStatus === 'Challenge');

    expect(shortlist.length).toBe(6);
    expect(conditional.length).toBe(2);
    expect(challenges.length).toBe(4);

    expect(shortlist.map((p) => p.id)).toEqual([
      'approved-v7-twilight-links',
      'mapletip-2005-classic',
      'signal-tangerine',
      'lantern-noir',
      'amber-wireframe',
      'volcanic-stage',
    ]);
  });

  it('calculates weighted rubric scores according to the 30/25/20/15/10 weight model', () => {
    for (const palette of PALETTES) {
      const s = palette.scores;
      const expected =
        s.identity * 0.3 +
        s.legibility * 0.25 +
        s.coherence * 0.2 +
        s.states * 0.15 +
        s.accessibility * 0.1;
      expect(Math.abs(s.weighted - expected)).toBeLessThan(0.05);
    }
  });

  it('safely falls back to approved-v7 for undefined or unknown palette IDs', () => {
    const fallbackEmpty = getPalette(undefined);
    expect(fallbackEmpty.id).toBe('approved-v7');

    const fallbackUnknown = getPalette('non-existent-id');
    expect(fallbackUnknown.id).toBe('approved-v7');
  });

  it('preserves production theme and CSS variable resolver untouched for approved-v7', () => {
    const config = resolvePaletteTheme('approved-v7');
    expect(config.palette.id).toBe('approved-v7');
    const vars = config.cssVariablesResolver(DEFAULT_THEME);
    expect(vars.light['--mapletip-color-canvas']).toBe('#FAFAFB');
    expect(vars.dark['--mapletip-color-canvas']).toBe('#111114');
  });

  it('generates fully populated CSS variables for experimental palettes', () => {
    const config = resolvePaletteTheme('signal-tangerine');
    expect(config.palette.id).toBe('signal-tangerine');

    const vars = config.cssVariablesResolver(DEFAULT_THEME);
    expect(vars.light['--mapletip-color-canvas']).toBe('#F9FAFC');
    expect(vars.light['--mapletip-color-brand']).toBe('#ED8127');
    expect(vars.light['--mapletip-color-cta']).toBe('#B95016');
    expect(vars.dark['--mapletip-color-canvas']).toBe('#111318');
    expect(vars.dark['--mapletip-color-brand']).toBe('#FF9D4D');
    expect(vars.dark['--mapletip-color-cta']).toBe('#D96820');
  });

  it('every palette specifies valid hex color tokens for both light and dark modes', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const p of PALETTES) {
      expect(p.light.canvas).toMatch(hexRegex);
      expect(p.light.panel).toMatch(hexRegex);
      expect(p.light.raised).toMatch(hexRegex);
      expect(p.light.brand).toMatch(hexRegex);
      expect(p.light.link).toMatch(hexRegex);
      expect(p.light.cta.background).toMatch(hexRegex);
      expect(p.light.cta.foreground).toMatch(hexRegex);

      expect(p.dark.canvas).toMatch(hexRegex);
      expect(p.dark.panel).toMatch(hexRegex);
      expect(p.dark.raised).toMatch(hexRegex);
      expect(p.dark.brand).toMatch(hexRegex);
      expect(p.dark.link).toMatch(hexRegex);
      expect(p.dark.cta.background).toMatch(hexRegex);
      expect(p.dark.cta.foreground).toMatch(hexRegex);
    }
  });

  it('correctly wires the new Approved v7 (Twilight Links) theme', () => {
    const config = resolvePaletteTheme('approved-v7-twilight-links');
    expect(config.palette.name).toBe('Approved v7 (Twilight Links)');
    expect(config.palette.light.link).toBe('#8A3E0C');
    expect(config.palette.dark.link).toBe('#F5BB7B');
    expect(config.palette.light.canvas).toBe('#FAFAFB');
    expect(config.palette.dark.canvas).toBe('#111114');

    const vars = config.cssVariablesResolver(DEFAULT_THEME);
    expect(vars.light['--mapletip-color-link']).toBe('#8A3E0C');
    expect(vars.light['--mantine-color-anchor']).toBe('#8A3E0C');
    expect(vars.dark['--mapletip-color-link']).toBe('#F5BB7B');
    expect(vars.dark['--mantine-color-anchor']).toBe('#F5BB7B');
  });

  it('correctly provides restrained, less-blue neutral tokens for Maple Twilight', () => {
    const config = resolvePaletteTheme('maple-twilight-pr7');
    expect(config.palette.name).toBe('Maple Twilight');
    expect(config.palette.dark.canvas).toBe('#111417');
    expect(config.palette.dark.panel).toBe('#1A1D20');
    expect(config.palette.dark.raised).toBe('#22262B');
    expect(config.palette.dark.borderSubtle).toBe('#2C3137');
    expect(config.palette.dark.textPrimary).toBe('#F4F1EA');
    expect(config.palette.dark.textSecondary).toBe('#C0C4C8');

    expect(config.palette.light.canvas).toBe('#E4D8C8');
    expect(config.palette.light.panel).toBe('#F2E9DD');
    expect(config.palette.light.textPrimary).toBe('#24272A');
    expect(config.palette.light.textSecondary).toBe('#575B60');
    expect(config.palette.light.link).toBe('#8A3E0C');

    const vars = config.cssVariablesResolver(DEFAULT_THEME);
    expect(vars.dark['--mapletip-color-canvas']).toBe('#111417');
    expect(vars.dark['--mapletip-color-panel']).toBe('#1A1D20');
    expect(vars.light['--mapletip-color-canvas']).toBe('#E4D8C8');
    expect(vars.light['--mapletip-color-panel']).toBe('#F2E9DD');
  });

  it('correctly wires the MapleTip 2005 Classic theme', () => {
    const config = resolvePaletteTheme('mapletip-2005-classic');
    expect(config.palette.name).toBe('MapleTip 2005 Classic');
    expect(config.palette.light.canvas).toBe('#FAF7F3');
    expect(config.palette.light.panel).toBe('#FFFFFF');
    expect(config.palette.light.raised).toBe('#F7EBDB');
    expect(config.palette.light.borderStrong).toBe('#BB6109');
    expect(config.palette.light.link).toBe('#DF0E19');
    expect(config.palette.light.cta.background).toBe('#B15604');
    expect(config.palette.light.selection).toBe('#FFF3DB');

    // Locked-in Maple Twilight dark mode
    expect(config.palette.dark.canvas).toBe('#111417');
    expect(config.palette.dark.panel).toBe('#1A1D20');
    expect(config.palette.dark.raised).toBe('#22262B');
    expect(config.palette.dark.link).toBe('#F0A456');

    const vars = config.cssVariablesResolver(DEFAULT_THEME);
    expect(vars.light['--mapletip-color-canvas']).toBe('#FAF7F3');
    expect(vars.light['--mapletip-color-panel']).toBe('#FFFFFF');
    expect(vars.light['--mapletip-color-link']).toBe('#DF0E19');
    expect(vars.light['--mantine-color-anchor']).toBe('#DF0E19');
    expect(vars.light['--mapletip-link-weight']).toBe('inherit');
    expect(vars.light['--mapletip-link-decoration-thickness']).toBe('1px');
    expect(vars.light['--mapletip-color-link-hover']).toBe('#B11820');
    expect(vars.light['--mapletip-link-hover-decoration']).toBe('none');
    expect(vars.light['--mapletip-color-cta']).toBe('#B15604');
    expect(vars.dark['--mapletip-color-canvas']).toBe('#111417');
    expect(vars.dark['--mapletip-color-panel']).toBe('#1A1D20');
    expect(vars.dark['--mapletip-link-weight']).toBe('inherit');
  });
});
