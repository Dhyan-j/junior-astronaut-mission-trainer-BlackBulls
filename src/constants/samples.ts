import type { GeologicalSample } from '../types/game';
import { getTerrainHeight } from '../utils/terrainHeight';

export const INITIAL_GEOLOGICAL_SAMPLES: GeologicalSample[] = [
  {
    id: 'sample_anorthosite',
    name: 'Genesis Anorthosite',
    scientificName: 'Ferroan Anorthosite (Sample 15415 Analogue)',
    era: 'Pre-Nectarian (~4.41 Billion Years Ago)',
    rockType: 'Anorthosite',
    position: [28.0, getTerrainHeight(28.0, -32.0, 'exterior') + 0.15, -32.0],
    color: '#d4d8e2',
    description:
      'Pristine lunar crustal cumulate rock composed almost entirely of calcium-rich plagioclase feldspar. Crystallized during the primordial lunar magma ocean cooling phase.',
    composition: [
      { mineral: 'Anorthite Plagioclase', percentage: 94 },
      { mineral: 'Pyroxene', percentage: 4 },
      { mineral: 'Olivine', percentage: 2 },
    ],
    significance:
      'Direct evidence of the lunar magma ocean hypothesis and primordial planetary differentiation.',
    massGrams: 268.4,
    collected: false,
  },
  {
    id: 'sample_basalt',
    name: 'Lunar Basalt',
    scientificName: 'Ilmenite Olivine Basalt (Apollo 11 Analogue)',
    era: 'Imbrian (~3.65 Billion Years Ago)',
    rockType: 'Basalt',
    position: [42.0, getTerrainHeight(42.0, 20.0, 'exterior') + 0.15, 20.0],
    color: '#363940',
    description:
      'Vesicular, fine-to-medium grained volcanic lava rock extruded onto lunar maria basins from mantle melting at depths exceeding 200 kilometers.',
    composition: [
      { mineral: 'Clinopyroxene', percentage: 48 },
      { mineral: 'Plagioclase', percentage: 31 },
      { mineral: 'Ilmenite (FeTiO3)', percentage: 14 },
      { mineral: 'Olivine', percentage: 7 },
    ],
    significance:
      'Constrains thermal evolution and mantle composition of the Moon; rich in extractable titanium and oxygen.',
    massGrams: 342.1,
    collected: false,
  },
  {
    id: 'sample_breccia',
    name: 'Impact Breccia',
    scientificName: 'Polymict Impact Melt Breccia (Apollo 16 Analogue)',
    era: 'Nectarian (~3.92 Billion Years Ago)',
    rockType: 'Breccia',
    position: [-28.0, getTerrainHeight(-28.0, 42.0, 'exterior') + 0.15, 42.0],
    color: '#6e737d',
    description:
      'Cohesive shock-metamorphosed rock composed of angular mineral clasts cemented together in a fine-grained crystalline impact melt matrix.',
    composition: [
      { mineral: 'Impact Melt Matrix', percentage: 55 },
      { mineral: 'Anorthositic Clasts', percentage: 28 },
      { mineral: 'Troctolite Fragments', percentage: 12 },
      { mineral: 'Metallic Iron-Nickel', percentage: 5 },
    ],
    significance:
      'Dates the catastrophic Late Heavy Bombardment epoch that sculpted the inner solar system.',
    massGrams: 415.8,
    collected: false,
  },
  {
    id: 'sample_glass',
    name: 'Volcanic Glass',
    scientificName: 'Titanium-Rich Pyroclastic Beads (Apollo 17 Analogue)',
    era: 'Late Imbrian (~3.48 Billion Years Ago)',
    rockType: 'Volcanic Glass',
    position: [-36.0, getTerrainHeight(-36.0, -36.0, 'exterior') + 0.15, -36.0],
    color: '#d9822b',
    description:
      'Vitreous, micro-spheroidal orange volcanic glass droplets produced by explosive deep lunar fire-fountaining propelled by volatile gas expansion.',
    composition: [
      { mineral: 'Amorphous Titaniferous Glass', percentage: 88 },
      { mineral: 'Surface Volatiles (Zinc, Lead, Sulfur)', percentage: 8 },
      { mineral: 'Ilmenite Micro-Crystals', percentage: 4 },
    ],
    significance:
      'Key evidence for ancient indigenous volatile emissions and deep water-bearing lunar mantle reservoirs.',
    massGrams: 184.2,
    collected: false,
  },
];
